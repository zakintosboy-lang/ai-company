import type {
  AgentConfig,
  AgentRole,
  AgentStatus,
  ConversationEntry,
  LogCallback,
  StateCallback,
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

    const content = await this.provider.complete(system, this.conversationLog, maxTokens);
    this.conversationLog.push({ role: "assistant", content });
    return content;
  }

  // ── リセット ──────────────────────────────────────────────

  /** 新規実行サイクル開始時にログと状態を初期化する */
  reset() {
    this.conversationLog = [];
    this.setState("idle");
  }
}
