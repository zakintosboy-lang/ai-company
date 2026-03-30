"use client";

import { useRef, useState } from "react";
import type {
  StructuredOutput,
  OutputSection,
  HighlightVariant,
} from "@/agents/types";
import OutputRenderer from "./components/OutputRenderer";

// ── Agent UI 用型 ──────────────────────────────────────────────
type AgentRole     = "ceo" | "manager" | "worker" | "reviewer" | "system";
type AgentStatus   = "idle" | "thinking" | "reviewing" | "done" | "waiting";
type ModelProvider = "claude" | "openai" | "gemini";

interface ModelConfig { provider: ModelProvider; modelId: string; displayName: string; }
interface AgentConfig { id: string; role: AgentRole; name: string; model: ModelConfig; criteria: string[]; }
interface AgentCard   { config: AgentConfig; status: AgentStatus; lastMessage?: string; }
interface LogEntry    { time: string; role: AgentRole; message: string; }

interface SavedResult {
  id: string;
  instruction: string;
  output: StructuredOutput;
  timestamp: string;
  logCount: number;
  agentSnapshot: { id: string; name: string; model: string }[];
}

// ── 定数 ───────────────────────────────────────────────────────
const ROLE_LABEL:   Record<AgentRole, string>     = { ceo:"CEO", manager:"Manager", worker:"Worker", reviewer:"Reviewer", system:"System" };
const STATUS_LABEL: Record<AgentStatus, string>   = { idle:"待機", thinking:"思考中", reviewing:"審査中", done:"完了", waiting:"保留" };
const PROVIDER_LABEL: Record<ModelProvider,string>= { claude:"Claude", openai:"OpenAI", gemini:"Gemini" };
const AGENT_EMOJI: Record<string,string>          = { "ceo":"🏢","manager":"📋","worker-1":"⚙️","worker-2":"🔧","worker-3":"💡","reviewer":"🔍" };
const AGENT_ORDER = ["ceo","manager","worker-1","worker-2","worker-3","reviewer"];
const STORAGE_KEY = "ai-company-results";

type Tab = "logs" | "output";

// ── ヘルパー ──────────────────────────────────────────────────
function now() { return new Date().toLocaleTimeString("ja-JP", { hour12: false }); }

