"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PixelCharacter from "./PixelCharacter";
import WaitingGame from "./WaitingGame";

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

const KOOPA_SPRITE = spriteFromRows([
  "..GGYYGG..",
  ".GYYYYYYG.",
  ".GYWKKWYG.",
  ".GYYYYYYG.",
  "..GYYYYG..",
  "..SSYYSS..",
  ".NNGGGGNN.",
  "..NN..NN..",
], DECOR_PALETTE);

const PEACH_SPRITE = spriteFromRows([
  "...YYYY...",
  "..YYSSYY..",
  ".YYSSSSYY.",
  ".YYWSSWYY.",
  "..YYSSYY..",
  "...PPPP...",
  "..PPPPPP..",
  "..SS..SS..",
], DECOR_PALETTE);

const PIRANHA_SPRITE = spriteFromRows([
  "...RRR....",
  "..RWWWR...",
  ".RWWKWWR..",
  ".RWWWWW...",
  "..RWWW....",
  "...GG.....",
  "...GG.....",
  "...GG.....",
], {
  ...DECOR_PALETTE,
  R: "#df5548",
});

const BOWSER_SPRITE = spriteFromRows([
  "..GGYYYYGG..",
  ".GGYYYYYYGG.",
  ".GYWKKKKWYG.",
  ".GYYYYYYYYG.",
  "..GYYMMYYG..",
  ".NNGGGGGGNN.",
  ".NNNGGGGNNN.",
  "..NN....NN..",
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

function PixelBadgeIcon({ pixels, cellSize = 2 }: { pixels: PixelGrid; cellSize?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", imageRendering: "pixelated", flexShrink: 0 }}>
      {pixels.map((row, y) => (
        <div key={y} style={{ display: "flex" }}>
          {row.map((color, x) => (
            <div key={x} style={{ width: cellSize, height: cellSize, background: color ?? "transparent" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

const BADGE_PALETTE = {
  ".": null,
  K: "#23324f",
  Y: "#ffd558",
  B: "#3b82f6",
  O: "#f97316",
  G: "#22c55e",
  C: "#06b6d4",
  P: "#ec4899",
  L: "#84cc16",
  W: "#ffffff",
};

const CROWN_ICON = spriteFromRows([
  ".Y.Y.",
  "YYYYY",
  "YKYKY",
  ".YYY.",
  "..K..",
], BADGE_PALETTE);

const WAND_ICON = spriteFromRows([
  "...Y.",
  "..YYY",
  "YKYKY",
  "..YYY",
  "...K.",
], BADGE_PALETTE);

const HAMMER_ICON = spriteFromRows([
  ".OOO.",
  ".OOK.",
  "..OK.",
  ".KK..",
  ".K...",
], BADGE_PALETTE);

const CHECK_ICON = spriteFromRows([
  "....G",
  "...GG",
  ".GGG.",
  "GG...",
  "G....",
], BADGE_PALETTE);

const SEARCH_ICON = spriteFromRows([
  ".CCC.",
  "CKWKC",
  "CKKKC",
  ".CCC.",
  "...K.",
], BADGE_PALETTE);

const PEN_ICON = spriteFromRows([
  "...P.",
  "..PP.",
  ".PPK.",
  "PPK..",
  ".K...",
], BADGE_PALETTE);

const DESIGN_ICON = spriteFromRows([
  "P...P",
  ".P.P.",
  "..P..",
  ".P.P.",
  "P...P",
], BADGE_PALETTE);

const EDIT_ICON = spriteFromRows([
  "..LL.",
  ".LLLK",
  "LLLK.",
  ".KK..",
  "..K..",
], BADGE_PALETTE);

const SYSTEM_ICON = spriteFromRows([
  ".BBB.",
  "BKWKB",
  "BKWKB",
  "BKWKB",
  ".BBB.",
], BADGE_PALETTE);

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

function ActivityBadge({ agent }: { agent: AgentInfo }) {
  const isActive = agent.status === "thinking" || agent.status === "reviewing";
  if (!isActive) return null;

  const byRole: Record<AgentRole, { icon: PixelGrid; label: string; color: string }> = {
    ceo: { icon: CROWN_ICON, label: "指示中", color: "#8b5cf6" },
    manager: { icon: WAND_ICON, label: "采配中", color: "#3b82f6" },
    worker: { icon: HAMMER_ICON, label: "作業中", color: "#f97316" },
    reviewer: { icon: CHECK_ICON, label: "確認中", color: "#22c55e" },
    researcher: { icon: SEARCH_ICON, label: "調査中", color: "#06b6d4" },
    designer: { icon: DESIGN_ICON, label: "設計中", color: "#ec4899" },
    editor: { icon: EDIT_ICON, label: "編集中", color: "#84cc16" },
    system: { icon: SYSTEM_ICON, label: "処理中", color: "#64748b" },
  };
  const meta = byRole[agent.role] ?? byRole.system;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.9 }}
      animate={{ opacity: [0.7, 1, 0.7], y: [0, -4, 0], scale: [0.96, 1.04, 0.96] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        top: -8,
        right: -8,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 6px",
        borderRadius: 999,
        border: "2px solid #27324a",
        background: "#fffaf3",
        boxShadow: "0 3px 0 rgba(39,50,74,0.16)",
        fontSize: 8,
        fontWeight: 900,
        color: meta.color,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      <PixelBadgeIcon pixels={meta.icon} />
      <span>{meta.label}</span>
    </motion.div>
  );
}

function WorkEffect({ agent }: { agent: AgentInfo }) {
  const active = agent.status === "thinking" || agent.status === "reviewing";
  if (!active) return null;

  const effectByRole: Record<AgentRole, { items: string[]; color: string }> = {
    ceo: { items: ["!", "!", "!"], color: "#8b5cf6" },
    manager: { items: [">", ">", ">"], color: "#3b82f6" },
    worker: { items: ["*", "*", "*"], color: "#f97316" },
    reviewer: { items: ["?", "?", "?"], color: "#22c55e" },
    researcher: { items: ["~", "~", "~"], color: "#06b6d4" },
    designer: { items: ["+", "+", "+"], color: "#ec4899" },
    editor: { items: ["/", "/", "/"], color: "#84cc16" },
    system: { items: [".", ".", "."], color: "#64748b" },
  };
  const meta = effectByRole[agent.role] ?? effectByRole.system;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {meta.items.map((item, index) => {
        const left = index === 0 ? -10 : index === 1 ? 50 : 104;
        return (
          <motion.div
            key={`${agent.id}-${item}-${index}`}
            style={{
              position: "absolute",
              top: index === 1 ? -6 : 4,
              left: `${left}%`,
              fontSize: 10,
              fontWeight: 900,
              color: meta.color,
              textShadow: "0 1px 0 rgba(255,255,255,0.65)",
            }}
            animate={{ y: [0, -7, -11], opacity: [0, 1, 0], scale: [0.8, 1, 1.06] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: index * 0.18, ease: "easeOut" }}
          >
            {item}
          </motion.div>
        );
      })}
    </div>
  );
}

function getTravelBias(agent: AgentInfo) {
  if (agent.role === "manager") return { x: 18, y: -12, rotate: -3 };
  if (agent.role === "researcher") {
    const bias: Record<string, number> = {
      "researcher-1": 24,
      "researcher-2": 0,
      "researcher-3": -24,
    };
    const x = bias[agent.id] ?? 0;
    return { x, y: -16, rotate: x > 0 ? -3 : x < 0 ? 3 : 0 };
  }
  if (agent.role === "worker") {
    const bias: Record<string, number> = {
      "worker-1": 30,
      "worker-2": 8,
      "worker-3": -18,
    };
    const x = bias[agent.id] ?? 0;
    return { x, y: -22, rotate: x > 0 ? -4 : 3 };
  }
  if (agent.role === "editor") return { x: -10, y: -16, rotate: 2 };
  if (agent.role === "designer") return { x: 10, y: -18, rotate: -2 };
  if (agent.role === "reviewer") return { x: -12, y: -14, rotate: 2 };
  return { x: 0, y: -10, rotate: 0 };
}

function getTravelMotion(agent: AgentInfo) {
  if (agent.status !== "thinking" && agent.status !== "reviewing") {
    return {
      x: [0, 0, 0, 0],
      y: [0, -2, -1, 0],
      scale: [1, 1.01, 1.015, 1],
      rotate: [0, 0, 0, 0],
    };
  }

  if (agent.role === "ceo") {
    return {
      x: [0, 3, 0, -3, 0],
      y: [0, -12, -16, -8, 0],
      scale: [1, 1.04, 1.08, 1.03, 1],
      rotate: [0, -2, 0, 2, 0],
    };
  }

  const bias = getTravelBias(agent);
  return {
    x: [0, bias.x * 0.45, bias.x, bias.x * 0.42, 0],
    y: [0, bias.y * 0.45, bias.y, bias.y * 0.55, 0],
    scale: [1, 1.03, 1.08, 1.04, 1],
    rotate: [0, bias.rotate * 0.4, bias.rotate, bias.rotate * 0.4, 0],
  };
}

function CharacterUnit({ agent }: { agent: AgentInfo }) {
  const cfg = ROLE_CONFIG[agent.role] ?? ROLE_CONFIG.system;
  const active = agent.status === "thinking" || agent.status === "reviewing";
  const size = agent.role === "ceo" ? 3.5 : 2.9;
  const motionProfile = getTravelMotion(agent);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 64 }}>
      <div style={{ minHeight: 44, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          {active ? (
            <TypingBubble key="typing" cfg={cfg} />
          ) : agent.lastMessage ? (
            <SpeechBubble key={agent.lastMessage.slice(0, 18)} message={agent.lastMessage} cfg={cfg} />
          ) : null}
        </AnimatePresence>
      </div>

      <div style={{ position: "relative", paddingBottom: 6 }}>
        <ActivityBadge agent={agent} />
        <WorkEffect agent={agent} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: 46,
            height: 9,
            borderRadius: 999,
            background: "rgba(55,65,81,0.18)",
            filter: "blur(2px)",
          }}
        />
        <motion.div
          animate={motionProfile}
          transition={{
            duration: active ? 2.35 : 3.6,
            repeat: Infinity,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.28, 0.54, 0.8, 1],
          }}
          style={{
            padding: "4px 5px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.16)",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.28)",
            zIndex: active ? 3 : 1,
          }}
        >
          <PixelCharacter role={agent.role} status={agent.status} agentId={agent.id} size={size} />
        </motion.div>
      </div>

      <div
        style={{
          padding: "4px 8px 4px",
          borderRadius: 999,
          border: "2px solid #27324a",
          background: cfg.plate,
          boxShadow: "0 3px 0 rgba(39,50,74,0.2)",
          textAlign: "center",
          minWidth: 64,
        }}
      >
        <div style={{ fontSize: 8, fontWeight: 900, color: cfg.color, letterSpacing: "0.08em" }}>{cfg.jaLabel}</div>
        <div style={{ fontSize: 7, color: "#4b5563", marginTop: 1, fontWeight: 700 }}>{agent.name}</div>
      </div>
    </div>
  );
}

function lineupOrFallback(
  rows: string[][],
  getAgent: (id: string) => AgentInfo | undefined,
  fallback: AgentInfo[]
): AgentInfo[][] {
  const mapped = rows.map((row) => row.map((id) => getAgent(id)).filter(Boolean) as AgentInfo[]);
  if (mapped.some((row) => row.length > 0)) return mapped;
  return [
    fallback.filter((agent) => agent.id === "ceo"),
    fallback.filter((agent) => ["manager", "researcher-1", "researcher-2", "researcher-3", "reviewer"].includes(agent.id)),
    fallback.filter((agent) => ["worker-1", "worker-2", "worker-3", "editor", "designer"].includes(agent.id)),
  ];
}

function ConversationStream({ logs }: { logs: LogEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayed = showAll ? logs : logs.slice(-8);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [logs.length, showAll]);

  return (
    <div
      style={{
        border: "4px solid #31405f",
        borderRadius: 14,
        background: "#f7f1e7",
        boxShadow: "0 8px 0 rgba(49,64,95,0.22)",
        overflow: "hidden",
        minHeight: 278,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "7px 10px",
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

      <div ref={scrollRef} style={{ overflowY: "auto", padding: "10px 14px 12px", background: "#fff8f1", flex: 1 }}>
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
                  gridTemplateColumns: "54px 78px 1fr",
                  columnGap: 10,
                  alignItems: "start",
                  padding: "6px 0",
                  borderBottom: i === displayed.length - 1 ? "none" : "1px dashed rgba(49,64,95,0.18)",
                }}
              >
                <span style={{ fontSize: 9, color: "#64748b", fontWeight: 800, whiteSpace: "nowrap" }}>{log.time}</span>
                <span style={{ fontSize: 9, color: cfg.color, fontWeight: 900, whiteSpace: "nowrap" }}>{cfg.jaLabel}</span>
                <span style={{ fontSize: 10.5, color: "#334155", lineHeight: 1.6, fontWeight: 700, wordBreak: "break-word" }}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ZoneCard({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        border: "3px solid #31405f",
        borderRadius: 20,
        padding: "16px 12px 14px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.74) 0%, rgba(242,250,255,0.9) 100%)",
        boxShadow: "0 8px 0 rgba(49,64,95,0.14)",
        minHeight: 152,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 8,
          borderRadius: 14,
          border: `2px dashed ${accent}`,
          opacity: 0.34,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: accent }}>{title}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#51617c", marginTop: 2 }}>{subtitle}</div>
          </div>
          <div
            style={{
              minWidth: 28,
              height: 28,
              borderRadius: 999,
              background: "#fff8f1",
              border: "3px solid #31405f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              fontSize: 12,
              fontWeight: 900,
              boxShadow: "0 4px 0 rgba(49,64,95,0.14)",
            }}
          >
            →
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, flexWrap: "wrap", flex: 1 }}>
          {children}
        </div>
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
        { id: "researcher-1", role: "researcher", name: "Researcher News", status: "idle" as AgentStatus },
        { id: "researcher-2", role: "researcher", name: "Researcher Compare", status: "idle" as AgentStatus },
        { id: "researcher-3", role: "researcher", name: "Researcher Source", status: "idle" as AgentStatus },
        { id: "editor", role: "editor", name: "Editor", status: "idle" as AgentStatus },
        { id: "designer", role: "designer", name: "Designer", status: "idle" as AgentStatus },
      ];

  const lineup = lineupOrFallback([
    ["ceo"],
    ["manager", "researcher-1", "researcher-2", "researcher-3", "reviewer"],
    ["worker-1", "worker-2", "worker-3", "editor", "designer"],
  ], getAgent, all);
  const [topRow] = lineup;
  const zoneAgents = {
    research: all.filter((agent) => ["researcher-1", "researcher-2", "researcher-3"].includes(agent.id)),
    manager: all.filter((agent) => agent.id === "manager"),
    review: all.filter((agent) => agent.id === "reviewer"),
    build: all.filter((agent) => ["worker-1", "worker-2", "worker-3"].includes(agent.id)),
    creative: all.filter((agent) => ["editor", "designer"].includes(agent.id)),
  };

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

      <div style={{ position: "absolute", top: 32, left: 42, width: 96, height: 20, borderRadius: 999, background: "#ffffff", boxShadow: "22px 5px 0 0 #ffffff, 46px 0 0 0 #ffffff" }} />
      <div style={{ position: "absolute", top: 66, right: 118, width: 72, height: 16, borderRadius: 999, background: "#ffffff", boxShadow: "18px -4px 0 0 #ffffff, 38px 2px 0 0 #ffffff" }} />
      <div style={{ position: "absolute", top: 84, right: 58, width: 52, height: 12, borderRadius: 999, background: "#ffffff", boxShadow: "14px 0 0 0 #ffffff" }} />

      <div
        style={{
          position: "absolute",
          left: 40,
          top: 300,
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
          top: 334,
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
          top: 304,
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
          top: 342,
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
          top: 288,
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
          top: 286,
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
          top: 412,
          height: 34,
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
          top: 446,
          height: 46,
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
          top: 446,
          height: 46,
          opacity: 0.22,
          backgroundImage:
            "linear-gradient(90deg, transparent 0, transparent 10px, #6b3418 10px, #6b3418 12px, transparent 12px, transparent 36px, #6b3418 36px, #6b3418 38px, transparent 38px), linear-gradient(transparent 0, transparent 10px, #6b3418 10px, #6b3418 12px, transparent 12px)",
          backgroundSize: "48px 24px",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 70,
          top: 416,
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
        style={{ position: "absolute", top: 32, left: 238, zIndex: 1, pointerEvents: "none" }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={COIN_SPRITE} cellSize={4} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 52, left: 292, zIndex: 1, pointerEvents: "none" }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={COIN_SPRITE} cellSize={3.6} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 46, right: 154, zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, 6, 0], y: [0, -2, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={LAKITU_SPRITE} cellSize={4} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 102, right: 62, zIndex: 1, pointerEvents: "none" }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={PEACH_SPRITE} cellSize={3.4} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 110, left: 74, zIndex: 1, pointerEvents: "none" }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={BOWSER_SPRITE} cellSize={3.6} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 412, left: 198, zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={GOOMBA_SPRITE} cellSize={4} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 414, right: 204, zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, -5, 0] }}
        transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={GOOMBA_SPRITE} cellSize={3.6} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 416, left: 294, zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, 4, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={KOOPA_SPRITE} cellSize={3.8} />
      </motion.div>
      <motion.div
        style={{ position: "absolute", top: 468, right: 98, zIndex: 1, pointerEvents: "none" }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <PixelDecor pixels={PIRANHA_SPRITE} cellSize={4} />
      </motion.div>

      <div
        style={{
          position: "absolute",
          right: 106,
          top: 404,
          width: 54,
          height: 60,
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
          right: 98,
          top: 452,
          width: 66,
          height: 18,
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
          top: 500,
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
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "72px 12px 12px",
          minHeight: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: 510,
            borderRadius: 22,
            border: "3px solid rgba(49,64,95,0.18)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            boxShadow: "inset 0 -10px 16px rgba(255,255,255,0.18)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 18 }}>
            <ZoneCard title="CASTLE HQ" subtitle="社長エリア / 最終判断ポイント" accent="#8b5cf6">
              {topRow.map((agent) => (
                <CharacterUnit key={agent.id} agent={agent} />
              ))}
            </ZoneCard>
          </div>

          <div
            style={{
              position: "absolute",
              top: 126,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: "#31405f",
              background: "rgba(255,248,241,0.92)",
              padding: "5px 10px",
              borderRadius: 999,
              border: "3px solid #31405f",
              boxShadow: "0 4px 0 rgba(49,64,95,0.16)",
            }}
          >
            REPORT ROUTE
          </div>

          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: 156,
              display: "grid",
              gridTemplateColumns: "1.2fr 0.9fr 0.8fr",
              gap: 12,
            }}
          >
            <ZoneCard title="RESEARCH FIELD" subtitle="情報を集めて司令塔へ持ち帰る" accent="#06b6d4">
              {zoneAgents.research.map((agent) => (
                <CharacterUnit key={agent.id} agent={agent} />
              ))}
            </ZoneCard>
            <ZoneCard title="CONTROL TOWER" subtitle="進行管理してCEOへ報告" accent="#3b82f6">
              {zoneAgents.manager.map((agent) => (
                <CharacterUnit key={agent.id} agent={agent} />
              ))}
            </ZoneCard>
            <ZoneCard title="REVIEW GATE" subtitle="品質チェックして通す" accent="#22c55e">
              {zoneAgents.review.map((agent) => (
                <CharacterUnit key={agent.id} agent={agent} />
              ))}
            </ZoneCard>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 344,
              transform: "translateX(-50%)",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: "#31405f",
              background: "rgba(255,248,241,0.92)",
              padding: "5px 10px",
              borderRadius: 999,
              border: "3px solid #31405f",
              boxShadow: "0 4px 0 rgba(49,64,95,0.16)",
            }}
          >
            TASK ROUTE
          </div>

          <div
            style={{
              position: "absolute",
              left: 40,
              right: 40,
              top: 376,
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr",
              gap: 16,
            }}
          >
            <ZoneCard title="BUILD ZONE" subtitle="実装して素材を持って戻る" accent="#f97316">
              {zoneAgents.build.map((agent) => (
                <CharacterUnit key={agent.id} agent={agent} />
              ))}
            </ZoneCard>
            <ZoneCard title="CREATIVE HOUSE" subtitle="編集とデザインで整える" accent="#ec4899">
              {zoneAgents.creative.map((agent) => (
                <CharacterUnit key={agent.id} agent={agent} />
              ))}
            </ZoneCard>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
            gap: 12,
            alignItems: "stretch",
            minHeight: 286,
          }}
        >
          <div
            style={{
              border: "4px solid #31405f",
              borderRadius: 16,
              background: "linear-gradient(180deg, #fff8f1 0%, #f7efe2 100%)",
              boxShadow: "0 8px 0 rgba(49,64,95,0.18)",
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "#7f57f1", letterSpacing: "0.08em" }}>WAITING GAME</div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: "#51617c", fontWeight: 700 }}>
              会議室の下ステージで待機中に遊べます。`Space` でジャンプして甲羅やクリボーをよけます。
            </div>
            <WaitingGame active={isRunning} size="small" variant="embedded" />
          </div>

          <ConversationStream logs={logs} />
        </div>
      </div>
    </div>
  );
}
