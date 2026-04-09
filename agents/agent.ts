import type {
  AgentConfig,
  AgentRole,
  AgentStatus,
  ConversationEntry,
  LogCallback,
  StateCallback,
  ModelConfig,
} from "./types";
import { createProvider, type LLMProvider } from "./providers";

/**
 * Agent クラス。
 * 各エージェントは config（役割・判断基準・モデル）と
 * 実行時の state（状態・会話ログ）を持つ。
 */
export class Agent {
  readonly id: string;
  readonly role: AgentRole;
  readonly config: AgentConfig;

  private provider: LLMProvider;
  private onLog?: LogCallback;
  private onState?: StateCallback;

  /** 実行中に積み上がる会話ログ */
  conversationLog: ConversationEntry[] = [];
  status: AgentStatus = "idle";

  constructor(config: AgentConfig, onLog?: LogCallback, onState?: StateCallback) {
    this.id = config.id;
    this.role = config.role;
    this.config = config;
    this.provider = createProvider(config.model);
    this.onLog = onLog;
    this.onState = onState;
  }

  // ── 状態管理 ──────────────────────────────────────────────

  private setState(status: AgentStatus, lastMessage?: string) {
    this.status = status;
    this.onState?.({ agentId: this.id, status, lastMessage });
  }

  setIdle()                    { this.setState("idle"); }
  setWaiting(msg?: string)     { this.setState("waiting", msg); }
  setDone(msg?: string)        { this.setState("done", msg); }
  setReviewing()               { this.setState("reviewing"); }

  // ── ログ出力 ──────────────────────────────────────────────

  log(message: string) {
    this.onLog?.({ role: this.role, message });
    this.onState?.({ agentId: this.id, status: this.status, lastMessage: message });
  }

  // ── LLM 呼び出し ──────────────────────────────────────────

  /**
   * system プロンプトと userMessage を与えて LLM を呼び出す。
   * 会話ログに user / assistant ターンを追記する。
   */
  async think(system: string, userMessage: string, maxTokens = 1024): Promise<string> {
    this.setState("thinking");
    this.conversationLog.push({ role: "user", content: userMessage });
    const candidates = [this.config.model, ...buildFallbackModels(this.config.model)];

    let lastError: unknown;
    for (let i = 0; i < candidates.length; i++) {
      const model = candidates[i];
      const provider = i === 0 ? this.provider : createProvider(model);
      try {
        if (i > 0) {
          this.log(`一次モデルが混雑中のため、${model.displayName} に切り替えて続行します`);
        }
        const content = await provider.complete(system, this.conversationLog, maxTokens);
        this.conversationLog.push({ role: "assistant", content });
        return content;
      } catch (error) {
        lastError = error;
        if (!shouldFallback(error) || i === candidates.length - 1) {
          throw error;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("LLM call failed");
  }

  // ── リセット ──────────────────────────────────────────────

  /** 新規実行サイクル開始時にログと状態を初期化する */
  reset() {
    this.conversationLog = [];
    this.setState("idle");
  }
}

function buildFallbackModels(model: ModelConfig): ModelConfig[] {
  if (model.provider === "gemini") {
    return [
      { provider: "openai", modelId: "gpt-4.1", displayName: "GPT-4.1" },
      { provider: "claude", modelId: "claude-sonnet-4-5", displayName: "Claude Sonnet 4.5" },
    ];
  }

  if (model.provider === "openai") {
    return [
      { provider: "claude", modelId: "claude-sonnet-4-5", displayName: "Claude Sonnet 4.5" },
    ];
  }

  return [
    { provider: "openai", modelId: "gpt-4.1", displayName: "GPT-4.1" },
  ];
}

function shouldFallback(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("rate limit") ||
    message.includes("overloaded") ||
    message.includes("timeout")
  );
}
