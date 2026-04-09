"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelCharacter from "./PixelCharacter";

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
        <PixelCharacter role={agent.role} status={agent.status} agentId={agent.id} size={3} />
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
            {(researchers.length > 0 ? researchers : [ph("researcher-1", "researcher")]).map((agent) => (
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
