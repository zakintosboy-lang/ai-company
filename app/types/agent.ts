export type AgentRole     = "ceo" | "manager" | "worker" | "reviewer" | "researcher" | "editor" | "designer" | "system";
export type AgentStatus   = "idle" | "thinking" | "reviewing" | "done" | "waiting";
export type ModelProvider = "claude" | "openai" | "gemini";

export interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
  displayName: string;
}

export interface AgentConfig {
  id: string;
  role: AgentRole;
  name: string;
  model: ModelConfig;
  criteria: string[];
}

export interface AgentCardData {
  config: AgentConfig;
  status: AgentStatus;
  lastMessage?: string;
}
