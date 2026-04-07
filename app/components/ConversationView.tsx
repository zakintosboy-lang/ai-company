"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AgentRole = "ceo" | "manager" | "worker" | "reviewer" | "system";
type AgentStatus = "idle" | "thinking" | "reviewing" | "done" | "waiting";

interface LogEntry { time: string; role: AgentRole; message: string; }
interface AgentInfo { id: string; role: AgentRole; name: string; status: AgentStatus; }

interface Props {
  logs: LogEntry[];
  agents: AgentInfo[];
  isRunning: boolean;
}

// ─── 役割テーマ ───────────────────────────────────────────────────

const ROLE_CONFIG = {
  ceo: {
    name: "CEO",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.2)",
    bg: "linear-gradient(135deg, rgba(88,28,135,0.6), rgba(109,40,217,0.4))",
    border: "rgba(168,85,247,0.35)",
    story: "戦略指揮官",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" style={{ width: "100%", height: "100%" }}>
        {/* 頭 */}
        <circle cx="14" cy="10" r="6" fill="url(#ceoSkin)" />
        <defs>
          <linearGradient id="ceoSkin" x1="8" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde8c4" /><stop offset="1" stopColor="#f5c49a" />
          </linearGradient>
        </defs>
        {/* 銀髪 */}
        <path d="M8 9 Q8 3 14 3 Q20 3 20 9 Q18 5 14 5 Q10 5 8 9Z" fill="#d8b4fe" />
        {/* 目 */}
        <ellipse cx="11.5" cy="10" rx="1.2" ry="1.4" fill="#6d28d9" />
        <ellipse cx="16.5" cy="10" rx="1.2" ry="1.4" fill="#6d28d9" />
        <circle cx="11.8" cy="9.5" r="0.4" fill="white" opacity="0.8" />
        <circle cx="16.8" cy="9.5" r="0.4" fill="white" opacity="0.8" />
        {/* スーツ */}
        <path d="M6 22 Q8 16 14 15 Q20 16 22 22 L22 28 Q14 30 6 28Z" fill="#1e1b4b" />
        <path d="M14 15 L13 17 L14 19 L15 17Z" fill="#c4b5fd" />
        {/* ヘッドフォン */}
        <path d="M8 9 Q7 6 14 6 Q21 6 20 9" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
        <rect x="6" y="8" width="3" height="4" rx="1.5" fill="#4c1d95" />
        <rect x="19" y="8" width="3" height="4" rx="1.5" fill="#4c1d95" />
      </svg>
    ),
  },
  manager: {
    name: "Manager",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.2)",
    bg: "linear-gradient(135deg, rgba(8,47,73,0.6), rgba(12,74,110,0.4))",
    border: "rgba(56,189,248,0.35)",
    story: "プロジェクト管理官",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" style={{ width: "100%", height: "100%" }}>
        <circle cx="14" cy="10" r="6" fill="url(#mgSkin)" />
        <defs>
          <linearGradient id="mgSkin" x1="8" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde8c4" /><stop offset="1" stopColor="#f5c49a" />
          </linearGradient>
        </defs>
        {/* 青髪ショート */}
        <path d="M8 9 Q8 3 14 3 Q20 3 20 9 Q18 5 14 5 Q10 5 8 9Z" fill="#0ea5e9" />
        <path d="M8 9 Q7 7 8 11" fill="#0284c7" />
        <path d="M20 9 Q21 7 20 11" fill="#0284c7" />
        {/* メガネ */}
        <circle cx="11.5" cy="10" r="2.2" stroke="#bae6fd" strokeWidth="0.8" fill="none" />
        <circle cx="16.5" cy="10" r="2.2" stroke="#bae6fd" strokeWidth="0.8" fill="none" />
        <line x1="13.7" y1="10" x2="14.3" y2="10" stroke="#bae6fd" strokeWidth="0.8" />
        {/* 瞳 */}
        <circle cx="11.5" cy="10" r="1.3" fill="#0369a1" />
        <circle cx="16.5" cy="10" r="1.3" fill="#0369a1" />
        <circle cx="11.9" cy="9.6" r="0.4" fill="white" opacity="0.8" />
        <circle cx="16.9" cy="9.6" r="0.4" fill="white" opacity="0.8" />
        {/* コート */}
        <path d="M6 22 Q8 16 14 15 Q20 16 22 22 L22 28 Q14 30 6 28Z" fill="#082f49" />
        <rect x="15" y="16" width="4" height="5" rx="1" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="0.4" />
      </svg>
    ),
  },
  worker: {
    name: "Worker",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.2)",
    bg: "linear-gradient(135deg, rgba(67,20,7,0.6), rgba(154,52,18,0.4))",
    border: "rgba(251,146,60,0.35)",
    story: "実行担当",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" style={{ width: "100%", height: "100%" }}>
        <circle cx="14" cy="11" r="6" fill="url(#wkSkin)" />
        <defs>
          <linearGradient id="wkSkin" x1="8" y1="5" x2="20" y2="17" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde8c4" /><stop offset="1" stopColor="#f5c49a" />
          </linearGradient>
        </defs>
        {/* ヘルメット */}
        <path d="M8 10 Q8 4 14 4 Q20 4 20 10 Q18 7 14 7 Q10 7 8 10Z" fill="#fb923c" />
        <rect x="7" y="9" width="14" height="3" rx="1.5" fill="#ea580c" opacity="0.9" />
        {/* 目（丸くて元気） */}
        <circle cx="11.5" cy="11" r="1.5" fill="#1c1917" />
        <circle cx="16.5" cy="11" r="1.5" fill="#1c1917" />
        <circle cx="12" cy="10.5" r="0.5" fill="white" opacity="0.9" />
        <circle cx="17" cy="10.5" r="0.5" fill="white" opacity="0.9" />
        {/* 笑顔 */}
        <path d="M11.5 14 Q14 16 16.5 14" stroke="#c2410c" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        {/* ほっぺ */}
        <circle cx="9.5" cy="13" r="1.5" fill="#fca5a5" opacity="0.5" />
        <circle cx="18.5" cy="13" r="1.5" fill="#fca5a5" opacity="0.5" />
        {/* パーカー */}
        <path d="M6 22 Q8 16 14 15 Q20 16 22 22 L22 28 Q14 30 6 28Z" fill="#431407" />
        <path d="M12 15 L14 15 L14 17 L12 17Z" fill="#fb923c" opacity="0.6" />
      </svg>
    ),
  },
  reviewer: {
    name: "Reviewer",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.2)",
    bg: "linear-gradient(135deg, rgba(5,46,22,0.6), rgba(22,101,52,0.4))",
    border: "rgba(34,197,94,0.35)",
    story: "品質審査官",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" style={{ width: "100%", height: "100%" }}>
        <circle cx="14" cy="10" r="6" fill="url(#rvSkin)" />
        <defs>
          <linearGradient id="rvSkin" x1="8" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde8c4" /><stop offset="1" stopColor="#f5c49a" />
          </linearGradient>
        </defs>
        {/* ミントグリーン髪 */}
        <path d="M8 9 Q8 3 14 3 Q20 3 20 9 Q18 5 14 5 Q10 5 8 9Z" fill="#4ade80" />
        <path d="M8 9 Q7 7 8 12" fill="#16a34a" />
        <path d="M20 9 Q21 7 20 12" fill="#16a34a" />
        {/* 目（穏やか細目） */}
        <path d="M10 10 Q11.5 8.5 13 10" stroke="#15803d" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M15 10 Q16.5 8.5 18 10" stroke="#15803d" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* 笑顔 */}
        <path d="M11.5 13 Q14 15.5 16.5 13" stroke="#c2410c" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        {/* ほっぺ */}
        <circle cx="9.5" cy="12" r="1.5" fill="#86efac" opacity="0.4" />
        <circle cx="18.5" cy="12" r="1.5" fill="#86efac" opacity="0.4" />
        {/* ジャケット */}
        <path d="M6 22 Q8 16 14 15 Q20 16 22 22 L22 28 Q14 30 6 28Z" fill="#052e16" />
        <circle cx="10" cy="17" r="2.5" fill="#14532d" stroke="#22c55e" strokeWidth="0.6" />
        <path d="M8.8 17 L9.8 18 L11.2 16" stroke="#22c55e" strokeWidth="0.7" strokeLinecap="round" />
      </svg>
    ),
  },
  system: {
    name: "System",
    color: "#64748b",
    glow: "rgba(100,116,139,0.15)",
    bg: "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(30,41,59,0.4))",
    border: "rgba(100,116,139,0.3)",
    story: "システム",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" style={{ width: "100%", height: "100%" }}>
        <circle cx="14" cy="14" r="10" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        <text x="14" y="18" textAnchor="middle" fill="#64748b" fontSize="12">⚙</text>
      </svg>
    ),
  },
} as const;

