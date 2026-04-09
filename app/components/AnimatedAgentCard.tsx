"use client";

import { motion, AnimatePresence } from "framer-motion";
import AgentCharacter from "./AgentCharacter";
import type { AgentCardData } from "../types/agent";

// ─── 役割別テーマ（ウォームライト） ──────────────────────────────

const ROLE_THEME = {
  ceo: {
    bg: "#faf8ff",
    border: "rgba(124,88,200,0.20)",
    activeBorder: "rgba(124,88,200,0.50)",
    accent: "#7c58c8",
    accentLight: "rgba(124,88,200,0.08)",
    label: "最高責任者",
    dot: "#7c58c8",
  },
  manager: {
    bg: "#f6fbff",
    border: "rgba(40,120,216,0.18)",
    activeBorder: "rgba(40,120,216,0.45)",
    accent: "#2878d8",
    accentLight: "rgba(40,120,216,0.07)",
    label: "プロジェクト管理",
    dot: "#2878d8",
  },
  worker: {
    bg: "#fff9f5",
    border: "rgba(200,104,32,0.18)",
    activeBorder: "rgba(200,104,32,0.45)",
    accent: "#c86820",
    accentLight: "rgba(200,104,32,0.08)",
    label: "実行担当",
    dot: "#c86820",
  },
  reviewer: {
    bg: "#f5fdf8",
    border: "rgba(32,136,88,0.18)",
    activeBorder: "rgba(32,136,88,0.45)",
    accent: "#208858",
    accentLight: "rgba(32,136,88,0.07)",
    label: "品質審査",
    dot: "#208858",
  },
  researcher: {
    bg: "#f5faff",
    border: "rgba(14,120,200,0.18)",
    activeBorder: "rgba(14,120,200,0.45)",
    accent: "#0e78c8",
    accentLight: "rgba(14,120,200,0.07)",
    label: "リサーチ担当",
    dot: "#0e78c8",
  },
  editor: {
    bg: "#fdfaf5",
    border: "rgba(180,130,20,0.18)",
    activeBorder: "rgba(180,130,20,0.45)",
    accent: "#b48214",
    accentLight: "rgba(180,130,20,0.07)",
    label: "編集担当",
    dot: "#b48214",
  },
  designer: {
    bg: "#fff5fa",
    border: "rgba(200,40,120,0.18)",
    activeBorder: "rgba(200,40,120,0.45)",
    accent: "#c82878",
    accentLight: "rgba(200,40,120,0.07)",
    label: "デザイン担当",
    dot: "#c82878",
  },
  system: {
    bg: "#f8f7f5",
    border: "rgba(168,152,128,0.18)",
    activeBorder: "rgba(168,152,128,0.35)",
    accent: "#a89880",
    accentLight: "rgba(168,152,128,0.07)",
    label: "システム",
    dot: "#a89880",
  },
} as const;

const STATUS_LABEL: Record<string, string> = {
  idle: "待機中", thinking: "思考中", reviewing: "審査中",
  done: "完了", waiting: "保留中",
};

const PROVIDER_LABEL: Record<string, string> = {
  claude: "Claude", openai: "OpenAI", gemini: "Gemini",
};

// ─── ステータスドット ──────────────────────────────────────────────

function StatusBadge({ status, accent }: { status: string; accent: string }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone   = status === "done";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: isDone ? "rgba(32,136,88,0.08)" : isActive ? `${accent}12` : "rgba(60,50,40,0.05)",
      border: `1px solid ${isActive ? accent + "50" : isDone ? "rgba(32,136,88,0.3)" : "rgba(60,50,40,0.10)"}`,
      borderRadius: 20, padding: "3px 9px",
    }}>
      {isActive ? (
        <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }}
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      ) : (
        <div style={{ width: 6, height: 6, borderRadius: "50%",
          background: isDone ? "#208858" : "rgba(60,50,40,0.2)" }} />
      )}
      <span style={{
        fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em",
        color: isActive ? accent : isDone ? "#208858" : "rgba(60,50,40,0.45)",
      }}>
        {STATUS_LABEL[status] ?? status}
      </span>
    </div>
  );
}

