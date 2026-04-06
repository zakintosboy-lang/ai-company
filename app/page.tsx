"use client";

import { useRef, useState } from "react";
import { usePersistedInstruction } from "./hooks/usePersistedInstruction";
import type {
  StructuredOutput,
  OutputSection,
  HighlightVariant,
} from "@/agents/types";
import OutputRenderer from "./components/OutputRenderer";
import AnimatedAgentCard from "./components/AnimatedAgentCard";

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
const PROVIDER_LABEL: Record<ModelProvider,string>= { claude:"Claude", openai:"OpenAI", gemini:"Gemini" };
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
  const sep = "=".repeat(50);
  const lines: string[] = [
    "AI Company 成果物レポート",
    sep,
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
    "【重要ポイント】",
    ...(data.keyPoints ?? []).map((kp, i) => `  ${i+1}. ${kp}`),
    "",
    sep,
    "",
  ];
  for (const s of data.sections) {
    const icon = s.icon ? `${s.icon} ` : "";
    lines.push(`${icon}【${s.title}】`);
    if (s.type === "text" || s.type === "highlight") lines.push(s.content ?? "");
    else if (s.type === "list")  s.items?.forEach(i => lines.push(`  • ${i}`));
    else if (s.type === "steps") s.items?.forEach((i, n) => lines.push(`  Step ${n+1}: ${i}`));
    else if (s.type === "table" && s.tableData) {
      lines.push(s.tableData.headers.join(" │ "));
      lines.push("─".repeat(50));
      s.tableData.rows.forEach(r => lines.push(r.join(" │ ")));
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
    `> **タイプ:** ${data.questionType}　|　**作成:** ${ts}　|　**ログ:** ${logCount}件`,
    "",
    "## 📋 指示内容",
    "",
    `> ${instruction}`,
    "",
    "## 📌 サマリー",
    "",
    data.summary,
    "",
    "## ✅ 重要ポイント",
    "",
    ...(data.keyPoints ?? []).map((kp, i) => `${i+1}. **${kp}**`),
    "",
    "---",
    "",
  ];
  for (const s of data.sections) {
    const icon = s.icon ? `${s.icon} ` : "";
    lines.push(`## ${icon}${s.title}`, "");
    if (s.type === "text" || s.type === "highlight") {
      lines.push(s.content ?? "");
    } else if (s.type === "list") {
      s.items?.forEach(i => lines.push(`- ${i}`));
    } else if (s.type === "steps") {
      s.items?.forEach((i, n) => lines.push(`${n+1}. ${i}`));
    } else if (s.type === "table" && s.tableData) {
      const sep = s.tableData.headers.map(() => ":---").join(" | ");
      lines.push(`| ${s.tableData.headers.join(" | ")} |`);
      lines.push(`| ${sep} |`);
      s.tableData.rows.forEach(r => lines.push(`| ${r.join(" | ")} |`));
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ── PDF HTML 生成（2 ページ構成） ─────────────────────────────
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
  const HL_STYLE: Record<HighlightVariant, { bg:string; border:string; leftBar:string; color:string; icon:string }> = {
    info:      { bg:"#eff6ff", border:"#bfdbfe", leftBar:"#2563eb", color:"#1d4ed8", icon:"💡" },
    warning:   { bg:"#fff7ed", border:"#fed7aa", leftBar:"#ea580c", color:"#9a3412", icon:"⚠" },
    success:   { bg:"#f0fdf4", border:"#bbf7d0", leftBar:"#16a34a", color:"#15803d", icon:"✅" },
    important: { bg:"#faf5ff", border:"#ddd6fe", leftBar:"#7c3aed", color:"#6d28d9", icon:"📌" },
  };

  const ac = TYPE_COLOR[data.questionType] ?? "#4f46e5"; // accentColor

  const renderSection = (s: OutputSection): string => {
    const icon = s.icon ? `<span class="sec-icon">${s.icon}</span>` : "";

    if (s.type === "highlight") {
      const h = HL_STYLE[s.highlight ?? "info"];
      return `
        <div class="hl-box" style="background:${h.bg};border-color:${h.border};border-left-color:${h.leftBar}">
          <div class="hl-hdr" style="color:${h.color}">${s.icon ?? h.icon} ${escapeHtml(s.title)}</div>
          <p class="hl-body" style="color:${h.color}">${escapeHtml(s.content ?? "")}</p>
        </div>`;
    }

    const titleHtml = `<h2 class="sec-title">${icon}${escapeHtml(s.title)}</h2>`;

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
              <span class="step-num" style="background:${ac}">${n+1}</span>
              <span>${escapeHtml(item)}</span>
            </li>`).join("")
        }</ol>`;

      case "table": {
        const { headers=[], rows=[] } = s.tableData ?? {};
        return `${titleHtml}
          <table class="data-table">
            <thead><tr>${headers.map(h => `<th style="background:${ac}18;color:${ac}">${escapeHtml(h)}</th>`).join("")}</tr></thead>
            <tbody>${rows.map((r,i) => `
              <tr class="${i%2===1?"alt":""}">${r.map((c,j)=>`<td class="${j===0?"first":""}">${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>`;
      }
      default: return "";
    }
  };

  const agentRows = agentList
    .map(a => `<tr><td>${escapeHtml(a.config.name)}</td><td>${ROLE_LABEL[a.config.role]}</td><td>${escapeHtml(a.config.model.displayName)}</td></tr>`)
    .join("");

  const kpCards = (data.keyPoints ?? []).map((kp, i) => `
    <div class="kp-card">
      <span class="kp-num" style="background:${ac}">${i+1}</span>
      <span class="kp-text">${escapeHtml(kp)}</span>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(data.title)}</title>
<style>
/* ── Reset & Base ── */
*{box-sizing:border-box;margin:0;padding:0}
html{font-size:15px}
body{
  font-family:"Hiragino Kaku Gothic ProN","Yu Gothic Medium","Meiryo",sans-serif;
  color:#111827;line-height:1.9;background:#fff;
}

/* ── Page layout ── */
.page{max-width:720px;margin:0 auto;padding:48px 52px}

/* ════════════════════════
   PAGE 1 — カバー
════════════════════════ */
.cover-page{
  min-height:100vh;
  display:flex;flex-direction:column;
  border-top:6px solid ${ac};
  page-break-after:always;
}

.cover-top{
  background:linear-gradient(135deg,${ac}0d 0%,#ffffff 100%);
  padding:48px 52px 36px;
  flex:1;
}

.logo-row{display:flex;align-items:center;gap:10px;margin-bottom:32px}
.logo-badge{
  background:${ac};color:#fff;
  width:32px;height:32px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-weight:900;font-size:14px;
}
.logo-text{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:${ac}}

.type-badge{
  display:inline-block;
  font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:4px 12px;border-radius:20px;
  background:${ac}18;color:${ac};border:1px solid ${ac}44;
  margin-bottom:18px;
}

.cover-title{
  font-size:32px;font-weight:900;
  color:#0f172a;line-height:1.25;
  margin-bottom:24px;
  letter-spacing:-.02em;
}

.cover-summary{
  font-size:15px;color:#374151;line-height:1.85;
  padding:18px 22px;
  background:#fff;
  border:1px solid ${ac}33;
  border-left:4px solid ${ac};
  border-radius:0 8px 8px 0;
  margin-bottom:36px;
}

/* キーポイントカード群 */
.kp-section-label{
  font-size:11px;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;color:${ac};
  margin-bottom:14px;
}
.kp-grid{display:flex;flex-direction:column;gap:10px}
.kp-card{
  display:flex;align-items:flex-start;gap:14px;
  padding:14px 18px;
  background:#f8faff;
  border:1px solid ${ac}22;
  border-radius:8px;
}
.kp-num{
  flex-shrink:0;
  width:26px;height:26px;border-radius:50%;
  color:#fff;font-size:12px;font-weight:900;
  display:flex;align-items:center;justify-content:center;
}
.kp-text{font-size:14px;font-weight:600;color:#1e293b;line-height:1.5}

/* カバーフッター */
.cover-footer{
  padding:18px 52px;
  border-top:1px solid #e5e7eb;
  display:flex;justify-content:space-between;align-items:center;
  font-size:11px;color:#9ca3af;
}

/* ════════════════════════
   PAGE 2〜 — 詳細
════════════════════════ */
.detail-page{padding:48px 52px}

/* メタ情報 */
.meta-box{
  background:#f8faff;border:1px solid #e5e7eb;
  border-radius:8px;padding:16px 20px;
  margin-bottom:28px;
  display:grid;grid-template-columns:auto 1fr;gap:4px 16px;
  font-size:12px;
}
.meta-key{font-weight:700;color:${ac};white-space:nowrap}
.meta-val{color:#374151}

/* エージェントテーブル */
.agent-section-label{
  font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  color:${ac};margin-bottom:10px;
}
.agent-table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:36px}
.agent-table th{background:${ac}10;color:${ac};padding:8px 12px;text-align:left;font-weight:700;border:1px solid #e5e7eb}
.agent-table td{padding:7px 12px;border:1px solid #e5e7eb;color:#4b5563}

/* セクション区切り */
.sections-wrap{display:flex;flex-direction:column;gap:24px}
.section-block{
  border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;
}

/* セクションタイトル */
.sec-title{
  display:flex;align-items:center;gap:10px;
  font-size:14px;font-weight:800;
  color:#0f172a;
  padding:13px 18px;
  background:#f8faff;
  border-bottom:1px solid #e5e7eb;
}
.sec-icon{font-size:16px;line-height:1}
.sec-content{padding:16px 20px}

/* Text */
.text-body p{font-size:14px;color:#1f2937;line-height:1.85;margin-bottom:10px}
.text-body p:last-child{margin-bottom:0}

/* List */
.bullet-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:6px}
.bullet-list li{
  font-size:14px;color:#1f2937;
  padding:10px 14px 10px 36px;
  background:#f9fafb;border:1px solid #f3f4f6;border-radius:6px;
  position:relative;line-height:1.65;
}
.bullet-list li::before{
  content:"▸";position:absolute;left:14px;
  color:${ac};font-size:12px;top:11px;
}

/* Steps */
.step-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
.step-item{display:flex;align-items:flex-start;gap:14px;font-size:14px;color:#1f2937;line-height:1.7}
.step-num{
  flex-shrink:0;width:26px;height:26px;border-radius:50%;
  color:#fff;font-size:12px;font-weight:900;
  display:flex;align-items:center;justify-content:center;
  margin-top:1px;
}

/* Table */
.data-table{width:100%;border-collapse:collapse;font-size:13px}
.data-table th{padding:10px 14px;text-align:left;font-weight:700;font-size:12px;border:1px solid #e5e7eb}
.data-table td{padding:9px 14px;border:1px solid #e5e7eb;color:#1f2937;line-height:1.55}
.data-table tr.alt td{background:#f9fafb}
.data-table td.first{font-weight:600;color:#374151}

/* Highlight */
.hl-box{
  border:1.5px solid;border-left-width:4px;
  border-radius:8px;padding:16px 20px;
}
.hl-hdr{font-size:13px;font-weight:800;margin-bottom:8px;letter-spacing:.02em}
.hl-body{font-size:14px;line-height:1.8}

/* Page footer */
.page-footer{
  margin-top:48px;padding-top:14px;
  border-top:1px solid #e5e7eb;
  font-size:11px;color:#9ca3af;text-align:center;
}

/* Print */
@page{margin:0}
@media print{
  .cover-page{page-break-after:always}
  .section-block{break-inside:avoid}
}
</style>
</head>
<body>

<!-- ════ PAGE 1: カバー ════ -->
<div class="cover-page">
  <div class="cover-top">
    <div class="logo-row">
      <div class="logo-badge">AI</div>
      <div class="logo-text">AI Company</div>
    </div>
    <div class="type-badge">${escapeHtml(data.questionType)}</div>
    <h1 class="cover-title">${escapeHtml(data.title)}</h1>
    <div class="cover-summary">${escapeHtml(data.summary)}</div>
    <div class="kp-section-label">📌 重要ポイント</div>
    <div class="kp-grid">${kpCards}</div>
  </div>
  <div class="cover-footer">
    <span>AI Company — 成果物レポート</span>
    <span>${ts}</span>
  </div>
</div>

<!-- ════ PAGE 2〜: 詳細 ════ -->
<div class="detail-page">

  <div class="meta-box">
    <span class="meta-key">実行日時</span><span class="meta-val">${ts}</span>
    <span class="meta-key">ログ件数</span><span class="meta-val">${logCount}件</span>
    <span class="meta-key">指示内容</span><span class="meta-val">${escapeHtml(instruction)}</span>
  </div>

  <div class="agent-section-label">エージェント構成</div>
  <table class="agent-table">
    <thead><tr><th>名前</th><th>役割</th><th>モデル</th></tr></thead>
    <tbody>${agentRows}</tbody>
  </table>

  <div class="sections-wrap">
    ${data.sections.map(s => `<div class="section-block">${renderSection(s)}</div>`).join("\n")}
  </div>

  <div class="page-footer">Generated by AI Company — ${ts}</div>
</div>

</body>
</html>`;
}

// ── Page Component ────────────────────────────────────────────
export default function Home() {
  const { instruction, setInstruction, clearInstruction, hydrated } = usePersistedInstruction();
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

  // ── Retro PDF ─────────────────────────────────────────────
  const handleRetroPdf = async () => {
    if (!output) return;
    showToast("🎮 レトロPDF生成中...");

    // StructuredOutput → PdfData に変換
    const pdfData = {
      title: output.title || "AI REPORT",
      subtitle: instruction.slice(0, 60) || undefined,
      concept: output.summary || "",
      info: [
        { icon: "📋", label: "SECTIONS", value: `${output.sections.length} 項目` },
        { icon: "💡", label: "KEY POINTS", value: `${output.keyPoints.length} ポイント` },
        { icon: "📊", label: "TYPE", value: output.questionType ?? "—" },
        { icon: "📝", label: "LOGS", value: `${logs.length} 件` },
      ],
      days: output.sections.map((sec, i) => ({
        dayLabel: `SECTION ${String(i + 1).padStart(2, "0")}`,
        commands: [
          {
            category: sec.type === "list" ? "リスト" : sec.type === "steps" ? "手順" : sec.type === "table" ? "テーブル" : "詳細",
            title: sec.title,
            detail: sec.content ?? (sec.items ?? []).join(" / ") ?? "—",
          },
          ...(output.keyPoints[i] ? [{
            category: "ポイント",
            title: `Key Point ${i + 1}`,
            detail: output.keyPoints[i],
          }] : []),
        ],
      })),
      summary: {
        totalCost: "—",
        breakdown: [],
        hp: 90,
        mp: 75,
        exp: 100,
        bonuses: output.keyPoints.slice(0, 3),
        notes: [],
      },
    };

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfData),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `retro-report-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("🎮 レトロPDF ダウンロード完了！");
    } catch (err) {
      console.error(err);
      showToast("⚠ PDF生成に失敗しました");
    }
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
            <div className="instruction-label-row">
              <div className="panel-section-label">指示内容</div>
              {instruction && !isRunning && (
                <button className="clear-instruction-btn" onClick={clearInstruction} title="入力内容をクリア">
                  クリア
                </button>
              )}
            </div>
            <textarea
              className="instruction-textarea"
              placeholder="AIチームへの指示を入力してください..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isRunning || !hydrated}
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
              <button className="export-btn btn-retro" onClick={handleRetroPdf}   disabled={!canExport}><span className="export-icon">🎮</span>レトロ</button>
            </div>
          </div>
        </aside>

        {/* Right Panel */}
        <div className="panel-right">
          {/* Agent Cards */}
          <div className="agent-grid">
            {agentCards.length === 0
              ? AGENT_ORDER.map((id) => (
                  <AnimatedAgentCard
                    key={id}
                    card={{ config: { id, role: "system", name: id, model: { provider: "claude", modelId: "", displayName: "" }, criteria: [] }, status: "idle" }}
                    isPlaceholder
                  />
                ))
              : agentCards.map((card) => (
                  <AnimatedAgentCard key={card.config.id} card={card} />
                ))
            }
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