// ─── タイピングアニメーション ────────────────────────────────────

function TypingIndicator({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ width: 6, height: 6, borderRadius: "50%", background: color }}
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── メッセージバブル ────────────────────────────────────────────

function MessageBubble({ entry, agentName, isLast }: {
  entry: LogEntry;
  agentName: string;
  isLast: boolean;
}) {
  const cfg = ROLE_CONFIG[entry.role] ?? ROLE_CONFIG.system;
  const isSystem = entry.role === "system";

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 0", justifyContent: "center",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "rgba(99,102,241,0.12)" }} />
        <span style={{ fontSize: 10, color: "#4b5680", fontFamily: "monospace", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
          {entry.time} — {entry.message}
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(99,102,241,0.12)" }} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "4px 0" }}
    >
      {/* アバター */}
      <div style={{
        width: 40, height: 40, flexShrink: 0, borderRadius: 12,
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        padding: 3,
        boxShadow: `0 4px 16px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}>
        {cfg.icon}
      </div>

      {/* メッセージ本体 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color, letterSpacing: "0.04em" }}>
            {agentName}
          </span>
          <span style={{ fontSize: 9, color: "#4b5680", fontFamily: "monospace" }}>
            {cfg.story}
          </span>
          <span style={{ fontSize: 9, color: "#374151", fontFamily: "monospace", marginLeft: "auto" }}>
            {entry.time}
          </span>
        </div>

        {/* バブル */}
        <div style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: "4px 14px 14px 14px",
          padding: "10px 14px",
          backdropFilter: "blur(8px)",
          position: "relative",
          boxShadow: `0 2px 12px ${cfg.glow}`,
        }}>
          {/* アクセントライン */}
          <div style={{
            position: "absolute", left: 0, top: 8, bottom: 8, width: 3,
            background: cfg.color, borderRadius: "0 2px 2px 0", opacity: 0.8,
          }} />
          <p style={{
            fontSize: 13, lineHeight: 1.75, color: "#e2e8f0",
            margin: 0, paddingLeft: 4,
            wordBreak: "break-word", whiteSpace: "pre-wrap",
          }}>
            {entry.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── アクティブエージェント表示 ──────────────────────────────────

function ActiveAgentBubble({ agent }: { agent: AgentInfo }) {
  const cfg = ROLE_CONFIG[agent.role] ?? ROLE_CONFIG.system;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.3 }}
      style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "4px 0" }}
    >
      <div style={{
        width: 40, height: 40, flexShrink: 0, borderRadius: 12,
        background: cfg.bg, border: `1.5px solid ${cfg.border}`,
        padding: 3,
        boxShadow: `0 4px 20px ${cfg.glow}`,
        animation: "agentPulse 1.5s ease-in-out infinite",
      }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{agent.name}</span>
          <span style={{ fontSize: 9, color: "#4b5680", fontFamily: "monospace" }}>
            {agent.status === "reviewing" ? "審査中..." : "思考中..."}
          </span>
        </div>
        <div style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: "4px 14px 14px 14px",
          padding: "10px 14px",
          backdropFilter: "blur(8px)",
          boxShadow: `0 2px 16px ${cfg.glow}`,
        }}>
          <TypingIndicator color={cfg.color} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────

export default function ConversationView({ logs, agents, isRunning }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showRawLogs, setShowRawLogs] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length, isRunning]);

  // アクティブなエージェントを取得
  const activeAgents = agents.filter(
    (a) => a.status === "thinking" || a.status === "reviewing"
  );

  // ロール→エージェント名マップ
  const roleToName: Partial<Record<AgentRole, string>> = {};
  for (const a of agents) {
    if (!roleToName[a.role]) roleToName[a.role] = a.name;
  }

  const isEmpty = logs.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* 会話エリア */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 24px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(99,102,241,0.2) transparent",
      }}>
        {isEmpty ? (
          <div style={{
            height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 16,
          }}>
            {/* ウェルカム画面 */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 400,
            }}>
              {(["ceo", "manager", "worker", "reviewer"] as AgentRole[]).map((role) => {
                const cfg = ROLE_CONFIG[role];
                return (
                  <div key={role} style={{
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    borderRadius: 14, padding: "14px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, padding: 2, flexShrink: 0, border: `1.5px solid ${cfg.border}` }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: cfg.color }}>{cfg.name}</div>
                      <div style={{ fontSize: 9, color: "#4b5680" }}>{cfg.story}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "#4b5680", textAlign: "center", lineHeight: 1.7, marginTop: 8 }}>
              指示を入力して実行すると<br />AIチームの会話がここに表示されます
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <AnimatePresence mode="sync">
              {logs.map((entry, i) => (
                <MessageBubble
                  key={i}
                  entry={entry}
                  agentName={roleToName[entry.role] ?? ROLE_CONFIG[entry.role]?.name ?? entry.role}
                  isLast={i === logs.length - 1}
                />
              ))}

              {/* アクティブエージェントのタイピング表示 */}
              {isRunning && activeAgents.map((agent) => (
                <ActiveAgentBubble key={agent.id} agent={agent} />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 生ログ（折りたたみ） */}
      {logs.length > 0 && (
        <div style={{
          borderTop: "1px solid rgba(99,102,241,0.12)",
          background: "rgba(6,11,24,0.8)",
          flexShrink: 0,
        }}>
          <button
            onClick={() => setShowRawLogs(!showRawLogs)}
            style={{
              width: "100%", padding: "8px 20px",
              display: "flex", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer",
              color: "#4b5680", fontSize: 10, fontFamily: "monospace",
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}
          >
            <span style={{
              transform: showRawLogs ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s", display: "inline-block",
            }}>▶</span>
            生ログ ({logs.length}件)
          </button>

          {showRawLogs && (
            <div style={{
              maxHeight: 180, overflowY: "auto",
              padding: "0 20px 12px",
              fontFamily: "monospace", fontSize: 10.5, lineHeight: 1.9,
            }}>
              {logs.map((e, i) => {
                const cfg = ROLE_CONFIG[e.role] ?? ROLE_CONFIG.system;
                return (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={{ color: "#374151", flexShrink: 0 }}>{e.time}</span>
                    <span style={{
                      color: cfg.color, fontWeight: 700, fontSize: 9,
                      padding: "0 4px", flexShrink: 0,
                      background: `${cfg.color}18`, borderRadius: 3,
                    }}>
                      {ROLE_CONFIG[e.role]?.name ?? e.role}
                    </span>
                    <span style={{ color: "#6b7280", wordBreak: "break-word" }}>{e.message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes agentPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(99,102,241,0.2); }
          50% { box-shadow: 0 4px 30px rgba(99,102,241,0.4); }
        }
      `}</style>
    </div>
  );
}
