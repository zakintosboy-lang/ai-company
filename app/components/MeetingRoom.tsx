"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AgentRole   = "ceo" | "manager" | "worker" | "reviewer" | "researcher" | "designer" | "editor" | "system";
type AgentStatus = "idle" | "thinking" | "reviewing" | "done" | "waiting";

interface LogEntry  { time: string; role: AgentRole; message: string; }
interface AgentInfo { id: string; role: AgentRole; name: string; status: AgentStatus; lastMessage?: string; model?: string; }

interface Props {
  logs: LogEntry[];
  agents: AgentInfo[];
  isRunning: boolean;
  output: boolean;
}

// ─── 役職設定 ────────────────────────────────────────────────────

const ROLE_CONFIG: Record<AgentRole, {
  jaLabel: string; color: string; glow: string;
  bubbleBg: string; bubbleBorder: string;
}> = {
  ceo: {
    jaLabel: "CEO",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.4)",
    bubbleBg: "rgba(46,16,101,0.85)",
    bubbleBorder: "rgba(167,139,250,0.5)",
  },
  manager: {
    jaLabel: "進行役",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.35)",
    bubbleBg: "rgba(12,40,90,0.85)",
    bubbleBorder: "rgba(96,165,250,0.5)",
  },
  worker: {
    jaLabel: "実行担当",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.35)",
    bubbleBg: "rgba(67,20,7,0.85)",
    bubbleBorder: "rgba(251,146,60,0.5)",
  },
  reviewer: {
    jaLabel: "チェック担当",
    color: "#34d399",
    glow: "rgba(52,211,153,0.35)",
    bubbleBg: "rgba(6,46,32,0.85)",
    bubbleBorder: "rgba(52,211,153,0.5)",
  },
  editor: {
    jaLabel: "編集者",
    color: "#a3e635",
    glow: "rgba(163,230,53,0.35)",
    bubbleBg: "rgba(30,50,10,0.85)",
    bubbleBorder: "rgba(163,230,53,0.5)",
  },
  researcher: {
    jaLabel: "リサーチ担当",
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.35)",
    bubbleBg: "rgba(8,60,80,0.85)",
    bubbleBorder: "rgba(34,211,238,0.5)",
  },
  designer: {
    jaLabel: "デザイン担当",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.35)",
    bubbleBg: "rgba(80,10,50,0.85)",
    bubbleBorder: "rgba(244,114,182,0.5)",
  },
  system: {
    jaLabel: "システム",
    color: "#94a3b8",
    glow: "rgba(148,163,184,0.2)",
    bubbleBg: "rgba(15,23,42,0.85)",
    bubbleBorder: "rgba(148,163,184,0.3)",
  },
};

function getAvatarTheme(agent: AgentInfo) {
  if (agent.role === "researcher") {
    if (agent.id === "researcher-2") {
      return { hair: "#60a5fa", hairDark: "#2563eb", outfit: "#dbeafe", accent: "#1d4ed8", accessory: "bars" as const };
    }
    if (agent.id === "researcher-3") {
      return { hair: "#94a3b8", hairDark: "#475569", outfit: "#e2e8f0", accent: "#334155", accessory: "note" as const };
    }
    return { hair: "#67e8f9", hairDark: "#0891b2", outfit: "#cffafe", accent: "#0e7490", accessory: "news" as const };
  }

  switch (agent.role) {
    case "ceo":
      return { hair: "#c4b5fd", hairDark: "#7c3aed", outfit: "#ede9fe", accent: "#7c3aed", accessory: "crown" as const };
    case "manager":
      return { hair: "#93c5fd", hairDark: "#2878d8", outfit: "#dbeafe", accent: "#2878d8", accessory: "headset" as const };
    case "worker":
      return { hair: "#fdba74", hairDark: "#c86820", outfit: "#ffedd5", accent: "#c86820", accessory: "cap" as const };
    case "reviewer":
      return { hair: "#86efac", hairDark: "#208858", outfit: "#dcfce7", accent: "#208858", accessory: "check" as const };
    case "editor":
      return { hair: "#bef264", hairDark: "#65a30d", outfit: "#ecfccb", accent: "#65a30d", accessory: "pen" as const };
    case "designer":
      return { hair: "#f9a8d4", hairDark: "#db2777", outfit: "#fce7f3", accent: "#db2777", accessory: "spark" as const };
    default:
      return { hair: "#cbd5e1", hairDark: "#64748b", outfit: "#e2e8f0", accent: "#64748b", accessory: "none" as const };
  }
}

