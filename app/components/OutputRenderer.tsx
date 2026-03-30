import type { StructuredOutput, OutputSection, HighlightVariant } from "@/agents/types";

// ── 質問タイプごとのアクセントカラー ─────────────────────────
const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  "企画":   { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  "情報整理":{ color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  "比較":   { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  "提案":   { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  "ガイド": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};

// ── ハイライトボックスの設定 ──────────────────────────────────
const HIGHLIGHT_CONFIG: Record<HighlightVariant, {
  bg: string; border: string; icon: string; labelColor: string; textColor: string;
}> = {
  info:      { bg: "#eff6ff", border: "#bfdbfe", icon: "ℹ", labelColor: "#1d4ed8", textColor: "#1e40af" },
  warning:   { bg: "#fffbeb", border: "#fde68a", icon: "⚠", labelColor: "#92400e", textColor: "#78350f" },
  success:   { bg: "#f0fdf4", border: "#bbf7d0", icon: "✓", labelColor: "#065f46", textColor: "#064e3b" },
  important: { bg: "#faf5ff", border: "#ddd6fe", icon: "★", labelColor: "#5b21b6", textColor: "#4c1d95" },
};

// ── OutputRenderer ────────────────────────────────────────────
export default function OutputRenderer({ data }: { data: StructuredOutput }) {
  const cfg = TYPE_CONFIG[data.questionType] ?? TYPE_CONFIG["情報整理"];

  return (
    <article className="or-root">
      {/* ── ヘッダー ── */}
      <header className="or-header" style={{ borderTopColor: cfg.color }}>
        <span
          className="or-type-badge"
          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        >
          {data.questionType}
        </span>
        <h1 className="or-title">{data.title}</h1>
        <div className="or-summary" style={{ borderLeftColor: cfg.color }}>
          {data.summary}
        </div>
      </header>

      {/* ── セクション一覧 ── */}
      <div className="or-body">
        {data.sections.map((section, i) => (
          <section key={i} className="or-section">
            {section.type !== "highlight" && (
              <h2 className="or-section-title" style={{ color: cfg.color }}>
                <span className="or-section-bar" style={{ background: cfg.color }} />
                {section.title}
              </h2>
            )}
            <SectionContent section={section} accentColor={cfg.color} />
          </section>
        ))}
      </div>
    </article>
  );
}

// ── セクション内容レンダラー ──────────────────────────────────
function SectionContent({
  section,
  accentColor,
}: {
  section: OutputSection;
  accentColor: string;
}) {
  switch (section.type) {
    case "text":
      return (
        <div className="or-text">
          {(section.content ?? "").split("\n").map((line, i) =>
            line.trim() ? <p key={i}>{line}</p> : <span key={i} className="or-spacer" />
          )}
        </div>
      );

    case "list":
      return (
        <ul className="or-list">
          {(section.items ?? []).map((item, i) => (
            <li key={i} className="or-list-item">
              <span className="or-bullet" style={{ color: accentColor }}>▸</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="or-steps">
          {(section.items ?? []).map((item, i) => (
            <li key={i} className="or-step">
              <span className="or-step-num" style={{ background: accentColor }}>
                {i + 1}
              </span>
              <span className="or-step-text">{item}</span>
            </li>
          ))}
        </ol>
      );

    case "table": {
      const { headers = [], rows = [] } = section.tableData ?? {};
      return (
        <div className="or-table-wrap">
          <table className="or-table">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={{ background: accentColor + "18", color: accentColor }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 1 ? "or-table-odd" : ""}>
                  {row.map((cell, j) => (
                    <td key={j} className={j === 0 ? "or-td-first" : ""}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "highlight": {
      const hcfg = HIGHLIGHT_CONFIG[section.highlight ?? "info"];
      return (
        <div
          className="or-highlight"
          style={{ background: hcfg.bg, borderColor: hcfg.border }}
        >
          <div className="or-highlight-header" style={{ color: hcfg.labelColor }}>
            <span className="or-highlight-icon">{hcfg.icon}</span>
            <span className="or-highlight-label">{section.title}</span>
          </div>
          <p className="or-highlight-body" style={{ color: hcfg.textColor }}>
            {section.content}
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}
