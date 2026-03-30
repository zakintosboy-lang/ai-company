export type AgentRole = "ceo" | "manager" | "worker" | "reviewer" | "system";
export type AgentStatus = "idle" | "thinking" | "reviewing" | "done" | "waiting";
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

export interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
}

export interface AgentLog {
  role: AgentRole;
  message: string;
}

export interface AgentStateUpdate {
  agentId: string;
  status: AgentStatus;
  lastMessage?: string;
}

export interface Task {
  id: string;
  workerId: string;
  description: string;
  criteria: string;
}

export interface WorkerOutput {
  taskId: string;
  workerId: string;
  output: string;
}

export interface ReviewResult {
  approved: boolean;
  feedback: string;
}

export interface CEODecision {
  approved: boolean;
  feedback: string;
  finalAnswer?: string;
}

export type LogCallback = (log: AgentLog) => void;
export type StateCallback = (update: AgentStateUpdate) => void;