function StreamerAvatar({ agent }: { agent: AgentInfo }) {
  const theme = getAvatarTheme(agent);
  const isActive = agent.status === "thinking" || agent.status === "reviewing";
  const isDone   = agent.status === "done";

  return (
    <motion.div
      style={{
        width: 90, height: 116,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      animate={isActive ? { y: [0, -6, 0] } : { y: [0, -2, 0] }}
      transition={{ duration: isActive ? 0.75 : 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* 床の影 */}
      <div style={{
        position: "absolute", bottom: 4,
        width: 54, height: 10, borderRadius: 999,
        background: `${theme.accent}55`, filter: "blur(8px)",
      }} />

      <svg viewBox="0 0 100 130" width="90" height="116" fill="none">

        {/* ── ドレス / ボディ ── */}
        <path d="M26 74 Q17 98 15 130 L85 130 Q83 98 74 74 Z"
          fill={theme.outfit} stroke="#1a1a2e" strokeWidth="2" />
        {/* ドレスのライン */}
        <path d="M35 84 L50 81 L65 84"
          stroke={theme.accent} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M30 96 L50 92 L70 96"
          stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

        {/* ── 首 ── */}
        <ellipse cx="50" cy="73" rx="10" ry="6" fill="#f9c8a8" />

        {/* ── 頭 ── PPGのでっかい丸頭 */}
        <circle cx="50" cy="42" r="32" fill="#f9c8a8" stroke="#1a1a2e" strokeWidth="2.5" />

        {/* ── 髪型（役職別） ── */}

        {/* CEO: ロングヘア + 王冠 (ブロッサム風) */}
        {agent.role === "ceo" && <>
          {/* ロングヘア */}
          <path d="M18 42 Q16 16 50 10 Q84 16 82 42 L82 58 Q74 52 70 60 L70 92 Q60 86 54 98 L50 100 L46 98 Q40 86 30 92 L30 60 Q26 52 18 58 Z"
            fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* 王冠 */}
          <path d="M30 16 L35 24 L42 14 L48 23 L50 13 L52 23 L58 14 L65 24 L70 16 L68 27 L32 27 Z"
            fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          {/* 王冠ハイライト */}
          <circle cx="50" cy="16" r="3" fill="#fef08a" />
          <circle cx="36" cy="20" r="2" fill="#fef08a" />
          <circle cx="64" cy="20" r="2" fill="#fef08a" />
        </>}

        {/* Manager: ミディアム + ヘッドセット */}
        {agent.role === "manager" && <>
          <path d="M18 42 Q17 16 50 10 Q83 16 82 42 L82 54 Q74 50 70 54 L70 74 L50 78 L30 74 L30 54 Q26 50 18 54 Z"
            fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* ヘッドセット */}
          <path d="M16 36 Q16 12 50 12 Q84 12 84 36"
            stroke={theme.accent} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <rect x="10" y="33" width="10" height="16" rx="5" fill={theme.accent} stroke="#1a1a2e" strokeWidth="1.5" />
          <rect x="80" y="33" width="10" height="16" rx="5" fill={theme.accent} stroke="#1a1a2e" strokeWidth="1.5" />
          {/* マイク */}
          <path d="M10 42 Q4 46 6 50" stroke={theme.accent} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="6" cy="51" r="3" fill={theme.accent} stroke="#1a1a2e" strokeWidth="1" />
        </>}

        {/* Worker: ショート + 安全ヘルメット */}
        {agent.role === "worker" && <>
          <path d="M22 42 Q22 22 50 14 Q78 22 78 42 L78 52 L50 58 L22 52 Z"
            fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* ヘルメット */}
          <path d="M14 38 Q16 4 50 4 Q84 4 86 38 Z"
            fill="#fbbf24" stroke="#1a1a2e" strokeWidth="2" />
          <rect x="12" y="34" width="76" height="8" rx="4"
            fill="#f59e0b" stroke="#1a1a2e" strokeWidth="1.5" />
          {/* ヘルメットの光 */}
          <path d="M30 14 Q40 10 55 12" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </>}

        {/* Reviewer: グリーンボブカット */}
        {agent.role === "reviewer" && <>
          <path d="M18 42 Q18 16 50 10 Q82 16 82 42 L82 60 Q66 66 50 66 Q34 66 18 60 Z"
            fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* ボブの端 */}
          <path d="M18 60 Q14 70 20 76" stroke={theme.hair} strokeWidth="7" strokeLinecap="round" />
          <path d="M82 60 Q86 70 80 76" stroke={theme.hair} strokeWidth="7" strokeLinecap="round" />
          {/* 内側のライン */}
          <path d="M18 60 Q14 70 20 76" stroke={theme.hairDark} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          <path d="M82 60 Q86 70 80 76" stroke={theme.hairDark} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </>}

        {/* Researcher: ツインテール (バブルス風) */}
        {agent.role === "researcher" && <>
          {/* メイン髪 */}
          <path d="M22 42 Q22 16 50 10 Q78 16 78 42 L78 52 L50 58 L22 52 Z"
            fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* 左ツインテール */}
          <ellipse cx="9" cy="57" rx="11" ry="16" fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* 右ツインテール */}
          <ellipse cx="91" cy="57" rx="11" ry="16" fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* ヘアタイ */}
          <circle cx="20" cy="48" r="5" fill={theme.accent} stroke="#1a1a2e" strokeWidth="1.5" />
          <circle cx="80" cy="48" r="5" fill={theme.accent} stroke="#1a1a2e" strokeWidth="1.5" />
          {/* ヘアタイの模様 */}
          <circle cx="20" cy="48" r="2" fill="white" opacity="0.7" />
          <circle cx="80" cy="48" r="2" fill="white" opacity="0.7" />
        </>}

        {/* Designer: ロング + アホ毛 */}
        {agent.role === "designer" && <>
          <path d="M18 42 Q16 16 50 10 Q84 16 82 42 L82 62 Q70 58 64 72 L50 78 L36 72 Q30 58 18 62 Z"
            fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* アホ毛 */}
          <path d="M50 10 Q56 0 62 4 Q66 -1 58 7" stroke={theme.hair} strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="62" cy="3" r="5" fill={theme.hair} stroke="#1a1a2e" strokeWidth="1.5" />
          {/* ハートのリボン */}
          <path d="M38 14 Q42 10 46 14 Q50 10 54 14 Q54 20 46 24 Q38 20 38 14 Z"
            fill={theme.accent} stroke="#1a1a2e" strokeWidth="1" />
        </>}

        {/* Editor: ショートスパイキー */}
        {agent.role === "editor" && <>
          <path d="M22 42 Q22 20 50 12 Q78 20 78 42 L78 54 L50 60 L22 54 Z"
            fill={theme.hair} stroke="#1a1a2e" strokeWidth="2" />
          {/* 跳ねた毛 */}
          <path d="M26 22 Q20 10 28 14" stroke={theme.hair} strokeWidth="6" strokeLinecap="round" />
          <path d="M38 12 Q34 2 42 6" stroke={theme.hair} strokeWidth="6" strokeLinecap="round" />
          <path d="M50 10 Q47 1 53 5" stroke={theme.hair} strokeWidth="6" strokeLinecap="round" />
          <path d="M62 12 Q66 2 58 6" stroke={theme.hair} strokeWidth="6" strokeLinecap="round" />
          <path d="M74 22 Q80 10 72 14" stroke={theme.hair} strokeWidth="6" strokeLinecap="round" />
        </>}

        {/* ── 顔パーツ ── */}

        {/* 左目 ── 巨大PPGオーバル */}
        <ellipse cx="36" cy="43" rx="11" ry="13.5" fill="#1a1a2e" />
        {/* 左目ハイライト */}
        <ellipse cx="31" cy="38" rx="4.5" ry="3.5" fill="white" />
        <circle  cx="36" cy="50" r="1.5" fill="white" opacity="0.5" />

        {/* 右目 ── 巨大PPGオーバル */}
        <ellipse cx="64" cy="43" rx="11" ry="13.5" fill="#1a1a2e" />
        {/* 右目ハイライト */}
        <ellipse cx="59" cy="38" rx="4.5" ry="3.5" fill="white" />
        <circle  cx="64" cy="50" r="1.5" fill="white" opacity="0.5" />

        {/* ほっぺ */}
        <ellipse cx="19" cy="56" rx="9" ry="5.5" fill="#f9a8d4" opacity="0.5" />
        <ellipse cx="81" cy="56" rx="9" ry="5.5" fill="#f9a8d4" opacity="0.5" />

        {/* 口 */}
        <path d="M41 62 Q50 70 59 62"
          stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* アクティブインジケーター */}
        {isActive && (
          <motion.circle cx="90" cy="22" r="5" fill="#fef08a"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        )}
        {isDone && (
          <motion.circle cx="90" cy="18" r="9" fill={theme.accent}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
          />
        )}
      </svg>
    </motion.div>
  );
}

