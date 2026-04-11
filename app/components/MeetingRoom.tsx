"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PixelCharacter from "./PixelCharacter";

type AgentRole = "ceo" | "manager" | "worker" | "reviewer" | "researcher" | "designer" | "editor" | "system";
type AgentStatus = "idle" | "thinking" | "reviewing" | "done" | "waiting";

interface LogEntry { time: string; role: AgentRole; message: string; }
interface AgentInfo { id: string; role: AgentRole; name: string; status: AgentStatus; lastMessage?: string; model?: string; }

interface Props {
  logs: LogEntry[];
  agents: AgentInfo[];
  isRunning: boolean;
  output: boolean;
}

type PixelGrid = (string | null)[][];

const ROLE_CONFIG: Record<AgentRole, {
  jaLabel: string;
  color: string;
  bubbleBg: string;
  bubbleBorder: string;
  plate: string;
}> = {
  ceo:        { jaLabel: "CEO", color: "#8b5cf6", bubbleBg: "#fff5fb", bubbleBorder: "#8b5cf6", plate: "#f0ddff" },
  manager:    { jaLabel: "進行役", color: "#3b82f6", bubbleBg: "#f2f8ff", bubbleBorder: "#3b82f6", plate: "#dbeafe" },
  worker:     { jaLabel: "実行担当", color: "#f97316", bubbleBg: "#fff5eb", bubbleBorder: "#f97316", plate: "#fed7aa" },
  reviewer:   { jaLabel: "チェック", color: "#22c55e", bubbleBg: "#effef4", bubbleBorder: "#22c55e", plate: "#bbf7d0" },
  researcher: { jaLabel: "調査担当", color: "#06b6d4", bubbleBg: "#eefcff", bubbleBorder: "#06b6d4", plate: "#bae6fd" },
  designer:   { jaLabel: "デザイン", color: "#ec4899", bubbleBg: "#fff1f8", bubbleBorder: "#ec4899", plate: "#fbcfe8" },
  editor:     { jaLabel: "編集者", color: "#84cc16", bubbleBg: "#f8ffe7", bubbleBorder: "#84cc16", plate: "#d9f99d" },
  system:     { jaLabel: "システム", color: "#64748b", bubbleBg: "#f8fafc", bubbleBorder: "#94a3b8", plate: "#e2e8f0" },
};

function spriteFromRows(rows: string[], palette: Record<string, string | null>): PixelGrid {
  return rows.map((row) => row.split("").map((cell) => palette[cell] ?? null));
}

const DECOR_PALETTE = {
  ".": null,
  K: "#1d2438",
  W: "#ffffff",
  G: "#2fa84f",
  H: "#237d3a",
  Y: "#ffd558",
  O: "#d7a82b",
  N: "#8f5c36",
  M: "#5d391f",
  C: "#edf2ff",
  A: "#cfd6ea",
};

const COIN_SPRITE = spriteFromRows([
  "..YYYY..",
  ".YYOOYY.",
  "YYOOOOYY",
  "YYOOOOYY",
  "YYOOOOYY",
  "YYOOOOYY",
  ".YYOOYY.",
  "..YYYY..",
], DECOR_PALETTE);

const GOOMBA_SPRITE = spriteFromRows([
  "...NNNN...",
  "..NNNNNN..",
  ".NNWNNWNN.",
  ".NNKNNKNN.",
  ".NNNNNNNN.",
  "..NMMMMN..",
  "..SS..SS..",
  ".SSS..SSS.",
], DECOR_PALETTE);

const LAKITU_SPRITE = spriteFromRows([
  "...GGGG...",
  "..GGYYGG..",
  "..GYWWYG..",
  "..GYKKYG..",
  "...WSSW...",
  ".CCCCCCCC.",
  "CCCAAACCCC",
  ".CCCCCCCC.",
], DECOR_PALETTE);

