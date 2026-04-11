"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { StructuredOutput, OutputSection, HighlightVariant } from "@/agents/types";
import OutputRenderer from "./OutputRenderer";

type DeliverableView = "standard" | "executive" | "proposal" | "slides";
type SectionStage = "research" | "recommendation" | "proposal";

const VIEW_META: Record<DeliverableView, { label: string; subtitle: string; color: string; bg: string }> = {
  standard: { label: "標準", subtitle: "通常の成果物", color: "#3b82f6", bg: "#eff6ff" },
  executive: { label: "経営向け", subtitle: "決裁しやすい要約", color: "#7c3aed", bg: "#f5f3ff" },
  proposal: { label: "提案書", subtitle: "提案と実行計画", color: "#059669", bg: "#ecfdf5" },
  slides: { label: "スライド", subtitle: "プレゼン表示", color: "#f97316", bg: "#fff7ed" },
};

const TYPE_ACCENT: Record<string, { color: string; bg: string; border: string }> = {
  企画: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  情報整理: { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  比較: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  提案: { color: "#059669", bg: "#ecfdf5", border: "#bbf7d0" },
  ガイド: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};

function sectionHaystack(section: OutputSection) {
  return `${section.title ?? ""} ${section.content ?? ""} ${(section.items ?? []).join(" ")}`.toLowerCase();
}

function classifySection(section: OutputSection): SectionStage {
  const haystack = sectionHaystack(section);
  if (["おすすめ", "推奨", "結論", "選定", "最適", "提案サマリー"].some((word) => haystack.includes(word))) {
    return "recommendation";
  }
  if (section.type === "steps" || ["実施", "実行", "手順", "計画", "アクション", "ロードマップ", "進め方", "企画"].some((word) => haystack.includes(word))) {
    return "proposal";
  }
  return "research";
}

function isRiskSection(section: OutputSection) {
  const haystack = sectionHaystack(section);
  return section.highlight === "warning" || ["リスク", "注意", "懸念", "課題", "確認"].some((word) => haystack.includes(word));
}

function isSourceSection(section: OutputSection) {
  const haystack = sectionHaystack(section);
  return ["出典", "ソース", "情報源", "参照"].some((word) => haystack.includes(word));
}

function takeActionItems(data: StructuredOutput) {
  const fromSteps = data.sections.find((section) => section.type === "steps" && (section.items?.length ?? 0) > 0);
  if (fromSteps?.items?.length) return fromSteps.items.slice(0, 4);

  const proposalList = data.sections.find((section) => classifySection(section) === "proposal" && (section.items?.length ?? 0) > 0);
  if (proposalList?.items?.length) return proposalList.items.slice(0, 4);

  const anyList = data.sections.find((section) => (section.items?.length ?? 0) > 0);
  return anyList?.items?.slice(0, 4) ?? [];
}

function firstSentence(text: string) {
  const matched = text.split(/。|\n/).map((item) => item.trim()).find(Boolean);
  return matched ? `${matched}${matched.endsWith("。") ? "" : "。"} ` : text;
}

function SectionShell({
  title,
  eyebrow,
  accent,
  children,
}: {
  title: string;
  eyebrow?: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid rgba(148,163,184,0.28)",
        borderRadius: 18,
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
        padding: "18px 18px 16px",
      }}
    >
      {(eyebrow || title) && (
        <div style={{ marginBottom: 12 }}>
          {eyebrow && (
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", color: accent, textTransform: "uppercase", marginBottom: 5 }}>
              {eyebrow}
            </div>
          )}
          <div style={{ fontSize: 19, fontWeight: 900, color: "#0f172a", lineHeight: 1.3 }}>{title}</div>
        </div>
      )}
      {children}
    </section>
  );
}

