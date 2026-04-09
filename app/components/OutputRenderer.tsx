"use client";

import { useEffect, useState } from "react";
import type { StructuredOutput, OutputSection, HighlightVariant, DesignSpec } from "@/agents/types";

// ── 質問タイプ設定 ─────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "企画":    { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "企画" },
  "情報整理": { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", label: "情報整理" },
  "比較":    { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", label: "比較" },
  "提案":    { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", label: "提案" },
  "ガイド":  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "ガイド" },
};

const HL: Record<HighlightVariant, { bg: string; border: string; leftBar: string; labelColor: string; textColor: string; icon: string }> = {
  info:      { bg:"#eff6ff", border:"#bfdbfe", leftBar:"#2563eb", labelColor:"#1d4ed8", textColor:"#1e40af", icon:"💡" },
  warning:   { bg:"#fff7ed", border:"#fed7aa", leftBar:"#ea580c", labelColor:"#9a3412", textColor:"#7c2d12", icon:"⚠" },
  success:   { bg:"#f0fdf4", border:"#bbf7d0", leftBar:"#16a34a", labelColor:"#15803d", textColor:"#14532d", icon:"✅" },
  important: { bg:"#faf5ff", border:"#ddd6fe", leftBar:"#7c3aed", labelColor:"#6d28d9", textColor:"#4c1d95", icon:"📌" },
};

type OutputStage = "research" | "recommendation" | "proposal";

const STAGE_META: Record<OutputStage, { label: string; title: string; keywords: string[] }> = {
  research: {
    label: "STEP 1",
    title: "調査・比較",
    keywords: ["調査", "比較", "分析", "概要", "市場", "競合", "背景", "目的", "特徴", "データ", "情報", "リサーチ"],
  },
  recommendation: {
    label: "STEP 2",
    title: "おすすめ案",
    keywords: ["おすすめ", "推奨", "結論", "提案", "選定", "判断", "最適", "案", "方向性"],
  },
  proposal: {
    label: "STEP 3",
    title: "企画メモ",
    keywords: ["実施", "実行", "手順", "計画", "アクション", "ロードマップ", "進め方", "企画", "機能", "収益", "リスク", "準備"],
  },
};

function classifySectionStage(section: OutputSection): OutputStage {
  const haystack = `${section.title} ${section.content ?? ""} ${(section.items ?? []).join(" ")}`.toLowerCase();

  if (STAGE_META.recommendation.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
    return "recommendation";
  }
  if (
    section.type === "steps" ||
    STAGE_META.proposal.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
  ) {
    return "proposal";
  }
  return "research";
}

function buildStructuredSections(sections: OutputSection[]) {
  const staged = sections.map((section, originalIndex) => ({
    section,
    stage: classifySectionStage(section),
    originalIndex,
  }));

  staged.sort((a, b) => {
    const order: OutputStage[] = ["research", "recommendation", "proposal"];
    const stageDiff = order.indexOf(a.stage) - order.indexOf(b.stage);
    return stageDiff !== 0 ? stageDiff : a.originalIndex - b.originalIndex;
  });

  return staged.map((entry, index, arr) => ({
    ...entry,
    stageIndex: arr.filter((item) => item.stage === entry.stage && item.originalIndex <= entry.originalIndex).length - 1,
    stageTotal: arr.filter((item) => item.stage === entry.stage).length,
    displayIndex: index,
  }));
}

// ── スライドデータ生成 ────────────────────────────────────────
function buildSlides(data: StructuredOutput) {
  const structuredSections = buildStructuredSections(data.sections);
  const slides = [
    { type: "cover" as const, data },
    { type: "keypoints" as const, data },
    ...structuredSections.map((entry) => ({
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
  return slides;
}

function buildSubtitle(data: StructuredOutput) {
  const stageNames = Array.from(new Set(buildStructuredSections(data.sections).map((entry) => STAGE_META[entry.stage].title)));
  return stageNames.length > 0
    ? `${stageNames.join(" / ")} を1本のレポートに整理`
    : "調査から提案までを整理した共有レポート";
}

// ── カバースライド ────────────────────────────────────────────
function CoverSlide({ data, color, bg, border, label }: {
  data: StructuredOutput; color: string; bg: string; border: string; label: string;
}) {
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "48px 56px",
      background: `linear-gradient(135deg, ${color}08 0%, white 100%)`,
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
        color, background: bg, border: `1px solid ${border}`,
        borderRadius: 20, padding: "4px 12px", marginBottom: 24, alignSelf: "flex-start",
      }}>
        {label}
      </div>
      <h1 style={{
        fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1.2,
        letterSpacing: "-0.02em", marginBottom: 20,
      }}>
        {data.title}
      </h1>
      <p style={{
        fontSize: 15, color: "#374151", lineHeight: 1.85,
        padding: "16px 20px",
        borderLeft: `4px solid ${color}`,
        background: "white",
        borderRadius: "0 8px 8px 0",
        maxWidth: 560,
      }}>
        {data.summary}
      </p>
      <div style={{ marginTop: 32, display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: 11, color: "rgba(0,0,0,0.3)", letterSpacing: "0.06em" }}>
          AI Company — {data.questionType}
        </span>
      </div>
    </div>
  );
}

// ── キーポイントスライド ──────────────────────────────────────
function KeyPointsSlide({ data, color, bg, border }: {
  data: StructuredOutput; color: string; bg: string; border: string;
}) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "40px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <span style={{ fontSize: 20 }}>📌</span>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>重要ポイント</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
        {(data.keyPoints ?? []).map((pt, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 16,
            padding: "18px 20px",
            background: i === 0 ? bg : "white",
            border: `1px solid ${i === 0 ? border : "#e5e7eb"}`,
            borderLeft: `4px solid ${color}`,
            borderRadius: "0 10px 10px 0",
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: "50%", background: color,
              color: "white", fontSize: 13, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{i + 1}</span>
            <span style={{ fontSize: 15, color: "#1f2937", lineHeight: 1.6, fontWeight: i === 0 ? 600 : 400 }}>{pt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── セクションスライド ────────────────────────────────────────
function SectionSlide({ section, index, total, color, stage, stageIndex, stageTotal }: {
  section: OutputSection; index: number; total: number; color: string; stage: OutputStage; stageIndex: number; stageTotal: number;
}) {
  const stageMeta = STAGE_META[stage];

  if (section.type === "highlight") {
    const hcfg = HL[section.highlight ?? "info"];
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "40px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em" }}>
            SECTION {index + 1} / {total}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
            color, background: color + "12", border: `1px solid ${color}22`,
            borderRadius: 999, padding: "4px 10px",
          }}>
            {stageMeta.label} • {stageMeta.title} {stageTotal > 1 ? `${stageIndex + 1}/${stageTotal}` : ""}
          </div>
        </div>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: hcfg.bg, border: `1px solid ${hcfg.border}`,
            borderLeft: `6px solid ${hcfg.leftBar}`,
            borderRadius: "0 12px 12px 0",
            padding: "28px 32px", maxWidth: 560,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{section.icon ?? hcfg.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: hcfg.labelColor }}>{section.title}</span>
            </div>
            <p style={{ fontSize: 14, color: hcfg.textColor, lineHeight: 1.8, margin: 0 }}>{section.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "40px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em" }}>
          SECTION {index + 1} / {total}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
          color, background: color + "12", border: `1px solid ${color}22`,
          borderRadius: 999, padding: "4px 10px",
        }}>
          {stageMeta.label} • {stageMeta.title} {stageTotal > 1 ? `${stageIndex + 1}/${stageTotal}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 18 }}>{section.icon ?? "📋"}</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, color, margin: 0 }}>{section.title}</h2>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <SectionBody section={section} color={color} />
      </div>
    </div>
  );
}

// ── デザインスライド ──────────────────────────────────────────
function DesignSlide({ spec, color }: { spec: DesignSpec; color: string }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "40px 48px", overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 18 }}>🎨</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, color, margin: 0 }}>Canva デザイン仕様</h2>
      </div>
      <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", marginBottom: 20 }}>{spec.concept}</p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* カラー */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>カラー</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(spec.colors).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: v, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#374151" }}>{k}: <span style={{ fontFamily: "monospace" }}>{v}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* フォント */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>フォント</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(spec.fonts).map(([k, v]) => (
              <div key={k} style={{ fontSize: 11, color: "#374151" }}>
                <span style={{ fontWeight: 600 }}>{k}:</span> {v}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Canva手順 */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Canva 作成手順</div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.9, whiteSpace: "pre-line",
          background: color + "06", padding: "12px 16px", borderRadius: 8, borderLeft: `3px solid ${color}` }}>
          {spec.canvaInstructions}
        </div>
      </div>
    </div>
  );
}

// ── セクション本体 ────────────────────────────────────────────
function SectionBody({ section, color }: { section: OutputSection; color: string }) {
  switch (section.type) {
    case "text":
      return (
        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.9 }}>
          {(section.content ?? "").split("\n").map((line, i) =>
            line.trim() ? <p key={i} style={{ margin: "0 0 8px" }}>{line}</p> : <div key={i} style={{ height: 8 }} />
          )}
        </div>
      );
    case "list":
      return (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {(section.items ?? []).map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color, fontSize: 14, flexShrink: 0, marginTop: 2 }}>▸</span>
              <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {(section.items ?? []).map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{
                width: 26, height: 26, borderRadius: "50%", background: color,
                color: "white", fontSize: 12, fontWeight: 900, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, paddingTop: 3 }}>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "table": {
      const { headers = [], rows = [] } = section.tableData ?? {};
      return (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={{
                    padding: "10px 14px", textAlign: "left",
                    background: color + "15", color,
                    fontWeight: 700, fontSize: 12, letterSpacing: "0.04em",
                    borderBottom: `2px solid ${color}30`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? "#f8fafc" : "white" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: "10px 14px", color: "#374151",
                      fontWeight: j === 0 ? 600 : 400,
                      borderBottom: "1px solid #f1f5f9",
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

// ── メインコンポーネント ──────────────────────────────────────
export default function OutputRenderer({ data }: { data: StructuredOutput }) {
  const cfg = TYPE_CONFIG[data.questionType] ?? TYPE_CONFIG["情報整理"];
  const slides = buildSlides(data);
  const [current, setCurrent] = useState(0);
  const [isCompact, setIsCompact] = useState(false);
  const createdAt = new Date().toLocaleString("ja-JP");
  const subtitle = buildSubtitle(data);

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
      background: "linear-gradient(180deg, #f7f2ea 0%, #f3f6fb 100%)",
    }}>
      <div style={{
        margin: isCompact ? "12px 12px 0" : "16px 16px 0",
        padding: isCompact ? "12px 14px" : "14px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.78)",
        border: "1px solid rgba(28,24,20,0.08)",
        boxShadow: "0 10px 30px rgba(28,24,20,0.06)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,24,20,0.5)", marginBottom: 4 }}>
              Shared Report
            </div>
            <div style={{
              fontSize: isCompact ? 15 : 16,
              fontWeight: 800,
              color: "#1c1814",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {data.title}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: "#6b6258", marginTop: 4 }}>
              {subtitle}
            </div>
          </div>
          <div style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 999,
            padding: "5px 10px",
          }}>
            {current + 1} / {slides.length}
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: 8,
          marginBottom: 8,
        }}>
          {[
            { label: "作成日時", value: createdAt },
            { label: "作成者", value: "AI Company" },
            { label: "共有用サブタイトル", value: subtitle },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(28,24,20,0.08)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,24,20,0.45)", marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#3d342c" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "#5a4e44" }}>
          調査結果からおすすめ案、企画メモまでをそのまま共有できるビューです。
        </div>
      </div>

      {/* スライド本体 */}
      <div style={{
        flex: 1, overflow: "hidden",
        background: "white",
        borderRadius: 12,
        margin: isCompact ? "12px 12px 0" : "12px 12px 0",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
        position: "relative",
      }}>
        {slide.type === "cover" && (
          <CoverSlide data={data} color={cfg.color} bg={cfg.bg} border={cfg.border} label={cfg.label} />
        )}
        {slide.type === "keypoints" && (
          <KeyPointsSlide data={data} color={cfg.color} bg={cfg.bg} border={cfg.border} />
        )}
        {slide.type === "section" && (
          <SectionSlide
            section={slide.section}
            index={slide.index}
            total={sectionSlides.length}
            color={cfg.color}
            stage={slide.stage}
            stageIndex={slide.stageIndex}
            stageTotal={slide.stageTotal}
          />
        )}
        {slide.type === "design" && (
          <DesignSlide spec={slide.spec} color={cfg.color} />
        )}
      </div>

      {/* ナビゲーション */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isCompact ? "14px 12px calc(14px + env(safe-area-inset-bottom))" : "10px 16px",
        flexShrink: 0,
        position: isCompact ? "sticky" : "static",
        bottom: 0,
        background: isCompact ? "rgba(237,234,227,0.92)" : "transparent",
        backdropFilter: isCompact ? "blur(12px)" : "none",
        borderTop: isCompact ? "1px solid rgba(28,24,20,0.08)" : "none",
      }}>
        {/* 前へ */}
        <button onClick={prev} disabled={current === 0} style={{
          padding: isCompact ? "14px 18px" : "6px 16px", borderRadius: isCompact ? 14 : 8,
          background: current === 0 ? "#f1f5f9" : cfg.color,
          color: current === 0 ? "#94a3b8" : "white",
          border: "none", cursor: current === 0 ? "default" : "pointer",
          fontSize: isCompact ? 16 : 13, fontWeight: 700,
          minWidth: isCompact ? 112 : "auto",
          transition: "all 0.15s",
          boxShadow: isCompact && current !== 0 ? "0 8px 18px rgba(0,0,0,0.12)" : "none",
        }}>← 前へ</button>

        {/* ドットインジケーター */}
        <div style={{ display: "flex", gap: isCompact ? 8 : 6, alignItems: "center", justifyContent: "center", flex: 1, padding: "0 10px" }}>
          {slides.map((_s, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? (isCompact ? 24 : 20) : (isCompact ? 10 : 7),
              height: isCompact ? 10 : 7, borderRadius: 999,
              background: i === current ? cfg.color : "#cbd5e1",
              border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.2s",
            }} />
          ))}
        </div>

        {/* 次へ */}
        <button onClick={next} disabled={current === slides.length - 1} style={{
          padding: isCompact ? "14px 18px" : "6px 16px", borderRadius: isCompact ? 14 : 8,
          background: current === slides.length - 1 ? "#f1f5f9" : cfg.color,
          color: current === slides.length - 1 ? "#94a3b8" : "white",
          border: "none", cursor: current === slides.length - 1 ? "default" : "pointer",
          fontSize: isCompact ? 16 : 13, fontWeight: 700,
          minWidth: isCompact ? 112 : "auto",
          transition: "all 0.15s",
          boxShadow: isCompact && current !== slides.length - 1 ? "0 8px 18px rgba(0,0,0,0.12)" : "none",
        }}>次へ →</button>
      </div>

      {/* スライド番号 */}
      <div style={{ textAlign: "center", paddingBottom: isCompact ? 6 : 8, fontSize: 11, color: "#94a3b8" }}>
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}
