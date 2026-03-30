export type AgentRole = "ceo" | "manager" | "worker" | "reviewer" | "system";

export interface AgentLog {
  role: AgentRole;
  message: string;
}

export interface Task {
  id: string;
  description: string;
  criteria: string;
}

export interface WorkerOutput {
  taskId: string;
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