// ─── キャラクター吹き出し ────────────────────────────────────────

function SpeechBubble({ message, color, border, bg, direction = "down" }: {
  message: string; color: string; border: string; bg: string; direction?: "down" | "right" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: direction === "down" ? 4 : 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.25, ease: "backOut" }}
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 8,
        padding: "6px 10px",
        maxWidth: 160,
        fontSize: 10,
        lineHeight: 1.55,
        color,
        backdropFilter: "blur(8px)",
        boxShadow: `0 4px 16px ${border}`,
        position: "relative",
        fontFamily: "'Noto Sans JP', sans-serif",
        letterSpacing: "0.02em",
        wordBreak: "break-all",
      }}
    >
      <span style={{
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {message}
      </span>
      {/* 吹き出し三角 */}
      <div style={{
        position: "absolute",
        ...(direction === "down"
          ? { bottom: -6, left: "50%", transform: "translateX(-50%)",
              borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
              borderTop: `6px solid ${border}` }
          : direction === "right"
          ? { left: -6, top: "50%", transform: "translateY(-50%)",
              borderTop: "6px solid transparent", borderBottom: "6px solid transparent",
              borderRight: `6px solid ${border}` }
          : { right: -6, top: "50%", transform: "translateY(-50%)",
              borderTop: "6px solid transparent", borderBottom: "6px solid transparent",
              borderLeft: `6px solid ${border}` }),
        width: 0, height: 0,
      }} />
    </motion.div>
  );
}

