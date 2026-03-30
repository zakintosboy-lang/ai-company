"use client";

import { useRef, useState } from "react";

// ── 型定義 ────────────────────────────────────────────────────
type AgentRole     = "ceo" | "manager" | "worker" | "reviewer" | "system";
type AgentStatus   = "idle" | "thinking" | "reviewing" | "done" | "waiting";
type ModelProvider = "claude" | "openai" | "gemini";

interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
  displayName: string;
}

interface AgentConfig {
  id: string;
  role: AgentRole;
  name: string;
  model: ModelConfig;
  criteria: string[];
}

interface AgentCard {
  config: AgentConfig;
  status: AgentStatus;
  lastMessage?: string;
}

interface LogEntry {
  time: string;
  role: AgentRole;
  message: string;
}

// ── ラベル定義 ────────────────────────────────────────────────
const ROLE_LABEL: Record<AgentRole, string> = {
  ceo: "CEO", manager: "Manager", worker: "Worker", reviewer: "Reviewer", system: "System",
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "待機", thinking: "思考中", reviewing: "審査中", done: "完了", waiting: "保留",
};

const PROVIDER_LABEL: Record<ModelProvider, string> = {
  claude: "Claude", openai: "OpenAI", gemini: "Gemini",
};

// エージェント表示順（config の id 順）
const AGENT_ORDER = ["ceo", "manager", "worker-1", "worker-2", "worker-3", "reviewer"];

function now(): string {
  return new Date().toLocaleTimeString("ja-JP", { hour12: false });
}

type Tab = "logs" | "output";