function PixelDecor({ pixels, cellSize }: { pixels: PixelGrid; cellSize: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", imageRendering: "pixelated" }}>
      {pixels.map((row, y) => (
        <div key={y} style={{ display: "flex" }}>
          {row.map((color, x) => (
            <div
              key={x}
              style={{
                width: cellSize,
                height: cellSize,
                background: color ?? "transparent",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SpeechBubble({ message, cfg }: { message: string; cfg: (typeof ROLE_CONFIG)[AgentRole] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.92 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "relative",
        maxWidth: 160,
        minHeight: 50,
        padding: "8px 10px",
        border: `3px solid ${cfg.bubbleBorder}`,
        borderRadius: 8,
        background: cfg.bubbleBg,
        boxShadow: "0 5px 0 rgba(31,41,55,0.16)",
        imageRendering: "pixelated",
      }}
    >
      <div
        style={{
          fontSize: 10,
          lineHeight: 1.45,
          color: "#243042",
          fontWeight: 700,
          letterSpacing: "0.02em",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {message}
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -11,
          transform: "translateX(-50%)",
          width: 18,
          height: 12,
          background: cfg.bubbleBg,
          clipPath: "polygon(50% 100%, 0 0, 100% 0)",
          borderLeft: `3px solid ${cfg.bubbleBorder}`,
          borderRight: `3px solid ${cfg.bubbleBorder}`,
          borderBottom: `3px solid ${cfg.bubbleBorder}`,
        }}
      />
    </motion.div>
  );
}

function TypingBubble({ cfg }: { cfg: (typeof ROLE_CONFIG)[AgentRole] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      style={{
        minWidth: 72,
        minHeight: 42,
        padding: "10px 12px",
        border: `3px solid ${cfg.bubbleBorder}`,
        borderRadius: 8,
        background: cfg.bubbleBg,
        display: "flex",
        justifyContent: "center",
        gap: 5,
        boxShadow: "0 5px 0 rgba(31,41,55,0.16)",
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ width: 7, height: 7, borderRadius: 2, background: cfg.bubbleBorder }}
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </motion.div>
  );
}

function CharacterUnit({ agent }: { agent: AgentInfo }) {
  const cfg = ROLE_CONFIG[agent.role] ?? ROLE_CONFIG.system;
  const active = agent.status === "thinking" || agent.status === "reviewing";
  const size = agent.role === "ceo" ? 4.4 : 4;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 86 }}>
      <div style={{ minHeight: 66, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          {active ? (
            <TypingBubble key="typing" cfg={cfg} />
          ) : agent.lastMessage ? (
            <SpeechBubble key={agent.lastMessage.slice(0, 18)} message={agent.lastMessage} cfg={cfg} />
          ) : null}
        </AnimatePresence>
      </div>

      <div style={{ position: "relative", paddingBottom: 8 }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: 64,
            height: 12,
            borderRadius: 999,
            background: "rgba(55,65,81,0.18)",
            filter: "blur(2px)",
          }}
        />
        <motion.div
          animate={active ? { y: [0, -4, 0] } : { y: [0, -1, 0] }}
          transition={{ duration: active ? 0.7 : 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            padding: "6px 8px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.16)",
            boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.28)",
          }}
        >
          <PixelCharacter role={agent.role} status={agent.status} agentId={agent.id} size={size} />
        </motion.div>
      </div>

      <div
        style={{
          padding: "6px 10px 5px",
          borderRadius: 999,
          border: "3px solid #27324a",
          background: cfg.plate,
          boxShadow: "0 4px 0 rgba(39,50,74,0.2)",
          textAlign: "center",
          minWidth: 82,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 900, color: cfg.color, letterSpacing: "0.08em" }}>{cfg.jaLabel}</div>
        <div style={{ fontSize: 8, color: "#4b5563", marginTop: 2, fontWeight: 700 }}>{agent.name}</div>
      </div>
    </div>
  );
}

function ConversationStream({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const displayed = showAll ? logs : logs.slice(-8);

  return (
    <div
      style={{
        margin: "0 14px 14px",
        border: "4px solid #31405f",
        borderRadius: 14,
        background: "#f7f1e7",
        boxShadow: "0 8px 0 rgba(49,64,95,0.22)",
        overflow: "hidden",
        maxHeight: 188,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          background: "linear-gradient(180deg, #f8bfd4 0%, #ee95ba 100%)",
          borderBottom: "4px solid #31405f",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: "#31405f" }}>TEAM LOG</span>
        {logs.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              border: "3px solid #31405f",
              borderRadius: 999,
              padding: "2px 8px",
              background: "#fff8f1",
              color: "#31405f",
              fontSize: 9,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {showAll ? "折りたたむ" : `全${logs.length}件`}
          </button>
        )}
      </div>

      <div style={{ overflowY: "auto", padding: "8px 12px 10px", background: "#fff8f1" }}>
        {logs.length === 0 ? (
          <div style={{ padding: "18px 0", textAlign: "center", fontSize: 11, color: "#64748b", fontWeight: 700 }}>
            実行するとここにチームの会話が流れます
          </div>
        ) : (
          displayed.map((log, i) => {
            const cfg = ROLE_CONFIG[log.role] ?? ROLE_CONFIG.system;
            return (
              <div
                key={`${log.time}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px 62px 1fr",
                  gap: 8,
                  alignItems: "start",
                  padding: "4px 0",
                  borderBottom: i === displayed.length - 1 ? "none" : "1px dashed rgba(49,64,95,0.18)",
                }}
              >
                <span style={{ fontSize: 9, color: "#64748b", fontWeight: 800 }}>{log.time}</span>
                <span style={{ fontSize: 9, color: cfg.color, fontWeight: 900 }}>{cfg.jaLabel}</span>
                <span style={{ fontSize: 10.5, color: "#334155", lineHeight: 1.55, fontWeight: 700 }}>{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function MeetingRoom({ logs, agents, isRunning }: Props) {
  const getAgent = (id: string) => agents.find((a) => a.id === id);
  const all: AgentInfo[] = agents.length > 0
    ? agents
    : [
        { id: "ceo", role: "ceo", name: "CEO", status: "idle" as AgentStatus },
        { id: "manager", role: "manager", name: "Manager", status: "idle" as AgentStatus },
        { id: "worker-1", role: "worker", name: "Worker Lead", status: "idle" as AgentStatus },
        { id: "worker-2", role: "worker", name: "Worker Core", status: "idle" as AgentStatus },
        { id: "worker-3", role: "worker", name: "Worker Quality", status: "idle" as AgentStatus },
        { id: "reviewer", role: "reviewer", name: "Reviewer", status: "idle" as AgentStatus },
      ];

  const lineup = [
    getAgent("ceo"),
    getAgent("manager"),
    getAgent("worker-1"),
    getAgent("worker-2"),
    getAgent("worker-3"),
    getAgent("reviewer"),
  ].filter(Boolean) as AgentInfo[];

  const cast = lineup.length > 0 ? lineup : all;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "linear-gradient(180deg, #77d6ff 0%, #8fe2ff 38%, #d8f5ff 39%, #d8f5ff 100%)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 8,
          border: "4px solid #7f57f1",
          borderRadius: 18,
          boxShadow: "inset 0 0 0 4px #ffe85d",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 20,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          opacity: 0.16,
        }}
      />

      <div style={{ position: "absolute", top: 40, left: 48, width: 108, height: 24, borderRadius: 999, background: "#ffffff", boxShadow: "26px 6px 0 0 #ffffff, 54px 0 0 0 #ffffff" }} />
      <div style={{ position: "absolute", top: 78, right: 120, width: 82, height: 18, borderRadius: 999, background: "#ffffff", boxShadow: "22px -4px 0 0 #ffffff, 46px 2px 0 0 #ffffff" }} />
      <div style={{ position: "absolute", top: 98, right: 54, width: 58, height: 14, borderRadius: 999, background: "#ffffff", boxShadow: "16px 0 0 0 #ffffff" }} />

      <div
        style={{
          position: "absolute",
          left: 40,
          bottom: 208,
          width: 210,
          height: 112,
          background: "#8ed36e",
          borderRadius: "50% 50% 0 0",
          boxShadow: "inset 0 -10px 0 #79c25a",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 102,
          bottom: 248,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "34px 0 0 #ffffff, 72px 0 0 #ffffff",
          opacity: 0.75,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 212,
          width: 240,
          height: 126,
          background: "#9ce07f",
          borderRadius: "55% 55% 0 0",
          boxShadow: "inset 0 -10px 0 #84cb66",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 102,
          bottom: 258,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "38px 0 0 #ffffff, 80px 0 0 #ffffff",
          opacity: 0.75,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 222,
          width: "32%",
          height: 128,
          background: "#b6a0d5",
          clipPath: "polygon(0 100%, 0 42%, 16% 20%, 36% 34%, 56% 12%, 78% 28%, 100% 18%, 100% 100%)",
          opacity: 0.72,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 220,
          width: "34%",
          height: 136,
          background: "#c7b3e4",
          clipPath: "polygon(0 100%, 0 32%, 22% 16%, 40% 6%, 58% 24%, 82% 18%, 100% 34%, 100% 100%)",
          opacity: 0.72,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 180,
          height: 40,
          background:
            "linear-gradient(180deg, #49b34d 0%, #49b34d 48%, #37983b 48%, #37983b 100%)",
          borderTop: "4px solid #83de6b",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 132,
          height: 52,
          background:
            "linear-gradient(180deg, #d38a4a 0%, #d38a4a 50%, #b86a35 50%, #b86a35 100%)",
          borderTop: "4px solid #f5b36c",
          borderBottom: "4px solid #8a4d28",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 132,
          height: 52,
          opacity: 0.22,
          backgroundImage:
            "linear-gradient(90deg, transparent 0, transparent 10px, #6b3418 10px, #6b3418 12px, transparent 12px, transparent 36px, #6b3418 36px, #6b3418 38px, transparent 38px), linear-gradient(transparent 0, transparent 10px, #6b3418 10px, #6b3418 12px, transparent 12px)",
          backgroundSize: "48px 24px",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 84,
          bottom: 184,
          display: "grid",
          gridTemplateColumns: "repeat(4, 26px)",
          gap: 3,
        }}
      >
        {["#c97d43", "#c97d43", "#ffd54d", "#c97d43"].map((color, i) => (
          <div
            key={`left-block-${i}`}
            style={{
              width: 26,
              height: 26,
              background: color,
              border: "3px solid #7a431e",
              boxShadow: color === "#ffd54d" ? "inset 0 0 0 3px #ffe78a" : "inset 0 0 0 3px #dca06f",
              position: "relative",
            }}
          >
            {color === "#ffd54d" && (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#8a4d28",
                }}
              >
                ?
              </span>
            )}
          </div>
        ))}
      </div>

      <motion.div
        style={{ position: "absolute", top: 38, left: 260, zIndex: 1, pointerEvents: "none" }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={COIN_SPRITE} cellSize={4} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 62, left: 324, zIndex: 1, pointerEvents: "none" }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={COIN_SPRITE} cellSize={3.6} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 54, right: 180, zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, 6, 0], y: [0, -2, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={LAKITU_SPRITE} cellSize={4} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", bottom: 182, left: 220, zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={GOOMBA_SPRITE} cellSize={4} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", bottom: 184, right: 228, zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, -5, 0] }}
        transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={GOOMBA_SPRITE} cellSize={3.6} />
      </motion.div>

      <div
        style={{
          position: "absolute",
          right: 106,
          bottom: 184,
          width: 54,
          height: 76,
          background: "#37b24d",
          border: "4px solid #1f6f31",
          borderBottom: "none",
          borderRadius: "18px 18px 0 0",
          boxShadow: "inset 0 0 0 4px #6edb74",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 96,
          bottom: 244,
          width: 74,
          height: 22,
          background: "#37b24d",
          border: "4px solid #1f6f31",
          borderRadius: 999,
          boxShadow: "inset 0 0 0 4px #6edb74",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 116,
          height: 18,
          background:
            "repeating-linear-gradient(90deg, #d38a4a 0 34px, #b86a35 34px 38px)",
          borderTop: "4px solid #8a4d28",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 18,
          left: 22,
          padding: "7px 10px",
          borderRadius: 999,
          background: "rgba(255,248,241,0.94)",
          border: "3px solid #31405f",
          boxShadow: "0 4px 0 rgba(49,64,95,0.2)",
          fontSize: 10,
          fontWeight: 900,
          color: "#31405f",
          letterSpacing: "0.08em",
        }}
      >
        PIXEL STAGE {isRunning ? "1-1 RUNNING" : "1-1 READY"}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 16,
          padding: "96px 24px 154px",
          position: "relative",
          zIndex: 1,
          flexWrap: "wrap",
        }}
      >
        {cast.map((agent) => (
          <CharacterUnit key={agent.id} agent={agent} />
        ))}
      </div>

      <ConversationStream logs={logs} />
    </div>
  );
}