function HighlightBox({
  title,
  content,
  variant = "info",
}: {
  title: string;
  content: string;
  variant?: HighlightVariant;
}) {
  const meta: Record<HighlightVariant, { bg: string; border: string; color: string }> = {
    info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
    warning: { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c" },
    success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d" },
    important: { bg: "#faf5ff", border: "#ddd6fe", color: "#7c3aed" },
  };
  const cfg = meta[variant];

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1.5px solid ${cfg.border}`,
        background: cfg.bg,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", color: cfg.color, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.8, color: "#334155" }}>{content}</div>
    </div>
  );
}

function renderSectionContent(section: OutputSection, accent: string) {
  if (section.type === "highlight") {
    return <HighlightBox title={section.title} content={section.content ?? ""} variant={section.highlight ?? "info"} />;
  }

  if (section.type === "text") {
    return <div style={{ fontSize: 14, lineHeight: 1.85, color: "#334155", whiteSpace: "pre-line" }}>{section.content}</div>;
  }

  if (section.type === "list" || section.type === "steps") {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {(section.items ?? []).map((item, index) => (
          <div
            key={`${section.title}-${index}`}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "12px 14px",
              borderRadius: 14,
              background: "#f8fafc",
              border: "1px solid rgba(148,163,184,0.2)",
            }}
          >
            <div
              style={{
                minWidth: 24,
                height: 24,
                borderRadius: 999,
                background: accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 900,
                boxShadow: `0 4px 10px ${accent}40`,
              }}
            >
              {index + 1}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.75, color: "#334155" }}>{item}</div>
          </div>
        ))}
      </div>
    );
  }

  if (section.type === "table") {
    const headers = section.tableData?.headers ?? [];
    const rows = section.tableData?.rows ?? [];
    return (
      <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(148,163,184,0.24)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: accent }}>
              {headers.map((header, index) => (
                <th key={`${header}-${index}`} style={{ padding: "12px 14px", color: "#fff", textAlign: "left", whiteSpace: "nowrap" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} style={{ background: rowIndex % 2 === 0 ? "#fff" : "#f8fafc" }}>
                {row.map((cell, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`} style={{ padding: "11px 14px", borderTop: "1px solid rgba(148,163,184,0.16)", color: "#334155", lineHeight: 1.65 }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}

function StandardView({ data }: { data: StructuredOutput }) {
  const accent = TYPE_ACCENT[data.questionType] ?? TYPE_ACCENT["情報整理"];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionShell title={data.title} eyebrow={data.questionType} accent={accent.color}>
        <div style={{ fontSize: 15, lineHeight: 1.9, color: "#334155" }}>{data.summary}</div>
      </SectionShell>

      <SectionShell title="重要ポイント" eyebrow="Key Points" accent={accent.color}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {(data.keyPoints ?? []).map((point, index) => (
            <div
              key={`${point}-${index}`}
              style={{
                borderRadius: 16,
                padding: "14px 16px",
                background: accent.bg,
                border: `1px solid ${accent.border}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 900, color: accent.color, marginBottom: 6 }}>POINT {index + 1}</div>
              <div style={{ fontSize: 14, lineHeight: 1.75, color: "#1e293b", fontWeight: 700 }}>{point}</div>
            </div>
          ))}
        </div>
      </SectionShell>

      {data.sections.map((section, index) => (
        <SectionShell key={`${section.title}-${index}`} title={section.title} eyebrow={section.icon} accent={accent.color}>
          {renderSectionContent(section, accent.color)}
        </SectionShell>
      ))}
    </div>
  );
}

function ExecutiveView({ data }: { data: StructuredOutput }) {
  const accent = TYPE_ACCENT[data.questionType] ?? TYPE_ACCENT["情報整理"];
  const recommendation = data.sections.find((section) => classifySection(section) === "recommendation");
  const risk = data.sections.find((section) => isRiskSection(section));
  const actions = takeActionItems(data);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionShell title="経営向けサマリー" eyebrow="Executive Brief" accent={accent.color}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
          <HighlightBox title="結論" content={recommendation?.content ?? firstSentence(data.summary)} variant="important" />
          <div
            style={{
              borderRadius: 14,
              padding: "14px 16px",
              background: "#fff8f1",
              border: "1px solid rgba(249,115,22,0.24)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: "#f97316", marginBottom: 8 }}>判断の観点</div>
            <div style={{ display: "grid", gap: 8 }}>
              {(data.keyPoints ?? []).slice(0, 3).map((point, index) => (
                <div key={`${point}-${index}`} style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", fontWeight: 700 }}>
                  {index + 1}. {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <SectionShell title="推奨アクション" eyebrow="Next Actions" accent={accent.color}>
          <div style={{ display: "grid", gap: 10 }}>
            {actions.length > 0 ? actions.map((item, index) => (
              <div key={`${item}-${index}`} style={{ fontSize: 14, lineHeight: 1.8, color: "#334155", padding: "10px 12px", borderRadius: 12, background: "#f8fafc" }}>
                {index + 1}. {item}
              </div>
            )) : <div style={{ fontSize: 14, lineHeight: 1.8, color: "#64748b" }}>実行ステップは本編で確認できます。</div>}
          </div>
        </SectionShell>

        <SectionShell title="確認事項" eyebrow="Risks / Notes" accent={accent.color}>
          {risk ? renderSectionContent(risk, accent.color) : (
            <div style={{ fontSize: 14, lineHeight: 1.85, color: "#334155" }}>
              {data.summary}
            </div>
          )}
        </SectionShell>
      </div>
    </div>
  );
}

function ProposalView({ data }: { data: StructuredOutput }) {
  const accent = TYPE_ACCENT[data.questionType] ?? TYPE_ACCENT["情報整理"];
  const researchSections = data.sections.filter((section) => classifySection(section) === "research" && !isSourceSection(section)).slice(0, 2);
  const recommendationSections = data.sections.filter((section) => classifySection(section) === "recommendation").slice(0, 2);
  const proposalSections = data.sections.filter((section) => classifySection(section) === "proposal" && !isRiskSection(section)).slice(0, 2);
  const riskSections = data.sections.filter((section) => isRiskSection(section)).slice(0, 2);
  const sourceSections = data.sections.filter((section) => isSourceSection(section)).slice(0, 1);

  const blocks = [
    { eyebrow: "Background", title: "背景・調査整理", sections: researchSections.length ? researchSections : data.sections.slice(0, 1) },
    { eyebrow: "Recommendation", title: "おすすめ案", sections: recommendationSections.length ? recommendationSections : data.sections.slice(0, 1) },
    { eyebrow: "Execution Plan", title: "実行計画", sections: proposalSections.length ? proposalSections : data.sections.filter((section) => section.type === "steps").slice(0, 1) },
    { eyebrow: "Risk / Sources", title: "注意点・出典", sections: [...riskSections, ...sourceSections].slice(0, 2) },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionShell title="提案書ビュー" eyebrow="Proposal Draft" accent={accent.color}>
        <div style={{ fontSize: 15, lineHeight: 1.9, color: "#334155" }}>{data.summary}</div>
      </SectionShell>

      {blocks.map((block) => (
        <SectionShell key={block.title} title={block.title} eyebrow={block.eyebrow} accent={accent.color}>
          <div style={{ display: "grid", gap: 14 }}>
            {block.sections.length > 0 ? block.sections.map((section, index) => (
              <div key={`${block.title}-${section.title}-${index}`} style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{section.title}</div>
                {renderSectionContent(section, accent.color)}
              </div>
            )) : (
              <div style={{ fontSize: 14, lineHeight: 1.8, color: "#64748b" }}>このブロックは本編の内容から補完できます。</div>
            )}
          </div>
        </SectionShell>
      ))}
    </div>
  );
}

export default function DeliverableTabs({ data }: { data: StructuredOutput }) {
  const [view, setView] = useState<DeliverableView>("standard");
  const activeMeta = VIEW_META[view];
  const accent = useMemo(() => TYPE_ACCENT[data.questionType] ?? TYPE_ACCENT["情報整理"], [data.questionType]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f4f7fb" }}>
      <div
        style={{
          padding: "14px 14px 0",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            padding: "14px 16px",
            background: "#fff",
            border: "1px solid rgba(148,163,184,0.24)",
            boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", color: accent.color, textTransform: "uppercase" }}>
              Deliverables
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{data.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{activeMeta.subtitle}</div>
          </div>
          <div
            style={{
              borderRadius: 999,
              padding: "6px 12px",
              background: activeMeta.bg,
              color: activeMeta.color,
              fontSize: 12,
              fontWeight: 900,
              border: `1px solid ${activeMeta.color}33`,
            }}
          >
            {activeMeta.label}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(Object.keys(VIEW_META) as DeliverableView[]).map((key) => {
            const meta = VIEW_META[key];
            const active = view === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                style={{
                  borderRadius: 999,
                  border: active ? `3px solid ${meta.color}` : "3px solid rgba(148,163,184,0.18)",
                  background: active ? meta.bg : "#fff",
                  color: active ? meta.color : "#475569",
                  padding: "8px 13px",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "0 4px 0 rgba(49,64,95,0.06)",
                }}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: view === "slides" ? 0 : "10px 14px 14px" }}>
        {view === "slides" ? (
          <OutputRenderer data={data} />
        ) : (
          <div style={{ height: "100%", overflowY: "auto", paddingRight: 2 }}>
            {view === "standard" && <StandardView data={data} />}
            {view === "executive" && <ExecutiveView data={data} />}
            {view === "proposal" && <ProposalView data={data} />}
          </div>
        )}
      </div>
    </div>
  );
}
