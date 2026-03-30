"use client";

import { useRef, useState } from "react";

// ── 型定義 ─────────────────────────────────────────────────────
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
interface SavedResult {
  id: string;
  instruction: string;
  output: string;
  timestamp: string;
  logCount: number;
  agentSnapshot: { id: string; name: string; model: string }[];
}

// ── 定数 ───────────────────────────────────────────────────────
const ROLE_LABEL: Record<AgentRole, string> = {
  ceo: "CEO", manager: "Manager", worker: "Worker", reviewer: "Reviewer", system: "System",
};
const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "待機", thinking: "思考中", reviewing: "審査中", done: "完了", waiting: "保留",
};
const PROVIDER_LABEL: Record<ModelProvider, string> = {
  claude: "Claude", openai: "OpenAI", gemini: "Gemini",
};
const AGENT_EMOJI: Record<string, string> = {
  "ceo":      "🏢",
  "manager":  "📋",
  "worker-1": "⚙️",
  "worker-2": "🔧",
  "worker-3": "💡",
  "reviewer": "🔍",
};
const AGENT_ORDER = ["ceo", "manager", "worker-1", "worker-2", "worker-3", "reviewer"];
const STORAGE_KEY = "ai-company-results";

type Tab = "logs" | "output";

// ── ヘルパー ──────────────────────────────────────────────────
function now(): string {
  return new Date().toLocaleTimeString("ja-JP", { hour12: false });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function simpleMarkdownToHtml(text: string): string {
  return escapeHtml(text)
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────
export default function Home() {
  const [instruction, setInstruction] = useState("");
  const [agents, setAgents]   = useState<Record<string, AgentCard>>({});
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [output, setOutput]   = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("logs");
  const [runCount, setRunCount]   = useState<number>(0);
  const [toast, setToast]         = useState<string | null>(null);
  const logBottomRef = useRef<HTMLDivElement>(null);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // ── Log ──────────────────────────────────────────────────
  const addLog = (role: AgentRole, message: string) => {
    setLogs((prev) => [...prev, { time: now(), role, message }]);
    setTimeout(() => logBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  // ── Save to localStorage ──────────────────────────────────
  const handleSave = () => {
    if (!output) return;
    const timestamp = new Date().toLocaleString("ja-JP");
    const result: SavedResult = {
      id: Date.now().toString(),
      instruction,
      output,
      timestamp,
      logCount: logs.length,
      agentSnapshot: Object.values(agents).map((a) => ({
        id:    a.config.id,
        name:  a.config.name,
        model: `${a.config.model.displayName} (${PROVIDER_LABEL[a.config.model.provider]})`,
      })),
    };
    try {
      const existing: SavedResult[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      existing.unshift(result);
      if (existing.length > 20) existing.length = 20;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      showToast("✓ ローカルに保存しました");
    } catch {
      showToast("保存に失敗しました");
    }
  };

  // ── TXT Download ──────────────────────────────────────────
  const handleDownloadTxt = () => {
    if (!output) return;
    const timestamp = new Date().toLocaleString("ja-JP");
    const agentLines = Object.values(agents)
      .map((a) => `  - ${a.config.name}: ${a.config.model.displayName}`)
      .join("\n");

    const content = [
      "AI Company 成果物レポート",
      "=".repeat(44),
      `実行日時  : ${timestamp}`,
      `ログ件数  : ${logs.length}件`,
      "",
      "【指示内容】",
      instruction,
      "",
      "【エージェント構成】",
      agentLines,
      "",
      "=".repeat(44),
      "",
      "【最終成果物】",
      "",
      output,
    ].join("\n");

    downloadFile(content, `ai-company-${Date.now()}.txt`, "text/plain");
    showToast("📄 TXT をダウンロードしました");
  };

  // ── Markdown Download ────────────────────────────────────
  const handleDownloadMd = () => {
    if (!output) return;
    const timestamp = new Date().toLocaleString("ja-JP");
    const agentRows = Object.values(agents)
      .map((a) => `| ${a.config.name} | ${a.config.role.toUpperCase()} | ${a.config.model.displayName} |`)
      .join("\n");

    const content = [
      "# AI Company 成果物レポート",
      "",
      "## メタ情報",
      "",
      "| 項目 | 内容 |",
      "|------|------|",
      `| 実行日時 | ${timestamp} |`,
      `| ログ件数 | ${logs.length}件 |`,
      "",
      "## 指示内容",
      "",
      instruction,
      "",
      "## エージェント構成",
      "",
      "| 名前 | 役割 | モデル |",
      "|------|------|--------|",
      agentRows,
      "",
      "---",
      "",
      "## 最終成果物",
      "",
      output,
    ].join("\n");

    downloadFile(content, `ai-company-${Date.now()}.md`, "text/markdown");
    showToast("📝 Markdown をダウンロードしました");
  };

  // ── PDF Print ─────────────────────────────────────────────
  const handlePrintPDF = () => {
    if (!output) return;
    const timestamp = new Date().toLocaleString("ja-JP");
    const agentRows = Object.values(agents)
      .map((a) => `
        <tr>
          <td>${a.config.name}</td>
          <td>${ROLE_LABEL[a.config.role]}</td>
          <td>${a.config.model.displayName}</td>
          <td>${PROVIDER_LABEL[a.config.model.provider]}</td>
        </tr>`)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>AI Company 成果物レポート</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Hiragino Kaku Gothic Pro","Yu Gothic",Meiryo,sans-serif;
      color: #1a1d2e; line-height: 1.85; padding: 32px;
    }
    .logo-row { display:flex; align-items:center; gap:10px; margin-bottom:4px; }
    .logo-badge {
      background: #4f46e5; color: #fff;
      width:28px; height:28px; border-radius:6px;
      display:flex; align-items:center; justify-content:center;
      font-weight:900; font-size:13px;
    }
    .company-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#818cf8; }
    .report-title  { font-size:22px; font-weight:800; color:#1a1d2e; margin:4px 0 0; }
    .divider { border:none; border-top:2px solid #4f46e5; margin:16px 0 24px; }
    .meta-box {
      background:#f0f4ff; border:1px solid #dde2f4; border-radius:8px;
      padding:14px 18px; margin-bottom:24px;
    }
    .meta-table { width:100%; border-collapse:collapse; }
    .meta-table td { padding:3px 8px; font-size:13px; vertical-align:top; }
    .meta-table td:first-child { font-weight:700; color:#4f46e5; width:100px; white-space:nowrap; }
    .section-title {
      font-size:11px; font-weight:700; text-transform:uppercase;
      letter-spacing:.1em; color:#4f46e5;
      border-bottom:1px solid #dde2f4; padding-bottom:6px; margin:20px 0 10px;
    }
    .agents-table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:24px; }
    .agents-table th { background:#f0f4ff; color:#4f46e5; padding:6px 10px; text-align:left; font-weight:700; border:1px solid #dde2f4; }
    .agents-table td { padding:5px 10px; border:1px solid #dde2f4; color:#4c5280; }
    .output-content { font-size:14px; line-height:1.9; color:#1a1d2e; }
    .output-content h2 { font-size:17px; color:#4f46e5; margin:20px 0 6px; }
    .output-content h3 { font-size:15px; color:#1a1d2e; margin:14px 0 4px; }
    .output-content h4 { font-size:13px; color:#4c5280; margin:10px 0 3px; }
    .output-content strong { font-weight:700; }
    .output-content em { font-style:italic; color:#4c5280; }
    .footer { margin-top:40px; font-size:11px; color:#9ca3c0; text-align:center; }
    @page { margin:15mm 20mm; }
  </style>
</head>
<body>
  <div class="logo-row">
    <div class="logo-badge">AI</div>
    <div class="company-label">AI Company</div>
  </div>
  <div class="report-title">成果物レポート</div>
  <hr class="divider">
  <div class="meta-box">
    <table class="meta-table">
      <tr><td>実行日時</td><td>${timestamp}</td></tr>
      <tr><td>ログ件数</td><td>${logs.length}件</td></tr>
      <tr><td>指示内容</td><td>${escapeHtml(instruction)}</td></tr>
    </table>
  </div>
  <div class="section-title">エージェント構成</div>
  <table class="agents-table">
    <thead><tr><th>名前</th><th>役割</th><th>モデル</th><th>プロバイダー</th></tr></thead>
    <tbody>${agentRows}</tbody>
  </table>
  <div class="section-title">最終成果物</div>
  <div class="output-content">${simpleMarkdownToHtml(output)}</div>
  <div class="footer">Generated by AI Company — ${timestamp}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;";
    iframe.src = url;
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1500);
    };
    document.body.appendChild(iframe);
    showToast("🖨️ PDF印刷ダイアログを表示しました");
  };

  // ── Run ───────────────────────────────────────────────────
  const handleRun = async () => {
    if (!instruction.trim() || isRunning) return;
    setIsRunning(true);
    setLogs([]); setOutput(""); setAgents({}); setActiveTab("logs");
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
              const cfgs = parsed.agents as AgentConfig[];
              const init: Record<string, AgentCard> = {};
              for (const cfg of cfgs) init[cfg.id] = { config: cfg, status: "idle" };
              setAgents(init);
            } else if (parsed.type === "agent_update") {
              setAgents((prev) => {
                const card = prev[parsed.agentId];
                if (!card) return prev;
                return {
                  ...prev,
                  [parsed.agentId]: {
                    ...card,
                    status:      parsed.status      ?? card.status,
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

  // ── Derived ───────────────────────────────────────────────
  const agentCards    = AGENT_ORDER.map((id) => agents[id]).filter(Boolean);
  const activeWorkers = AGENT_ORDER
    .filter((id) => id.startsWith("worker-"))
    .filter((id) => agents[id]?.status === "thinking" || agents[id]?.status === "reviewing")
    .length;
  const canExport = !!output && !isRunning;

  // ── Render ────────────────────────────────────────────────
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
          <div className={`status-dot ${isRunning ? "running" : runCount > 0 ? "ready" : ""}`} />
          {isRunning ? "Processing" : runCount > 0 ? "Ready" : "Standby"}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">
        {/* Left Panel */}
        <aside className="panel-left">
          {/* 指示入力 */}
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

          {/* 実行ボタン */}
          <button className="run-button" onClick={handleRun} disabled={isRunning || !instruction.trim()}>
            {isRunning ? (
              <><div className="spinner" />処理中...</>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M3 2L12 7L3 12V2Z" fill="currentColor" />
                </svg>
                実行 (⌘ Enter)
              </>
            )}
          </button>

          {/* 統計 */}
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

          {/* エクスポートボタン群 */}
          <div className={`export-section ${canExport ? "visible" : ""}`}>
            <div className="panel-section-label">エクスポート</div>
            <div className="export-buttons">
              <button className="export-btn btn-save" onClick={handleSave} disabled={!canExport}>
                <span className="export-icon">💾</span>
                <span>保存</span>
              </button>
              <button className="export-btn btn-txt" onClick={handleDownloadTxt} disabled={!canExport}>
                <span className="export-icon">📄</span>
                <span>TXT</span>
              </button>
              <button className="export-btn btn-md" onClick={handleDownloadMd} disabled={!canExport}>
                <span className="export-icon">📝</span>
                <span>MD</span>
              </button>
              <button className="export-btn btn-pdf" onClick={handlePrintPDF} disabled={!canExport}>
                <span className="export-icon">🖨️</span>
                <span>PDF</span>
              </button>
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
                    <div className="agent-placeholder-inner">
                      <span className="placeholder-emoji">⋯</span>
                    </div>
                  </div>
                ))
              : agentCards.map((card) => {
                  const isActive = card.status === "thinking" || card.status === "reviewing";
                  return (
                    <div
                      key={card.config.id}
                      className={`agent-card role--${card.config.role} status--${card.status}${isActive ? " is-active" : ""}`}
                    >
                      {/* 上段: アバター + 名前 + ステータス */}
                      <div className="agent-card-header">
                        <div className="agent-avatar-name">
                          <span className={`agent-avatar avatar--${card.config.role}`}>
                            {AGENT_EMOJI[card.config.id] ?? "🤖"}
                          </span>
                          <div>
                            <div className="agent-card-name">{card.config.name}</div>
                            <div className="agent-model-row">
                              <span className={`provider-chip provider--${card.config.model.provider}`}>
                                {PROVIDER_LABEL[card.config.model.provider]}
                              </span>
                              <span className="agent-model-name">{card.config.model.displayName}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`status-chip chip--${card.status}`}>
                          {isActive && <span className="chip-pulse" />}
                          {STATUS_LABEL[card.status]}
                        </span>
                      </div>

                      {/* 吹き出し */}
                      <div className="speech-bubble">
                        {isActive ? (
                          <div className="typing-dots">
                            <span /><span /><span />
                          </div>
                        ) : card.lastMessage ? (
                          <span className="bubble-text">{card.lastMessage}</span>
                        ) : (
                          <span className="bubble-placeholder">指示待ち...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
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

      {/* ── Toast ── */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
