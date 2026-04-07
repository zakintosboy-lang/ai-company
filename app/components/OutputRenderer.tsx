import type { StructuredOutput, OutputSection, HighlightVariant, DesignSpec } from "@/agents/types";

// ── Phase 6 デザイン指示パネル ────────────────────────────────
function DesignSpecPanel({ spec, accentColor }: { spec: DesignSpec; accentColor: string }) {
  return (
    <div className="or-section-card" style={{ marginTop: 8 }}>
      <div className="or-section-header">
        <span className="or-section-icon">🎨</span>
        <h2 className="or-section-title" style={{ color: accentColor }}>Phase 6 — Canva デザイン指示</h2>
      </div>
      <div className="or-section-body">
        <p style={{ fontSize: 13, color: "rgba(28,24,20,0.6)", marginBottom: 12 }}>{spec.concept}</p>

        {/* カラーパレット */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>カラーパレット</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(spec.colors).map(([key, hex]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: hex, border: "1px solid rgba(0,0,0,0.1)" }} />
                <span style={{ fontSize: 11, color: "rgba(28,24,20,0.55)" }}>{key}: {hex}</span>
              </div>
            ))}
          </div>
        </div>

        {/* フォント */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>フォント</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {Object.entries(spec.fonts).map(([key, font]) => (
              <span key={key} style={{ fontSize: 12, color: "rgba(28,24,20,0.65)" }}>
                <span style={{ fontWeight: 600 }}>{key}:</span> {font}
              </span>
            ))}
          </div>
        </div>

        {/* レイアウト */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>ページ構成</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {spec.layout.map((page) => (
              <div key={page.page} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 10px", background: accentColor + "08", borderRadius: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, minWidth: 24 }}>P{page.page}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(28,24,20,0.75)" }}>{page.name}</span>
                  <div style={{ fontSize: 11, color: "rgba(28,24,20,0.45)", marginTop: 2 }}>{page.elements.join(" · ")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canva 手順 */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Canva 作成手順</div>
          <div style={{ fontSize: 12, color: "rgba(28,24,20,0.65)", lineHeight: 1.8, whiteSpace: "pre-line" }}>{spec.canvaInstructions}</div>
        </div>
      </div>
    </div>
  );
}

// ── 質問タイプ設定 ─────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "企画":    { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "企画" },
  "情報整理": { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", label: "情報整理" },
  "比較":    { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", label: "比較" },
  "提案":    { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", label: "提案" },
  "ガイド":  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "ガイド" },
};

// ── ハイライト設定 ────────────────────────────────────────────
const HL: Record<HighlightVariant, {
  bg: string; border: string; leftBar: string;
  labelColor: string; textColor: string; icon: string;
}> = {
  info:      { bg:"#eff6ff", border:"#bfdbfe", leftBar:"#2563eb", labelColor:"#1d4ed8", textColor:"#1e40af", icon:"💡" },
  warning:   { bg:"#fff7ed", border:"#fed7aa", leftBar:"#ea580c", labelColor:"#9a3412", textColor:"#7c2d12", icon:"⚠" },
  success:   { bg:"#f0fdf4", border:"#bbf7d0", leftBar:"#16a34a", labelColor:"#15803d", textColor:"#14532d", icon:"✅" },
  important: { bg:"#faf5ff", border:"#ddd6fe", leftBar:"#7c3aed", labelColor:"#6d28d9", textColor:"#4c1d95", icon:"📌" },
};

// ── OutputRenderer ────────────────────────────────────────────
export default function OutputRenderer({ data }: { data: StructuredOutput }) {
  const cfg = TYPE_CONFIG[data.questionType] ?? TYPE_CONFIG["情報整理"];

  return (
    <article className="or-root">

      {/* ── 1. ドキュメントヘッダー ── */}
      <header className="or-header" style={{ borderTopColor: cfg.color }}>
        <div className="or-header-meta">
          <span className="or-type-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
            {cfg.label}
          </span>
        </div>
        <h1 className="or-title">{data.title}</h1>
        <p className="or-summary-text">{data.summary}</p>
      </header>

      {/* ── 2. 重要ポイント 3 つ ── */}
      <div className="or-keypoints" style={{ borderColor: cfg.border }}>
        <div className="or-keypoints-label" style={{ color: cfg.color }}>
          <span>📌</span> 重要ポイント
        </div>
        <div className="or-keypoints-grid">
          {(data.keyPoints ?? []).map((pt, i) => (
            <div key={i} className="or-kp-card" style={{ borderTopColor: cfg.color }}>
              <span className="or-kp-num" style={{ background: cfg.color }}>{i + 1}</span>
              <span className="or-kp-text">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. セクション一覧 ── */}
      <div className="or-sections">
        {data.sections.map((section, i) => (
          <SectionCard key={i} section={section} accentColor={cfg.color} />
        ))}
      </div>

      {/* ── 4. Phase 6 デザイン指示 ── */}
      {data.designSpec && <DesignSpecPanel spec={data.designSpec} accentColor={cfg.color} />}

    </article>
  );
}

// ── セクションカード ──────────────────────────────────────────
function SectionCard({ section, accentColor }: { section: OutputSection; accentColor: string }) {
  if (section.type === "highlight") {
    const hcfg = HL[section.highlight ?? "info"];
    return (
      <div className="or-hl-card" style={{ background: hcfg.bg, borderColor: hcfg.border, borderLeftColor: hcfg.leftBar }}>
        <div className="or-hl-header" style={{ color: hcfg.labelColor }}>
          <span className="or-hl-icon">{section.icon ?? hcfg.icon}</span>
          <span className="or-hl-title">{section.title}</span>
        </div>
        <p className="or-hl-body" style={{ color: hcfg.textColor }}>{section.content}</p>
      </div>
    );
  }

  return (
    <div className="or-section-card">
      <div className="or-section-header">
        <span className="or-section-icon">{section.icon ?? "📋"}</span>
        <h2 className="or-section-title" style={{ color: accentColor }}>{section.title}</h2>
      </div>
      <div className="or-section-body">
        <SectionBody section={section} accentColor={accentColor} />
      </div>
    </div>
  );
}

// ── セクション本体レンダラー ──────────────────────────────────
function SectionBody({ section, accentColor }: { section: OutputSection; accentColor: string }) {
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
              <span className="or-step-num" style={{ background: accentColor }}>{i + 1}</span>
              <div className="or-step-content">
                <span className="or-step-text">{item}</span>
              </div>
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
                  <th key={i} style={{ background: accentColor + "15", color: accentColor }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 1 ? "or-row-alt" : ""}>
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

    default:
      return null;
  }
}