// ─── タイピングドット ──────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "3px 0" }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={i}
          style={{ width: 5, height: 5, borderRadius: "50%", background: color }}
          animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
    </div>
  );
}

// ─── メインカード ──────────────────────────────────────────────────

interface Props { card: AgentCardData; isPlaceholder?: boolean; }

export default function AnimatedAgentCard({ card, isPlaceholder }: Props) {
  const { config, status, lastMessage } = card;
  const role   = config.role;
  const theme  = ROLE_THEME[role] ?? ROLE_THEME.system;
  const isActive = status === "thinking" || status === "reviewing";
  const isDone   = status === "done";
  const characterRole = role === "worker" ? "worker" : role;

  if (isPlaceholder) {
    return (
      <motion.div
        style={{
          background: "#f9f7f2", border: "1.5px dashed rgba(60,50,40,0.12)",
          borderRadius: 16, minHeight: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <span style={{ color: "rgba(60,50,40,0.2)", fontSize: 22 }}>···</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, scale: 1.015 }}
      style={{
        background: theme.bg,
        border: `1.5px solid ${isActive ? theme.activeBorder : theme.border}`,
        borderRadius: 16,
        padding: "14px 13px 12px",
        display: "flex", flexDirection: "column", gap: 9,
        position: "relative", overflow: "hidden", cursor: "default",
        boxShadow: isActive
          ? `0 6px 24px ${theme.accent}18, 0 0 0 1px ${theme.accent}20`
          : isDone
          ? `0 4px 16px ${theme.accent}10`
          : `0 2px 8px rgba(28,24,20,0.06)`,
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* アクティブ時の上端アクセントライン */}
      {isActive && (
        <motion.div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
          borderRadius: "16px 16px 0 0",
        }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
            color: theme.accent, textTransform: "uppercase",
          }}>
            {config.name}
          </div>
          <div style={{ fontSize: 9, color: "rgba(60,50,40,0.4)", marginTop: 1, letterSpacing: "0.04em" }}>
            {theme.label}
          </div>
        </div>
        <StatusBadge status={status} accent={theme.accent} />
      </div>

      {/* キャラクターエリア */}
      <div style={{ position: "relative", height: 120 }}>
        <AgentCharacter role={characterRole as any} status={status} agentId={config.id} />
      </div>

      {/* スピーチバブル */}
      <div style={{
        background: theme.accentLight,
        border: `1px solid ${isActive ? theme.activeBorder : theme.border}`,
        borderRadius: 9, padding: "7px 10px",
        minHeight: 36, display: "flex", alignItems: "center",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: -5, left: 14,
          width: 0, height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderBottom: `4px solid ${isActive ? theme.activeBorder : theme.border}`,
        }} />

        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div key="typing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TypingDots color={theme.accent} />
            </motion.div>
          ) : lastMessage ? (
            <motion.p key={lastMessage.slice(0, 20)}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              style={{
                fontSize: 10, color: "rgba(28,24,20,0.65)", lineHeight: 1.6, margin: 0,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
              {lastMessage}
            </motion.p>
          ) : (
            <motion.span key="placeholder"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: 10, color: "rgba(60,50,40,0.25)", fontStyle: "italic" }}>
              指示待ち...
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* モデル情報フッター */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{
          fontSize: 8, fontWeight: 700, padding: "2px 6px",
          background: theme.accentLight, color: theme.accent,
          borderRadius: 4, border: `1px solid ${theme.accent}30`,
          letterSpacing: "0.05em",
        }}>
          {PROVIDER_LABEL[config.model.provider] ?? config.model.provider}
        </span>
        <span style={{ fontSize: 8, color: "rgba(60,50,40,0.3)" }}>
          {config.model.displayName}
        </span>
      </div>
    </motion.div>
  );
}
