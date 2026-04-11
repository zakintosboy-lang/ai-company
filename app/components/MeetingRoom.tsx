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
          <PixelCharacter role={agent.role} status={agent.status} size={size} />
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
        background: "linear-gradient(180deg, #99def5 0%, #bcecff 42%, #dff6ff 43%, #b8d8b0 43%, #7e9a72 62%, #72616e 62%, #72616e 100%)",
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
          backgroundSize: "24px 24px",
          opacity: 0.2,
        }}
      />

      <div style={{ position: "absolute", top: 46, left: 56, width: 96, height: 26, borderRadius: 999, background: "rgba(255,255,255,0.8)", filter: "blur(1px)" }} />
      <div style={{ position: "absolute", top: 74, right: 110, width: 74, height: 18, borderRadius: 999, background: "rgba(255,255,255,0.78)", filter: "blur(1px)" }} />
      <div style={{ position: "absolute", top: 84, right: 58, width: 54, height: 14, borderRadius: 999, background: "rgba(255,255,255,0.72)", filter: "blur(1px)" }} />

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 204,
          width: "34%",
          height: 170,
          background: "#9a8ea1",
          clipPath: "polygon(0 100%, 0 38%, 18% 12%, 34% 34%, 56% 8%, 78% 40%, 100% 18%, 100% 100%)",
          opacity: 0.92,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 202,
          width: "36%",
          height: 180,
          background: "#c8b3be",
          clipPath: "polygon(0 100%, 0 26%, 20% 14%, 36% 4%, 58% 28%, 84% 14%, 100% 40%, 100% 100%)",
          opacity: 0.96,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 186,
          height: 36,
          background:
            "linear-gradient(180deg, #5b7d4f 0%, #5b7d4f 45%, #6f9363 45%, #6f9363 100%)",
          borderTop: "4px solid #66895c",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 150,
          height: 42,
          background:
            "linear-gradient(180deg, #6f6170 0%, #6f6170 45%, #655765 45%, #655765 100%)",
          borderTop: "4px solid #d8c9d6",
          borderBottom: "4px solid #564b56",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 18,
          left: 22,
          padding: "7px 10px",
          borderRadius: 999,
          background: "rgba(255,248,241,0.88)",
          border: "3px solid #31405f",
          boxShadow: "0 4px 0 rgba(49,64,95,0.2)",
          fontSize: 10,
          fontWeight: 900,
          color: "#31405f",
          letterSpacing: "0.08em",
        }}
      >
        PIXEL MEETING ROOM {isRunning ? "ON AIR" : "READY"}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 16,
          padding: "96px 24px 170px",
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
