"use client";

import type { LivePreview } from "@/agents/types";

const ROLE_META = {
  researcher: { label: "Research", color: "#0891b2", bg: "#ecfeff" },
  worker: { label: "Worker", color: "#f97316", bg: "#fff7ed" },
  manager: { label: "Manager", color: "#2563eb", bg: "#eff6ff" },
  system: { label: "System", color: "#64748b", bg: "#f8fafc" },
  ceo: { label: "CEO", color: "#8b5cf6", bg: "#f5f3ff" },
  reviewer: { label: "Reviewer", color: "#16a34a", bg: "#f0fdf4" },
  editor: { label: "Editor", color: "#84cc16", bg: "#f7fee7" },
  designer: { label: "Designer", color: "#ec4899", bg: "#fdf2f8" },
} as const;

const STATUS_META = {
  pending: { label: "準備中", color: "#64748b", bg: "#f8fafc" },
  draft: { label: "ドラフト", color: "#7c3aed", bg: "#f5f3ff" },
  approved: { label: "反映済み", color: "#16a34a", bg: "#f0fdf4" },
  merged: { label: "統合済み", color: "#2563eb", bg: "#eff6ff" },
} as const;

export default function LiveDraftPreview({ preview }: { preview: LivePreview }) {
  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      <section
        style={{
          borderRadius: 22,
          border: "3px solid rgba(127,87,241,0.18)",
          background: "linear-gradient(135deg, #fffaf3 0%, #eef5ff 100%)",
          padding: "18px 20px",
          boxShadow: "0 8px 0 rgba(49,64,95,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7f57f1" }}>
              Live Deliverable Preview
            </div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1.25 }}>
              {preview.title}
            </div>
          </div>
          <div
            style={{
              borderRadius: 999,
              padding: "7px 12px",
              border: "2px solid rgba(49,64,95,0.12)",
              background: "#fffdfa",
              color: "#2563eb",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {preview.progressLabel}
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.8, color: "#475569", fontWeight: 700 }}>
          {preview.summary}
        </div>
      </section>

      <section
        style={{
          borderRadius: 18,
          border: "2px solid rgba(49,64,95,0.1)",
          background: "rgba(255,255,255,0.82)",
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" }}>
            生成中のプレビュー
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>
            完成前の下書きが順番に育ちます
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {preview.blocks.map((block) => {
            const roleMeta = ROLE_META[block.role] ?? ROLE_META.system;
            const statusMeta = STATUS_META[block.status];

            return (
              <article
                key={block.id}
                style={{
                  borderRadius: 18,
                  border: `2px solid ${roleMeta.color}22`,
                  background: "#fffefb",
                  padding: "14px 16px",
                  boxShadow: "0 6px 0 rgba(49,64,95,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "5px 8px",
                        background: roleMeta.bg,
                        color: roleMeta.color,
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        flexShrink: 0,
                      }}
                    >
                      {roleMeta.label}
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", lineHeight: 1.3 }}>
                      {block.title}
                    </div>
                  </div>

                  <span
                    style={{
                      borderRadius: 999,
                      padding: "5px 9px",
                      background: statusMeta.bg,
                      color: statusMeta.color,
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: block.status === "pending" ? "#94a3b8" : "#334155",
                    whiteSpace: "pre-line",
                    fontWeight: block.status === "pending" ? 700 : 600,
                  }}
                >
                  {block.content}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
