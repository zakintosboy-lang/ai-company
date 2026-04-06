"use client";

import { motion, AnimatePresence } from "framer-motion";
import AgentCharacter from "./AgentCharacter";
import type { AgentCardData } from "../types/agent";

// ─── 役割別テーマ ────────────────────────────────────────────────

const ROLE_THEME = {
  ceo: {
    gradient: "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #5b21b6 100%)",
    border: "#7c3aed",
    glow: "rgba(167,139,250,0.35)",
    accent: "#a78bfa",
    label: "最高責任者",
    story: "戦略を描き、チームを統率する指揮官",
  },
  manager: {
    gradient: "linear-gradient(135deg, #0c2a4a 0%, #0c4a6e 50%, #075985 100%)",
    border: "#0ea5e9",
    glow: "rgba(56,189,248,0.3)",
    accent: "#38bdf8",
    label: "プロジェクト管理",
    story: "データを読み、最適解を導くロジシャン",
  },
  worker: {
    gradient: "linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)",
    border: "#f97316",
    glow: "rgba(251,146,60,0.3)",
    accent: "#fb923c",
    label: "実行担当",
    story: "現場主義、手を動かして課題を解く職人",
  },
  reviewer: {
    gradient: "linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)",
    border: "#22c55e",
    glow: "rgba(34,197,94,0.3)",
    accent: "#4ade80",
    label: "品質審査",
    story: "細部まで確認し、品質を守る番人",
  },
  system: {
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    border: "#475569",
    glow: "rgba(71,85,105,0.2)",
    accent: "#94a3b8",
    label: "システム",
    story: "",
  },
} as const;

const STATUS_LABEL: Record<string, string> = {
  idle: "待機中", thinking: "思考中", reviewing: "審査中",
  done: "完了", waiting: "保留中",
};

const PROVIDER_LABEL: Record<string, string> = {
  claude: "Claude", openai: "OpenAI", gemini: "Gemini",
};

const WORKER_VARIANT_MAP: Record<string, number> = {
  "worker-1": 0, "worker-2": 1, "worker-3": 2,
};

// ─── ステータスバッジ ─────────────────────────────────────────────

function StatusBadge({ status, accent }: { status: string; accent: string }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone   = status === "done";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "5px",
      background: "rgba(0,0,0,0.35)",
      border: `1px solid ${isActive ? accent : isDone ? "#4ade80" : "rgba(255,255,255,0.1)"}`,
      borderRadius: "20px", padding: "3px 10px",
      backdropFilter: "blur(8px)",
    }}>
      {isActive && (
        <motion.div
          style={{ width: 7, height: 7, borderRadius: "50%", background: accent }}
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
      {isDone && <span style={{ fontSize: 10 }}>✓</span>}
      {!isActive && !isDone && (
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
      )}
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
        color: isActive ? accent : isDone ? "#4ade80" : "rgba(255,255,255,0.45)",
        fontFamily: "monospace",
      }}>
        {STATUS_LABEL[status] ?? status}
      </span>
    </div>
  );
}

// ─── タイピングドット ─────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ width: 5, height: 5, borderRadius: "50%", background: color }}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── メインカード ─────────────────────────────────────────────────

interface Props {
  card: AgentCardData;
  isPlaceholder?: boolean;
}

export default function AnimatedAgentCard({ card, isPlaceholder }: Props) {
  const { config, status, lastMessage } = card;
  const role = config.role;
  const theme = ROLE_THEME[role] ?? ROLE_THEME.system;
  const isActive = status === "thinking" || status === "reviewing";
  const isDone   = status === "done";
  const workerVariant = WORKER_VARIANT_MAP[config.id] ?? 0;

  // worker のキャラは id で variant を変える
  const characterRole = role === "worker" ? `worker` : role;

  if (isPlaceholder) {
    return (
      <motion.div
        style={{
          background: "rgba(30,41,59,0.4)",
          border: "1.5px dashed rgba(71,85,105,0.4)",
          borderRadius: 20,
          minHeight: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span style={{ color: "#475569", fontSize: 24 }}>···</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, scale: 1.02 }}
      style={{
        background: theme.gradient,
        border: `1.5px solid ${isActive ? theme.border : "rgba(255,255,255,0.08)"}`,
        borderRadius: 20,
        padding: "16px 14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        boxShadow: isActive
          ? `0 8px 32px ${theme.glow}, 0 0 0 1px ${theme.border}44, inset 0 1px 0 rgba(255,255,255,0.08)`
          : isDone
          ? `0 4px 20px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
          : `0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* アクティブ時のグロー背景 */}
      {isActive && (
        <motion.div
          style={{
            position: "absolute", inset: 0, borderRadius: 20,
            background: `radial-gradient(ellipse at 50% 0%, ${theme.glow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* シマーライン（アクティブ時） */}
      {isActive && (
        <motion.div
          style={{
            position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
            background: `linear-gradient(90deg, transparent, ${theme.accent}18, transparent)`,
            pointerEvents: "none",
          }}
          animate={{ left: ["−100%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* ヘッダー行 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
            color: theme.accent, textTransform: "uppercase", fontFamily: "monospace",
          }}>
            {config.name}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1, fontFamily: "monospace" }}>
            {theme.label}
          </div>
        </div>
        <StatusBadge status={status} accent={theme.accent} />
      </div>

      {/* キャラクターエリア */}
      <div style={{ position: "relative", height: 96 }}>
        <AgentCharacter
          role={characterRole as any}
          status={status}
        />
      </div>

      {/* スピーチバブル */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${isActive ? theme.border + "60" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 10,
        padding: "8px 10px",
        minHeight: 38,
        display: "flex",
        alignItems: "center",
        backdropFilter: "blur(4px)",
        position: "relative",
      }}>
        {/* 吹き出しの三角 */}
        <div style={{
          position: "absolute", top: -5, left: 16,
          width: 0, height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderBottom: `5px solid ${isActive ? theme.border + "60" : "rgba(255,255,255,0.06)"}`,
        }} />

        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <TypingDots color={theme.accent} />
            </motion.div>
          ) : lastMessage ? (
            <motion.p
              key={lastMessage.slice(0, 20)}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              style={{
                fontSize: 10, color: "rgba(255,255,255,0.7)", lineHeight: 1.6,
                margin: 0, fontFamily: "var(--font-sans, sans-serif)",
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {lastMessage}
            </motion.p>
          ) : (
            <motion.span
              key="placeholder"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}
            >
              指示待ち...
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* モデル情報フッター */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontSize: 8, fontWeight: 700, padding: "2px 6px",
          background: `${theme.accent}22`, color: theme.accent,
          borderRadius: 4, border: `1px solid ${theme.accent}44`,
          fontFamily: "monospace", letterSpacing: "0.05em",
        }}>
          {PROVIDER_LABEL[config.model.provider] ?? config.model.provider}
        </span>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
          {config.model.displayName}
        </span>
      </div>
    </motion.div>
  );
}