function escapeHtml(t: string) {
  return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── 構造化出力 → プレーンテキスト変換 ─────────────────────────
function structuredToText(data: StructuredOutput, instruction: string, logCount: number): string {
  const ts = new Date().toLocaleString("ja-JP");
  const lines: string[] = [
    "AI Company 成果物レポート",
    "=".repeat(44),
    `質問タイプ : ${data.questionType}`,
    `タイトル   : ${data.title}`,
    `実行日時   : ${ts}`,
    `ログ件数   : ${logCount}件`,
    "",
    "【指示内容】",
    instruction,
    "",
    "【サマリー】",
    data.summary,
    "",
    "=".repeat(44),
    "",
  ];
  for (const s of data.sections) {
    lines.push(`【${s.title}】`);
    if (s.type === "text" || s.type === "highlight") lines.push(s.content ?? "");
    else if (s.type === "list")  s.items?.forEach(i => lines.push(`  • ${i}`));
    else if (s.type === "steps") s.items?.forEach((i, n) => lines.push(`  ${n+1}. ${i}`));
    else if (s.type === "table" && s.tableData) {
      lines.push(s.tableData.headers.join(" | "));
      lines.push("-".repeat(40));
      s.tableData.rows.forEach(r => lines.push(r.join(" | ")));
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ── 構造化出力 → Markdown 変換 ────────────────────────────────
function structuredToMd(data: StructuredOutput, instruction: string, logCount: number): string {
  const ts = new Date().toLocaleString("ja-JP");
  const lines: string[] = [
    `# ${data.title}`,
    "",
    `> **質問タイプ:** ${data.questionType}　**実行日時:** ${ts}　**ログ:** ${logCount}件`,
    "",
    "## 指示内容",
    "",
    instruction,
    "",
    "## サマリー",
    "",
    data.summary,
    "",
    "---",
    "",
  ];
  for (const s of data.sections) {
    lines.push(`## ${s.title}`, "");
    if (s.type === "text" || s.type === "highlight") {
      lines.push(s.content ?? "");
    } else if (s.type === "list") {
      s.items?.forEach(i => lines.push(`- ${i}`));
    } else if (s.type === "steps") {
      s.items?.forEach((i, n) => lines.push(`${n+1}. ${i}`));
    } else if (s.type === "table" && s.tableData) {
      const sep = s.tableData.headers.map(() => "---").join(" | ");
      lines.push(`| ${s.tableData.headers.join(" | ")} |`);
      lines.push(`| ${sep} |`);
      s.tableData.rows.forEach(r => lines.push(`| ${r.join(" | ")} |`));
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ── PDF HTML 生成 ─────────────────────────────────────────────
function buildPdfHtml(
  data: StructuredOutput,
  instruction: string,
  logCount: number,
  agentList: AgentCard[]
): string {
  const ts = new Date().toLocaleString("ja-JP");

  const TYPE_COLOR: Record<string, string> = {
    "企画":"#2563eb","情報整理":"#0369a1","比較":"#7c3aed","提案":"#059669","ガイド":"#d97706",
  };
  const HL_STYLE: Record<HighlightVariant, { bg:string; border:string; color:string }> = {
    info:      { bg:"#eff6ff", border:"#bfdbfe", color:"#1d4ed8" },
    warning:   { bg:"#fffbeb", border:"#fde68a", color:"#92400e" },
    success:   { bg:"#f0fdf4", border:"#bbf7d0", color:"#065f46" },
    important: { bg:"#faf5ff", border:"#ddd6fe", color:"#5b21b6" },
  };

  const accentColor = TYPE_COLOR[data.questionType] ?? "#4f46e5";

  const renderSection = (s: OutputSection): string => {
    const titleHtml = s.type !== "highlight"
      ? `<h2 class="sec-title" style="border-left-color:${accentColor}">${escapeHtml(s.title)}</h2>`
      : "";

    switch (s.type) {
      case "text":
        return `${titleHtml}<div class="text-body">${
          (s.content ?? "").split("\n").filter(Boolean).map(l => `<p>${escapeHtml(l)}</p>`).join("")
        }</div>`;

      case "list":
        return `${titleHtml}<ul class="bullet-list">${
          (s.items ?? []).map(i => `<li>${escapeHtml(i)}</li>`).join("")
        }</ul>`;

      case "steps":
        return `${titleHtml}<ol class="step-list">${
          (s.items ?? []).map((item, n) => `
            <li class="step-item">
              <span class="step-circle" style="background:${accentColor}">${n+1}</span>
              <span>${escapeHtml(item)}</span>
            </li>`).join("")
        }</ol>`;

      case "table": {
        const { headers=[], rows=[] } = s.tableData ?? {};
        return `${titleHtml}<table class="data-table">
          <thead><tr>${headers.map(h => `<th style="background:${accentColor}22;color:${accentColor}">${escapeHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((r,i) => `<tr class="${i%2===1?"odd":""}">${r.map((c,j) => `<td class="${j===0?"first":""}">${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>`;
      }

      case "highlight": {
        const hcfg = HL_STYLE[s.highlight ?? "info"];
        return `<div class="hl-box" style="background:${hcfg.bg};border-color:${hcfg.border}">
          <div class="hl-title" style="color:${hcfg.color}">${escapeHtml(s.title)}</div>
          <p class="hl-body" style="color:${hcfg.color}">${escapeHtml(s.content ?? "")}</p>
        </div>`;
      }
    }
  };

  const agentRows = agentList
    .map(a => `<tr><td>${escapeHtml(a.config.name)}</td><td>${ROLE_LABEL[a.config.role]}</td><td>${escapeHtml(a.config.model.displayName)}</td></tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(data.title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Hiragino Kaku Gothic Pro","Yu Gothic",Meiryo,sans-serif;color:#111827;line-height:1.85;padding:0}
  .page{max-width:760px;margin:0 auto;padding:36px 40px}
  /* Cover */
  .cover{border-top:4px solid ${accentColor};background:#f8faff;border-radius:10px;padding:24px 28px;margin-bottom:28px}
  .logo-row{display:flex;align-items:center;gap:8px;margin-bottom:14px}
  .logo-badge{background:${accentColor};color:#fff;width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px}
  .logo-text{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${accentColor}}
  .type-badge{display:inline-block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding:2px 10px;border-radius:4px;background:${accentColor}18;color:${accentColor};border:1px solid ${accentColor}44;margin-bottom:8px}
  h1{font-size:22px;font-weight:900;color:#111827;line-height:1.3;margin-bottom:14px}
  .summary-box{background:#fff;border:1px solid ${accentColor}44;border-left:3px solid ${accentColor};border-radius:6px;padding:12px 16px;font-size:13px;color:#374151;line-height:1.75}
  /* Meta */
  .meta-table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px}
  .meta-table td{padding:4px 8px;vertical-align:top}
  .meta-table td:first-child{font-weight:700;color:${accentColor};width:90px;white-space:nowrap}
  /* Agents */
  .agent-table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:28px}
  .agent-table th{background:${accentColor}18;color:${accentColor};padding:7px 10px;text-align:left;font-weight:700;border:1px solid #e5e7eb}
  .agent-table td{padding:6px 10px;border:1px solid #e5e7eb;color:#4b5563}
  /* Sections */
  .sec-title{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#111827;border-left:3px solid;padding-left:10px;margin:24px 0 10px}
  .text-body p{font-size:14px;color:#1f2937;margin-bottom:8px}
  .bullet-list{padding-left:0;list-style:none;display:flex;flex-direction:column;gap:6px}
  .bullet-list li{font-size:14px;color:#1f2937;padding:8px 12px 8px 34px;background:#f9fafb;border-radius:5px;position:relative;border:1px solid #f3f4f6}
  .bullet-list li::before{content:"▸";position:absolute;left:13px;color:${accentColor};font-size:11px}
  .step-list{list-style:none;display:flex;flex-direction:column;gap:10px;padding:0}
  .step-item{display:flex;align-items:flex-start;gap:12px;font-size:14px;color:#1f2937}
  .step-circle{flex-shrink:0;width:22px;height:22px;border-radius:50%;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:2px}
  .data-table{width:100%;border-collapse:collapse;font-size:13px;margin:4px 0}
  .data-table th{padding:9px 12px;text-align:left;font-weight:700;border:1px solid #e5e7eb}
  .data-table td{padding:8px 12px;border:1px solid #e5e7eb;color:#1f2937}
  .data-table tr.odd td{background:#f9fafb}
  .data-table td.first{font-weight:600;color:#374151}
  .hl-box{border:1.5px solid;border-radius:8px;padding:14px 16px;margin:4px 0}
  .hl-title{font-size:12px;font-weight:800;margin-bottom:8px;letter-spacing:.03em}
  .hl-body{font-size:14px;line-height:1.75}
  .footer{margin-top:40px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
  @page{margin:15mm 20mm}
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="logo-row">
      <div class="logo-badge">AI</div>
      <div class="logo-text">AI Company</div>
    </div>
    <div class="type-badge">${escapeHtml(data.questionType)}</div>
    <h1>${escapeHtml(data.title)}</h1>
    <div class="summary-box">${escapeHtml(data.summary)}</div>
  </div>

  <table class="meta-table">
    <tr><td>実行日時</td><td>${ts}</td></tr>
    <tr><td>ログ件数</td><td>${logCount}件</td></tr>
    <tr><td>指示内容</td><td>${escapeHtml(instruction)}</td></tr>
  </table>

  <table class="agent-table">
    <thead><tr><th>名前</th><th>役割</th><th>モデル</th></tr></thead>
    <tbody>${agentRows}</tbody>
  </table>

  ${data.sections.map(renderSection).join("\n")}

  <div class="footer">Generated by AI Company — ${ts}</div>
</div>
</body>
</html>`;
}

// ── Page Component ────────────────────────────────────────────
export default function Home() {
  const [instruction, setInstruction] = useState("");
  const [agents, setAgents]   = useState<Record<string, AgentCard>>({});
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [output, setOutput]   = useState<StructuredOutput | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("logs");
  const [runCount, setRunCount]   = useState<number>(0);
  const [toast, setToast]         = useState<string | null>(null);
  const logBottomRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const addLog = (role: AgentRole, message: string) => {
    setLogs((prev) => [...prev, { time: now(), role, message }]);
    setTimeout(() => logBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = () => {
    if (!output) return;
    const result: SavedResult = {
      id: Date.now().toString(),
      instruction, output,
      timestamp: new Date().toLocaleString("ja-JP"),
      logCount: logs.length,
      agentSnapshot: Object.values(agents).map(a => ({
        id: a.config.id, name: a.config.name,
        model: `${a.config.model.displayName} (${PROVIDER_LABEL[a.config.model.provider]})`,
      })),
    };
    try {
      const existing: SavedResult[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      existing.unshift(result);
      if (existing.length > 20) existing.length = 20;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      showToast("✓ ローカルに保存しました");
    } catch { showToast("保存に失敗しました"); }
  };

  // ── Download TXT ──────────────────────────────────────────
  const handleDownloadTxt = () => {
    if (!output) return;
    downloadFile(structuredToText(output, instruction, logs.length), `ai-company-${Date.now()}.txt`, "text/plain");
    showToast("📄 TXT をダウンロードしました");
  };

  // ── Download Markdown ─────────────────────────────────────
  const handleDownloadMd = () => {
    if (!output) return;
    downloadFile(structuredToMd(output, instruction, logs.length), `ai-company-${Date.now()}.md`, "text/markdown");
    showToast("📝 Markdown をダウンロードしました");
  };

  // ── PDF Print ─────────────────────────────────────────────
  const handlePrintPDF = () => {
    if (!output) return;
    const html = buildPdfHtml(output, instruction, logs.length, Object.values(agents));
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;";
    iframe.src = url;
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 1500);
    };
    document.body.appendChild(iframe);
    showToast("🖨️ PDF印刷ダイアログを表示しました");
  };

  // ── Run ───────────────────────────────────────────────────
  const handleRun = async () => {
    if (!instruction.trim() || isRunning) return;
    setIsRunning(true);
    setLogs([]); setOutput(null); setAgents({}); setActiveTab("logs");
    addLog("system", "実行開始...");

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruction.trim() }),
      });
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
                return { ...prev, [parsed.agentId]: { ...card, status: parsed.status ?? card.status, lastMessage: parsed.lastMessage ?? card.lastMessage } };
              });
            } else if (parsed.type === "log") {
              addLog((parsed.role ?? "system") as AgentRole, parsed.message ?? "");
            } else if (parsed.type === "complete") {
              const structured = parsed.data as StructuredOutput;
              setOutput(structured);
              setRunCount((c) => c + 1);
              setActiveTab("output");
              addLog("system", "処理完了");
            } else if (parsed.type === "error") {
              addLog("system", `エラー: ${parsed.data}`);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      addLog("system", `エラー: ${String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const agentCards    = AGENT_ORDER.map((id) => agents[id]).filter(Boolean);
  const activeWorkers = AGENT_ORDER.filter(id => id.startsWith("worker-"))
    .filter(id => agents[id]?.status === "thinking" || agents[id]?.status === "reviewing").length;
  const canExport = !!output && !isRunning;

  return (
    <div className="app">
      {/* Header */}
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
            {isRunning
              ? <><div className="spinner" />処理中...</>
              : <><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 2L12 7L3 12V2Z" fill="currentColor"/></svg>実行 (⌘ Enter)</>
            }
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

          <div className={`export-section ${canExport ? "visible" : ""}`}>
            <div className="panel-section-label">エクスポート</div>
            <div className="export-buttons">
              <button className="export-btn btn-save" onClick={handleSave}     disabled={!canExport}><span className="export-icon">💾</span>保存</button>
              <button className="export-btn btn-txt"  onClick={handleDownloadTxt} disabled={!canExport}><span className="export-icon">📄</span>TXT</button>
              <button className="export-btn btn-md"   onClick={handleDownloadMd}  disabled={!canExport}><span className="export-icon">📝</span>MD</button>
              <button className="export-btn btn-pdf"  onClick={handlePrintPDF}    disabled={!canExport}><span className="export-icon">🖨️</span>PDF</button>
            </div>
          </div>
        </aside>

        {/* Right Panel */}
        <div className="panel-right">
          {/* Agent Cards */}
          <div className="agent-grid">
            {agentCards.length === 0
              ? AGENT_ORDER.map((id) => (
                  <div key={id} className="agent-card agent-card--placeholder">
                    <div className="agent-placeholder-inner"><span className="placeholder-emoji">⋯</span></div>
                  </div>
                ))
              : agentCards.map((card) => {
                  const isActive = card.status === "thinking" || card.status === "reviewing";
                  return (
                    <div key={card.config.id} className={`agent-card role--${card.config.role} status--${card.status}${isActive ? " is-active" : ""}`}>
                      <div className="agent-card-header">
                        <div className="agent-avatar-name">
                          <span className={`agent-avatar avatar--${card.config.role}`}>{AGENT_EMOJI[card.config.id] ?? "🤖"}</span>
                          <div>
                            <div className="agent-card-name">{card.config.name}</div>
                            <div className="agent-model-row">
                              <span className={`provider-chip provider--${card.config.model.provider}`}>{PROVIDER_LABEL[card.config.model.provider]}</span>
                              <span className="agent-model-name">{card.config.model.displayName}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`status-chip chip--${card.status}`}>
                          {isActive && <span className="chip-pulse" />}
                          {STATUS_LABEL[card.status]}
                        </span>
                      </div>
                      <div className="speech-bubble">
                        {isActive
                          ? <div className="typing-dots"><span/><span/><span/></div>
                          : card.lastMessage
                            ? <span className="bubble-text">{card.lastMessage}</span>
                            : <span className="bubble-placeholder">指示待ち...</span>
                        }
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Tabs */}
          <div className="panel-tabs">
            <button className={`panel-tab ${activeTab==="logs"?"active":""}`} onClick={() => setActiveTab("logs")}>
              実行ログ {logs.length > 0 && `(${logs.length})`}
            </button>
            <button className={`panel-tab ${activeTab==="output"?"active":""}`} onClick={() => setActiveTab("output")}>
              最終成果物 {output && "✓"}
            </button>
          </div>

          {/* Log */}
          {activeTab === "logs" && (
            <div className="log-console">
              {logs.length === 0
                ? <div className="log-empty">実行ボタンを押すとログが表示されます</div>
                : logs.map((e, i) => (
                    <div key={i} className="log-line">
                      <span className="log-time">{e.time}</span>
                      <span className={`log-badge log-badge--${e.role}`}>{ROLE_LABEL[e.role]}</span>
                      <span className={`log-text log-text--${e.role}`}>{e.message}</span>
                    </div>
                  ))
              }
              <div ref={logBottomRef} />
            </div>
          )}

          {/* Output */}
          {activeTab === "output" && (
            <div className="output-panel">
              {!output
                ? <div className="output-empty">実行後に最終成果物がここに表示されます</div>
                : <OutputRenderer data={output} />
              }
            </div>
          )}
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