// ─── タイピングインジケーター ────────────────────────────────────

function TypingBubble({ color, border, bg }: { color: string; border: string; bg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      style={{
        background: bg, border: `1.5px solid ${border}`,
        borderRadius: 8, padding: "6px 10px",
        display: "flex", gap: 4, alignItems: "center",
        backdropFilter: "blur(8px)",
        boxShadow: `0 4px 16px ${border}`,
      }}
    >
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          style={{ width: 5, height: 5, borderRadius: "50%", background: color }}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

// ─── 単一キャラクターユニット ────────────────────────────────────

function CharacterUnit({ agent, showBubble, latestMessage }: {
  agent: AgentInfo; showBubble: boolean; latestMessage?: string;
}) {
  const cfg = ROLE_CONFIG[agent.role] ?? ROLE_CONFIG.system;
  const isActive = agent.status === "thinking" || agent.status === "reviewing";
  const isDone   = agent.status === "done";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
      {/* 吹き出し（上） */}
      <div style={{ height: 52, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          {isActive ? (
            <TypingBubble key="typing" color={cfg.color} border={cfg.bubbleBorder} bg={cfg.bubbleBg} />
          ) : showBubble && latestMessage ? (
            <SpeechBubble key={latestMessage.slice(0, 12)} message={latestMessage}
              color={cfg.color} border={cfg.bubbleBorder} bg={cfg.bubbleBg} direction="down" />
          ) : null}
        </AnimatePresence>
      </div>

      {/* キャラ本体 */}
      <motion.div
        style={{ position: "relative" }}
        animate={isDone ? { y: [0, -6, 0] } : {}}
        transition={{ duration: 0.4, type: "spring" }}
      >
        {/* アクティブ時の床グロー */}
        {isActive && (
          <motion.div style={{
            position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
            width: 40, height: 8, borderRadius: "50%",
            background: cfg.glow,
            filter: "blur(4px)",
          }}
            animate={{ opacity: [0.5, 1, 0.5], width: [36, 44, 36] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        <StreamerAvatar agent={agent} />
      </motion.div>

      {/* 役職名 */}
      <div style={{ textAlign: "center", marginTop: 2 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: cfg.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {cfg.jaLabel}
        </div>
        <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
          {agent.name}
        </div>
        {agent.model && (
          <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.18)", marginTop: 2, letterSpacing: "0.04em" }}>
            {agent.model}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 会話ストリーム ──────────────────────────────────────────────

function ConversationStream({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const displayed = showAll ? logs : logs.slice(-8);

  return (
    <div style={{
      borderTop: "1px solid rgba(99,102,241,0.15)",
      background: "rgba(6,11,24,0.6)",
      backdropFilter: "blur(8px)",
      flexShrink: 0,
      maxHeight: 180,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ヘッダー */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 16px",
        borderBottom: "1px solid rgba(99,102,241,0.08)",
      }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "#4b5680", textTransform: "uppercase" }}>
          会話ログ
        </span>
        {logs.length > 8 && (
          <button onClick={() => setShowAll(!showAll)} style={{
            fontSize: 8.5, color: "#4b5680", background: "none", border: "none",
            cursor: "pointer", letterSpacing: "0.06em",
          }}>
            {showAll ? "折りたたむ" : `全${logs.length}件`}
          </button>
        )}
      </div>

      {/* ログ本体 */}
      <div style={{ overflowY: "auto", flex: 1, padding: "6px 16px 8px" }}>
        {logs.length === 0 ? (
          <div style={{ color: "#374151", fontSize: 10, textAlign: "center", padding: "12px 0", fontStyle: "italic" }}>
            実行すると会話が流れます
          </div>
        ) : (
          <AnimatePresence mode="sync">
            {displayed.map((log, i) => {
              const cfg = ROLE_CONFIG[log.role] ?? ROLE_CONFIG.system;
              const isSystem = log.role === "system";
              if (isSystem) {
                return (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(99,102,241,0.08)" }} />
                    <span style={{ fontSize: 9, color: "#374151", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {log.time} {log.message}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "rgba(99,102,241,0.08)" }} />
                  </motion.div>
                );
              }
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "flex", gap: 6, padding: "2px 0", alignItems: "flex-start" }}
                >
                  <span style={{ fontSize: 8.5, color: "#374151", fontFamily: "monospace", flexShrink: 0, marginTop: 1 }}>
                    {log.time}
                  </span>
                  <span style={{
                    fontSize: 8.5, fontWeight: 800, color: cfg.color,
                    flexShrink: 0, fontFamily: "monospace", letterSpacing: "0.04em",
                  }}>
                    {cfg.jaLabel}
                  </span>
                  <span style={{ fontSize: 9.5, color: "rgba(226,232,240,0.7)", lineHeight: 1.5, wordBreak: "break-all" }}>
                    {log.message}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── メイン会議室 ────────────────────────────────────────────────

export default function MeetingRoom({ logs, agents, isRunning }: Props) {
  const getAgent = (id: string) => agents.find(a => a.id === id);
  const ceo        = getAgent("ceo");
  const manager    = getAgent("manager");
  const workers    = ["worker-1", "worker-2", "worker-3"].map(id => getAgent(id)).filter(Boolean) as AgentInfo[];
  const reviewer   = getAgent("reviewer");
  const researchers = ["researcher-1", "researcher-2", "researcher-3"].map(id => getAgent(id)).filter(Boolean) as AgentInfo[];
  const editor     = getAgent("editor");
  const designer   = getAgent("designer");

  // プレースホルダー
  const ph = (id: string, role: AgentRole): AgentInfo => ({
    id, role, name: id, status: "idle",
  });

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: "linear-gradient(180deg, #060b18 0%, #0d1424 60%, #060b18 100%)",
      position: "relative",
    }}>

      {/* ── ステージ背景グリッド ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }} />

      {/* ── 床ライン ── */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 188,
        height: 1, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)",
        pointerEvents: "none",
      }} />

      {/* ── ルーム名 ── */}
      <div style={{
        position: "absolute", top: 12, left: 16,
        display: "flex", alignItems: "center", gap: 8,
        pointerEvents: "none",
      }}>
        <div style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(99,102,241,0.5)",
        }}>
          ▸ AI MEETING ROOM
        </div>
        {isRunning && (
          <motion.div
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>

      {/* ── 幾何学デコ ── */}
      <div style={{ position: "absolute", top: 20, right: 20, opacity: 0.07, pointerEvents: "none" }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="10" width="60" height="60" stroke="#818cf8" strokeWidth="1" />
          <rect x="20" y="20" width="40" height="40" stroke="#a855f7" strokeWidth="0.8" />
          <line x1="40" y1="10" x2="40" y2="70" stroke="#818cf8" strokeWidth="0.5" />
          <line x1="10" y1="40" x2="70" y2="40" stroke="#818cf8" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ── キャラクターステージ ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 24px 8px", gap: 12 }}>

        {/* Row 1: CEO（中央上） */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <CharacterUnit
            agent={ceo ?? ph("ceo", "ceo")}
            showBubble
            latestMessage={ceo?.lastMessage}
          />
        </div>

        {/* Row 2: Manager + Researchers + Editor + Reviewer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingInline: 8, gap: 18 }}>
          <CharacterUnit
            agent={manager ?? ph("manager", "manager")}
            showBubble
            latestMessage={manager?.lastMessage}
          />
          <div style={{ display: "flex", gap: 18, alignItems: "flex-end", justifyContent: "center", flex: 1 }}>
            {(researchers.length > 0
              ? researchers
              : [ph("researcher-1", "researcher"), ph("researcher-2", "researcher"), ph("researcher-3", "researcher")]
            ).map((agent) => (
              <CharacterUnit
                key={agent.id}
                agent={agent}
                showBubble
                latestMessage={agent.lastMessage}
              />
            ))}
          </div>
          <CharacterUnit
            agent={editor ?? ph("editor", "editor")}
            showBubble
            latestMessage={editor?.lastMessage}
          />
          <CharacterUnit
            agent={reviewer ?? ph("reviewer", "reviewer")}
            showBubble
            latestMessage={reviewer?.lastMessage}
          />
        </div>

        {/* Row 3: Workers + Designer（横並び） */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          {(workers.length > 0 ? workers : [ph("worker-1", "worker"), ph("worker-2", "worker"), ph("worker-3", "worker")])
            .map((agent, i) => (
              <CharacterUnit
                key={agent.id}
                agent={agent}
                showBubble
                latestMessage={agent.lastMessage}
              />
            ))}
          <CharacterUnit
            agent={designer ?? ph("designer", "designer")}
            showBubble
            latestMessage={designer?.lastMessage}
          />
        </div>
      </div>

      {/* ── 会話ストリーム ── */}
      <ConversationStream logs={logs} />
    </div>
  );
}
