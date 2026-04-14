import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

function requireApiKey(envName: "OPENAI_API_KEY" | "GEMINI_API_KEY") {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`${envName} is not set`);
  }
  return value;
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

class OpenAIProvider implements LLMProvider {
  private client = new OpenAI({ apiKey: requireApiKey("OPENAI_API_KEY") });
  constructor(private modelId: string) {}

  async complete(system: string, messages: ConversationEntry[], maxTokens: number): Promise<string> {
    const response = await this.client.responses.create({
      model: this.modelId,
      instructions: system,
      max_output_tokens: maxTokens,
      input: messages.map((message) => ({
        type: "message" as const,
        role: message.role,
        content: message.content,
      })),
    });
    return response.output_text;
  }
}

const GEMINI_FALLBACK: Record<string, string> = {};

class GeminiProvider implements LLMProvider {
  private client = new GoogleGenerativeAI(requireApiKey("GEMINI_API_KEY"));
  constructor(private modelId: string) {}

  private async callModel(modelId: string, system: string, messages: ConversationEntry[], maxTokens: number): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: modelId,
      systemInstruction: system,
      generationConfig: { maxOutputTokens: maxTokens },
    });

    // Gemini は user/model 交互が必要で、最初は必ず user
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1]?.content ?? "";

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    return result.response.text();
  }

  async complete(system: string, messages: ConversationEntry[], maxTokens: number): Promise<string> {
    try {
      return await this.callModel(this.modelId, system, messages, maxTokens);
    } catch (error) {
      const fallbackId = GEMINI_FALLBACK[this.modelId];
      if (fallbackId && this.isServiceUnavailable(error)) {
        console.warn(`[Gemini] ${this.modelId} unavailable, falling back to ${fallbackId}`);
        return await this.callModel(fallbackId, system, messages, maxTokens);
      }
      throw error;
    }
  }

  private isServiceUnavailable(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes("503") || error.message.includes("Service Unavailable") || error.message.includes("high demand");
    }
    return false;
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