// ── Component ─────────────────────────────────────────────────
export default function Home() {
  const [instruction, setInstruction] = useState("");
  const [agents, setAgents] = useState<Record<string, AgentCard>>({});
  const [logs, setLogs]     = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("logs");
  const [runCount, setRunCount]   = useState<number>(0);
  const logBottomRef = useRef<HTMLDivElement>(null);

  const addLog = (role: AgentRole, message: string) => {
    setLogs((prev) => [...prev, { time: now(), role, message }]);
    setTimeout(() => logBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleRun = async () => {
    if (!instruction.trim() || isRunning) return;

    setIsRunning(true);
    setLogs([]);
    setOutput("");
    setAgents({});
    setActiveTab("logs");
    addLog("system", "実行開始...");

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruction.trim() }),
      });
      if (!response.body) throw new Error("No response body");

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));

            if (parsed.type === "init") {
              const configs = parsed.agents as AgentConfig[];
              const initial: Record<string, AgentCard> = {};
              for (const cfg of configs) initial[cfg.id] = { config: cfg, status: "idle" };
              setAgents(initial);

            } else if (parsed.type === "agent_update") {
              setAgents((prev) => {
                const card = prev[parsed.agentId];
                if (!card) return prev;
                return {
                  ...prev,
                  [parsed.agentId]: {
                    ...card,
                    status: parsed.status ?? card.status,
                    lastMessage: parsed.lastMessage ?? card.lastMessage,
                  },
                };
              });

            } else if (parsed.type === "log") {
              addLog((parsed.role ?? "system") as AgentRole, parsed.message ?? "");

            } else if (parsed.type === "complete") {
              setOutput(parsed.data);
              setRunCount((c) => c + 1);
              setActiveTab("output");
              addLog("system", "処理完了");

            } else if (parsed.type === "error") {
              addLog("system", `エラー: ${parsed.data}`);
            }
          } catch { /* ignore malformed */ }
        }
      }
    } catch (err) {
      addLog("system", `エラー: ${String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 表示順に並べたエージェントカード
  const agentCards = AGENT_ORDER.map((id) => agents[id]).filter(Boolean);

  // 稼働中 Worker 数
  const activeWorkers = AGENT_ORDER
    .filter((id) => id.startsWith("worker-"))
    .filter((id) => agents[id]?.status === "thinking" || agents[id]?.status === "reviewing")
    .length;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">AI</div>
          <div>
            <div className="header-title">AI Company</div>
            <div className="header-subtitle">CEO · Manager · Worker × 3 · Reviewer</div>
          </div>
        </div>
        <div className="status-badge">
          <div className={`status-dot ${isRunning ? "running" : runCount > 0 ? "idle" : ""}`} />
          {isRunning ? "Processing" : runCount > 0 ? "Ready" : "Standby"}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">
        {/* Left Panel */}
        <aside className="panel-left">
          <div>
            <div className="panel-section-label">指示内容</div>
            <textarea
              className="instruction-textarea"
              placeholder="AIチームへの指示を入力してください..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isRunning}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRun(); }}
            />
          </div>

          <button className="run-button" onClick={handleRun} disabled={isRunning || !instruction.trim()}>
            {isRunning ? (
              <><div className="spinner" />処理中...</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 2L12 7L3 12V2Z" fill="currentColor" />
                </svg>
                実行 (⌘ Enter)
              </>
            )}
          </button>

          <div className="info-cards">
            <div className="info-card">
              <div className="info-card-title">実行回数</div>
              <div className="info-card-value accent">{runCount}</div>
            </div>
            <div className="info-card">
              <div className="info-card-title">稼働 Worker</div>
              <div className="info-card-value">{isRunning ? `${activeWorkers} / 3` : "—"}</div>
            </div>
            <div className="info-card">
              <div className="info-card-title">ログ件数</div>
              <div className="info-card-value">{logs.length}</div>
            </div>
          </div>
        </aside>

        {/* Right Panel */}
        <div className="panel-right">

          {/* ── Agent Cards ── */}
          <div className="agent-grid">
            {agentCards.length === 0
              ? AGENT_ORDER.map((id) => (
                  <div key={id} className="agent-card agent-card--placeholder">
                    <div className="agent-card-top">
                      <span className="agent-card-name-placeholder">—</span>
                    </div>
                  </div>
                ))
              : agentCards.map((card) => (
                  <div
                    key={card.config.id}
                    className={`agent-card agent-card--${card.config.role} status--${card.status}`}
                  >
                    {/* 上段: 名前 + ステータス */}
                    <div className="agent-card-top">
                      <div className="agent-name-row">
                        <span className={`agent-dot agent-dot--${card.status}`} />
                        <span className="agent-card-name">{card.config.name}</span>
                      </div>
                      <span className={`agent-status-chip chip--${card.status}`}>
                        {STATUS_LABEL[card.status]}
                      </span>
                    </div>

                    {/* 中段: 使用 AI */}
                    <div className="agent-model-row">
                      <span className={`provider-chip provider--${card.config.model.provider}`}>
                        {PROVIDER_LABEL[card.config.model.provider]}
                      </span>
                      <span className="agent-model-name">{card.config.model.displayName}</span>
                    </div>

                    {/* 下段: 最新メッセージ */}
                    {card.lastMessage && (
                      <div className="agent-last-msg">{card.lastMessage}</div>
                    )}
                  </div>
                ))}
          </div>

          {/* ── Tabs ── */}
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activeTab === "logs" ? "active" : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              実行ログ {logs.length > 0 && `(${logs.length})`}
            </button>
            <button
              className={`panel-tab ${activeTab === "output" ? "active" : ""}`}
              onClick={() => setActiveTab("output")}
            >
              最終成果物 {output && "✓"}
            </button>
          </div>

          {/* ── Log Console ── */}
          {activeTab === "logs" && (
            <div className="log-console">
              {logs.length === 0
                ? <div className="log-empty">実行ボタンを押すとログが表示されます</div>
                : logs.map((entry, i) => (
                    <div key={i} className="log-line">
                      <span className="log-time">{entry.time}</span>
                      <span className={`log-badge log-badge--${entry.role}`}>
                        {ROLE_LABEL[entry.role]}
                      </span>
                      <span className={`log-text log-text--${entry.role}`}>
                        {entry.message}
                      </span>
                    </div>
                  ))
              }
              <div ref={logBottomRef} />
            </div>
          )}

          {/* ── Output ── */}
          {activeTab === "output" && (
            <div className="output-panel">
              {!output
                ? <div className="output-empty">実行後に最終成果物がここに表示されます</div>
                : (
                  <div className="output-card">
                    <div className="output-card-header">
                      <div className="output-card-dot" />
                      最終成果物 — CEO 承認済み
                    </div>
                    <div className="output-content">{output}</div>
                  </div>
                )
              }
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
