"use client";

import { useEffect, useState } from "react";
import type { StructuredOutput, OutputSection, HighlightVariant, DesignSpec } from "@/agents/types";

// ── テーマ設定 ────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { color: string; colorDark: string; colorLight: string; bg: string; border: string; label: string; gradient: string }> = {
  "企画":    { color: "#2563eb", colorDark: "#1e40af", colorLight: "#eff6ff", bg: "#eff6ff", border: "#bfdbfe", label: "企画", gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" },
  "情報整理": { color: "#0369a1", colorDark: "#075985", colorLight: "#f0f9ff", bg: "#f0f9ff", border: "#bae6fd", label: "情報整理", gradient: "linear-gradient(135deg, #0369a1 0%, #0891b2 100%)" },
  "比較":    { color: "#7c3aed", colorDark: "#5b21b6", colorLight: "#f5f3ff", bg: "#f5f3ff", border: "#ddd6fe", label: "比較", gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" },
  "提案":    { color: "#059669", colorDark: "#047857", colorLight: "#f0fdf4", bg: "#f0fdf4", border: "#bbf7d0", label: "提案", gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)" },
  "ガイド":  { color: "#d97706", colorDark: "#b45309", colorLight: "#fffbeb", bg: "#fffbeb", border: "#fde68a", label: "ガイド", gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" },
};

const HL: Record<HighlightVariant, { bg: string; border: string; leftBar: string; labelColor: string; textColor: string; icon: string }> = {
  info:      { bg: "#eff6ff", border: "#bfdbfe", leftBar: "#2563eb", labelColor: "#1d4ed8", textColor: "#1e3a8a", icon: "💡" },
  warning:   { bg: "#fff7ed", border: "#fed7aa", leftBar: "#ea580c", labelColor: "#9a3412", textColor: "#7c2d12", icon: "⚠️" },
  success:   { bg: "#f0fdf4", border: "#bbf7d0", leftBar: "#16a34a", labelColor: "#15803d", textColor: "#14532d", icon: "✅" },
  important: { bg: "#faf5ff", border: "#ddd6fe", leftBar: "#7c3aed", labelColor: "#6d28d9", textColor: "#4c1d95", icon: "📌" },
};

type OutputStage = "research" | "recommendation" | "proposal";

const STAGE_META: Record<OutputStage, { label: string; title: string; icon: string; keywords: string[] }> = {
  research:       { label: "STEP 1", title: "調査・比較", icon: "🔍", keywords: ["調査","比較","分析","概要","市場","競合","背景","目的","特徴","データ","情報","リサーチ"] },
  recommendation: { label: "STEP 2", title: "おすすめ案", icon: "⭐", keywords: ["おすすめ","推奨","結論","提案","選定","判断","最適","案","方向性"] },
  proposal:       { label: "STEP 3", title: "企画メモ",   icon: "🚀", keywords: ["実施","実行","手順","計画","アクション","ロードマップ","進め方","企画","機能","収益","リスク","準備"] },
};

function classifySectionStage(section: OutputSection): OutputStage {
  if (!section) return "research";
  const haystack = `${section.title ?? ""} ${section.content ?? ""} ${(section.items ?? []).join(" ")}`.toLowerCase();
  if (STAGE_META.recommendation.keywords.some(k => haystack.includes(k))) return "recommendation";
  if (section.type === "steps" || STAGE_META.proposal.keywords.some(k => haystack.includes(k))) return "proposal";
  return "research";
}

function buildStructuredSections(sections: OutputSection[]) {
  const staged = (sections ?? []).filter(Boolean).map((section, originalIndex) => ({
    section, stage: classifySectionStage(section), originalIndex,
  }));
  staged.sort((a, b) => {
    const order: OutputStage[] = ["research", "recommendation", "proposal"];
    const stageDiff = order.indexOf(a.stage) - order.indexOf(b.stage);
    return stageDiff !== 0 ? stageDiff : a.originalIndex - b.originalIndex;
  });
  return staged.map((entry, index, arr) => ({
    ...entry,
    stageIndex: arr.filter(item => item.stage === entry.stage && item.originalIndex <= entry.originalIndex).length - 1,
    stageTotal: arr.filter(item => item.stage === entry.stage).length,
    displayIndex: index,
  }));
}

function buildSlides(data: StructuredOutput) {
  const structuredSections = buildStructuredSections(data.sections);
  return [
    { type: "cover" as const, data },
    { type: "keypoints" as const, data },
    ...structuredSections.map(entry => ({
      type: "section" as const,
      index: entry.displayIndex,
      section: entry.section,
      stage: entry.stage,
      stageIndex: entry.stageIndex,
      stageTotal: entry.stageTotal,
      data,
    })),
    ...(data.designSpec ? [{ type: "design" as const, spec: data.designSpec, data }] : []),
  ];
}

function buildSubtitle(data: StructuredOutput) {
  const stageNames = Array.from(new Set(buildStructuredSections(data.sections).map(e => STAGE_META[e.stage].title)));
  return stageNames.length > 0 ? stageNames.join(" → ") : "調査から提案まで";
}

// ── カバースライド ────────────────────────────────────────────
function CoverSlide({ data, cfg }: { data: StructuredOutput; cfg: typeof TYPE_CONFIG[string] }) {
  const subtitle = buildSubtitle(data);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* 上部グラデーションヘッダー */}
      <div style={{
        background: cfg.gradient,
        padding: "36px 48px 32px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* 背景デコレーション */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, right: 80,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }} />

        {/* タイプバッジ */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 999, padding: "5px 14px", marginBottom: 18,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.95)", textTransform: "uppercase" }}>
            {cfg.label}
          </span>
        </div>

        {/* タイトル */}
        <h1 style={{
          fontSize: 26, fontWeight: 900, color: "white",
          lineHeight: 1.25, letterSpacing: "-0.02em", margin: "0 0 12px",
          textShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}>
          {data.title}
        </h1>

        {/* フロー表示 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {subtitle.split(" → ").map((s, i, arr) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 9px",
              }}>{s}</span>
              {i < arr.length - 1 && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* サマリー本文 */}
      <div style={{ flex: 1, padding: "28px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: 14, padding: "20px 24px",
          borderLeft: `4px solid ${cfg.color}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: cfg.color, textTransform: "uppercase", marginBottom: 10 }}>
            エグゼクティブサマリー
          </div>
          <p style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.85, margin: 0, fontWeight: 400 }}>
            {data.summary}
          </p>
        </div>

        {/* メタ情報 */}
        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          {[
            { label: "調査タイプ", value: data.questionType },
            { label: "作成者", value: "AI Company" },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, background: cfg.colorLight, border: `1px solid ${cfg.border}`,
              borderRadius: 10, padding: "10px 14px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, color: cfg.colorDark, fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── キーポイントスライド ──────────────────────────────────────
function KeyPointsSlide({ data, cfg }: { data: StructuredOutput; cfg: typeof TYPE_CONFIG[string] }) {
  const points = data.keyPoints ?? [];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "32px 40px" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: cfg.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20 }}>📌</span>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: cfg.color, textTransform: "uppercase" }}>Key Points</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>重要ポイント</h2>
        </div>
      </div>

      {/* ポイントカード */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, justifyContent: "center" }}>
        {points.map((pt, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            padding: "16px 20px",
            background: i === 0 ? cfg.colorLight : "white",
            border: `1.5px solid ${i === 0 ? cfg.border : "#e2e8f0"}`,
            borderRadius: 12,
            boxShadow: i === 0 ? `0 4px 16px ${cfg.color}18` : "0 1px 4px rgba(0,0,0,0.04)",
            transition: "all 0.2s",
          }}>
            {/* 番号バッジ */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: i === 0 ? cfg.gradient : "#f1f5f9",
              color: i === 0 ? "white" : "#64748b",
              fontSize: 13, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: i === 0 ? `0 4px 10px ${cfg.color}40` : "none",
            }}>{i + 1}</div>
            <span style={{
              fontSize: 14, color: i === 0 ? cfg.colorDark : "#374151",
              lineHeight: 1.65, fontWeight: i === 0 ? 600 : 400, paddingTop: 4,
            }}>{pt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── セクション本体 ────────────────────────────────────────────
function SectionBody({ section, color, colorDark, colorLight, border }: {
  section: OutputSection; color: string; colorDark: string; colorLight: string; border: string;
}) {
  switch (section.type) {
    case "text":
      return (
        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.9 }}>
          {(section.content ?? "").split("\n").map((line, i) =>
            line.trim()
              ? <p key={i} style={{ margin: "0 0 10px", paddingLeft: 0 }}>{line}</p>
              : <div key={i} style={{ height: 6 }} />
          )}
        </div>
      );

    case "list":
      return (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {(section.items ?? []).map((item, i) => (
            <li key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 16px",
              background: i % 2 === 0 ? colorLight : "white",
              border: `1px solid ${border}`,
              borderRadius: 10,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: color, color: "white", fontSize: 11, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.65 }}>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {(section.items ?? []).map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <span style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)`,
                  color: "white", fontSize: 13, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 10px ${color}40`,
                }}>{i + 1}</span>
                {i < (section.items ?? []).length - 1 && (
                  <div style={{ width: 2, height: 16, background: `${color}30`, marginTop: 2 }} />
                )}
              </div>
              <div style={{
                flex: 1, padding: "6px 16px 14px",
                background: "#f8fafc", borderRadius: "0 10px 10px 0",
                borderLeft: `3px solid ${color}40`,
              }}>
                <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.65 }}>{item}</span>
              </div>
            </li>
          ))}
        </ol>
      );

    case "table": {
      const { headers = [], rows = [] } = section.tableData ?? {};
      return (
        <div style={{ overflowX: "auto", borderRadius: 12, border: `1.5px solid ${border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)` }}>
                {headers.map((h, i) => (
                  <th key={i} style={{
                    padding: "12px 16px", textAlign: "left",
                    color: "white", fontWeight: 800, fontSize: 12,
                    letterSpacing: "0.04em", borderBottom: "none",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? colorLight : "white" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: "11px 16px", color: j === 0 ? colorDark : "#374151",
                      fontWeight: j === 0 ? 700 : 400,
                      borderBottom: i < rows.length - 1 ? `1px solid ${border}` : "none",
                      fontSize: 13, lineHeight: 1.5,
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default: return null;
  }
}

// ── セクションスライド ────────────────────────────────────────
function SectionSlide({ section, index, total, cfg, stage, stageIndex, stageTotal }: {
  section: OutputSection; index: number; total: number;
  cfg: typeof TYPE_CONFIG[string]; stage: OutputStage; stageIndex: number; stageTotal: number;
}) {
  const stageMeta = STAGE_META[stage];

  // ハイライト型
  if (section.type === "highlight") {
    const hcfg = HL[section.highlight ?? "info"];
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* スライドヘッダーバー */}
        <SlideHeader index={index} total={total} cfg={cfg} stageMeta={stageMeta} stageIndex={stageIndex} stageTotal={stageTotal} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 40px" }}>
          <div style={{
            background: hcfg.bg, border: `1.5px solid ${hcfg.border}`,
            borderLeft: `6px solid ${hcfg.leftBar}`,
            borderRadius: "0 16px 16px 0",
            padding: "28px 32px", maxWidth: 560, width: "100%",
            boxShadow: `0 8px 32px ${hcfg.leftBar}18`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>{section.icon ?? hcfg.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: hcfg.labelColor }}>{section.title}</span>
            </div>
            <p style={{ fontSize: 14, color: hcfg.textColor, lineHeight: 1.85, margin: 0 }}>{section.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* スライドヘッダーバー */}
      <SlideHeader index={index} total={total} cfg={cfg} stageMeta={stageMeta} stageIndex={stageIndex} stageTotal={stageTotal} />

      {/* セクションタイトル */}
      <div style={{ padding: "16px 40px 12px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{section.icon ?? stageMeta.icon}</span>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{section.title}</h2>
        </div>
      </div>

      {/* 本文 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px 28px" }}>
        <SectionBody
          section={section}
          color={cfg.color}
          colorDark={cfg.colorDark}
          colorLight={cfg.colorLight}
          border={cfg.border}
        />
      </div>
    </div>
  );
}

// ── スライドヘッダーバー ──────────────────────────────────────
function SlideHeader({ index, total, cfg, stageMeta, stageIndex, stageTotal }: {
  index: number; total: number; cfg: typeof TYPE_CONFIG[string];
  stageMeta: typeof STAGE_META[OutputStage]; stageIndex: number; stageTotal: number;
}) {
  return (
    <div style={{
      padding: "10px 40px",
      background: cfg.colorLight,
      borderBottom: `2px solid ${cfg.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>{stageMeta.icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
          color: cfg.color,
        }}>
          {stageMeta.label} · {stageMeta.title}
          {stageTotal > 1 && <span style={{ opacity: 0.6 }}> {stageIndex + 1}/{stageTotal}</span>}
        </span>
      </div>
      <span style={{ fontSize: 11, color: "rgba(0,0,0,0.3)", fontWeight: 600 }}>
        {index + 1} / {total}
      </span>
    </div>
  );
}

// ── デザインスライド ──────────────────────────────────────────
function DesignSlide({ spec, cfg }: { spec: DesignSpec; cfg: typeof TYPE_CONFIG[string] }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 40px", background: cfg.colorLight, borderBottom: `2px solid ${cfg.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>🎨</span>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: cfg.color }}>Design Spec</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Canva デザイン仕様</h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{spec.concept}</p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160, background: "#f8fafc", borderRadius: 12, padding: "16px 20px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: cfg.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>カラー</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(spec.colors).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: v, border: "1px solid rgba(0,0,0,0.12)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#374151" }}>{k}: <span style={{ fontFamily: "monospace", color: cfg.colorDark, fontWeight: 600 }}>{v}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160, background: "#f8fafc", borderRadius: 12, padding: "16px 20px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: cfg.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>フォント</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(spec.fonts).map(([k, v]) => (
                <div key={k} style={{ fontSize: 12, color: "#374151" }}>
                  <span style={{ fontWeight: 700, color: cfg.colorDark }}>{k}:</span> {v}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: cfg.colorLight, borderRadius: 12, padding: "16px 20px", border: `1px solid ${cfg.border}`, borderLeft: `4px solid ${cfg.color}` }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: cfg.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Canva 作成手順</div>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.9, whiteSpace: "pre-line" }}>
            {spec.canvaInstructions}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────────
export default function OutputRenderer({ data }: { data: StructuredOutput }) {
  const cfg = TYPE_CONFIG[data.questionType] ?? TYPE_CONFIG["情報整理"];
  const slides = buildSlides(data);
  const [current, setCurrent] = useState(0);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const prev = () => setCurrent(i => Math.max(0, i - 1));
  const next = () => setCurrent(i => Math.min(slides.length - 1, i + 1));
  const slide = slides[current];
  const sectionSlides = slides.filter(s => s.type === "section");

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: "#f1f5f9",
    }}>
      {/* トップバー */}
      <div style={{
        margin: isCompact ? "10px 10px 0" : "14px 14px 0",
        padding: "12px 18px",
        borderRadius: 14,
        background: "white",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: cfg.color, marginBottom: 3 }}>
            {cfg.label} Report
          </div>
          <div style={{
            fontSize: isCompact ? 14 : 15, fontWeight: 800, color: "#0f172a",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {data.title}
          </div>
        </div>
        <div style={{
          flexShrink: 0, fontSize: 12, fontWeight: 700,
          color: cfg.color, background: cfg.colorLight,
          border: `1.5px solid ${cfg.border}`,
          borderRadius: 999, padding: "5px 12px",
        }}>
          {current + 1} / {slides.length}
        </div>
      </div>

      {/* スライド本体 */}
      <div style={{
        flex: 1, overflow: "hidden",
        background: "white",
        borderRadius: 14,
        margin: isCompact ? "10px 10px 0" : "10px 14px 0",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
      }}>
        {slide.type === "cover"      && <CoverSlide data={data} cfg={cfg} />}
        {slide.type === "keypoints"  && <KeyPointsSlide data={data} cfg={cfg} />}
        {slide.type === "section"    && (
          <SectionSlide
            section={slide.section} index={slide.index}
            total={sectionSlides.length} cfg={cfg}
            stage={slide.stage} stageIndex={slide.stageIndex} stageTotal={slide.stageTotal}
          />
        )}
        {slide.type === "design" && <DesignSlide spec={slide.spec} cfg={cfg} />}
      </div>

      {/* ナビゲーション */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isCompact ? "12px 10px calc(12px + env(safe-area-inset-bottom))" : "10px 14px",
        flexShrink: 0,
        position: isCompact ? "sticky" : "static",
        bottom: 0,
        background: isCompact ? "rgba(241,245,249,0.95)" : "transparent",
        backdropFilter: isCompact ? "blur(12px)" : "none",
        borderTop: isCompact ? "1px solid #e2e8f0" : "none",
      }}>
        <button onClick={prev} disabled={current === 0} style={{
          padding: isCompact ? "12px 20px" : "7px 18px",
          borderRadius: isCompact ? 12 : 8,
          background: current === 0 ? "#f1f5f9" : cfg.gradient,
          color: current === 0 ? "#94a3b8" : "white",
          border: "none", cursor: current === 0 ? "default" : "pointer",
          fontSize: isCompact ? 15 : 13, fontWeight: 700,
          minWidth: isCompact ? 100 : "auto",
          boxShadow: current !== 0 ? `0 4px 14px ${cfg.color}40` : "none",
          transition: "all 0.15s",
        }}>← 前へ</button>

        {/* ドットインジケーター */}
        <div style={{ display: "flex", gap: isCompact ? 7 : 5, alignItems: "center", flex: 1, justifyContent: "center", padding: "0 8px" }}>
          {slides.map((_s, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? (isCompact ? 22 : 18) : (isCompact ? 8 : 6),
              height: isCompact ? 8 : 6,
              borderRadius: 999,
              background: i === current ? cfg.color : "#cbd5e1",
              border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.2s",
            }} />
          ))}
        </div>

        <button onClick={next} disabled={current === slides.length - 1} style={{
          padding: isCompact ? "12px 20px" : "7px 18px",
          borderRadius: isCompact ? 12 : 8,
          background: current === slides.length - 1 ? "#f1f5f9" : cfg.gradient,
          color: current === slides.length - 1 ? "#94a3b8" : "white",
          border: "none", cursor: current === slides.length - 1 ? "default" : "pointer",
          fontSize: isCompact ? 15 : 13, fontWeight: 700,
          minWidth: isCompact ? 100 : "auto",
          boxShadow: current !== slides.length - 1 ? `0 4px 14px ${cfg.color}40` : "none",
          transition: "all 0.15s",
        }}>次へ →</button>
      </div>
    </div>
  );
}
