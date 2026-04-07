export type AgentRole = "ceo" | "manager" | "worker" | "reviewer" | "researcher" | "designer" | "system";
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

// ── 構造化出力 ─────────────────────────────────────────────────
export type QuestionType     = "企画" | "情報整理" | "比較" | "提案" | "ガイド";
export type SectionType      = "text" | "list" | "steps" | "table" | "highlight";
export type HighlightVariant = "info" | "warning" | "success" | "important";
export type SectionIcon      = "📌" | "⚠" | "💡" | "✅" | "📊" | "🔍" | "🚀" | "🎯" | "📋" | "⚙️";

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface OutputSection {
  title: string;
  type: SectionType;
  icon?: SectionIcon;
  content?: string;      // text / highlight
  items?: string[];      // list / steps
  tableData?: TableData; // table
  highlight?: HighlightVariant;
}

/** 将来の Canva 連携に向けた構造化メタデータ */
export interface CanvaSlide {
  slideIndex: number;
  layout: "cover" | "summary" | "list" | "table" | "steps" | "highlight";
  heading: string;
  body: string | string[] | TableData;
  accentColor?: string;
}

export interface CanvaData {
  documentTitle: string;
  documentType: QuestionType;
  slides: CanvaSlide[];
}

export interface DesignSpec {
  concept: string;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  fonts: { heading: string; body: string; accent: string };
  layout: { page: number; name: string; elements: string[] }[];
  canvaInstructions: string;
}

export interface StructuredOutput {
  questionType: QuestionType;
  title: string;
  summary: string;
  keyPoints: string[];   // 重要ポイント 3 つ
  sections: OutputSection[];
  canvaData?: CanvaData; // Canva 連携用（将来拡張）
  designSpec?: DesignSpec; // Phase 6 デザイン指示
  rawText?: string;
}
