import Anthropic from "@anthropic-ai/sdk";
import type { ModelConfig, ConversationEntry } from "./types";

/**
 * LLM プロバイダーの共通インターフェース。
 * Claude / OpenAI / Gemini を役割ごとに差し替えられるよう抽象化する。
 */
export interface LLMProvider {
  complete(
    system: string,
    messages: ConversationEntry[],
    maxTokens: number
  ): Promise<string>;
}

class ClaudeProvider implements LLMProvider {
  private client = new Anthropic();
  constructor(private modelId: string) {}

  async complete(system: string, messages: ConversationEntry[], maxTokens: number): Promise<string> {
    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: maxTokens,
      system,
      messages,
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }
}

/**
 * OpenAI プロバイダー（将来実装）
 * OPENAI_API_KEY をセットし、openai パッケージを追加して実装する。
 */
class OpenAIProvider implements LLMProvider {
  constructor(private modelId: string) {}

  async complete(_system: string, _messages: ConversationEntry[], _maxTokens: number): Promise<string> {
    throw new Error(
      `OpenAI provider (${this.modelId}) は未実装です。` +
      "OPENAI_API_KEY を設定し、openai パッケージを追加してください。"
    );
  }
}

/**
 * Gemini プロバイダー（将来実装）
 * GEMINI_API_KEY をセットし、@google/generative-ai パッケージを追加して実装する。
 */
class GeminiProvider implements LLMProvider {
  constructor(private modelId: string) {}

  async complete(_system: string, _messages: ConversationEntry[], _maxTokens: number): Promise<string> {
    throw new Error(
      `Gemini provider (${this.modelId}) は未実装です。` +
      "GEMINI_API_KEY を設定し、@google/generative-ai パッケージを追加してください。"
    );
  }
}

export function createProvider(model: ModelConfig): LLMProvider {
  switch (model.provider) {
    case "claude":  return new ClaudeProvider(model.modelId);
    case "openai":  return new OpenAIProvider(model.modelId);
    case "gemini":  return new GeminiProvider(model.modelId);
    default: throw new Error(`Unknown provider: ${model.provider}`);
  }
}
