"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
      initial={{ opacity: 0, y: 6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 3, scale: 0.92 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "relative",
        maxWidth: 120,
        minHeight: 34,
        padding: "5px 8px",
        border: `2px solid ${cfg.bubbleBorder}`,
        borderRadius: 7,
        background: cfg.bubbleBg,
        boxShadow: "0 3px 0 rgba(31,41,55,0.14)",
        imageRendering: "pixelated",
      }}
    >
      <div
        style={{
          fontSize: 9,
          lineHeight: 1.4,
          color: "#243042",
          fontWeight: 700,
          letterSpacing: "0.02em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
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
          bottom: -9,
          transform: "translateX(-50%)",
          width: 14,
          height: 9,
          background: cfg.bubbleBg,
          clipPath: "polygon(50% 100%, 0 0, 100% 0)",
          borderLeft: `2px solid ${cfg.bubbleBorder}`,
          borderRight: `2px solid ${cfg.bubbleBorder}`,
          borderBottom: `2px solid ${cfg.bubbleBorder}`,
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
        minWidth: 52,
        minHeight: 30,
        padding: "7px 10px",
        border: `2px solid ${cfg.bubbleBorder}`,
        borderRadius: 7,
        background: cfg.bubbleBg,
        display: "flex",
        justifyContent: "center",
        gap: 4,
        boxShadow: "0 3px 0 rgba(31,41,55,0.14)",
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
  if (agent.role === "manager") return { x: 12, y: -8, rotate: -2 };
  if (agent.role === "researcher") {
    const bias: Record<string, number> = {
      "researcher-1": 16,
      "researcher-2": 0,
      "researcher-3": -16,
    };
    const x = bias[agent.id] ?? 0;
    return { x, y: -10, rotate: x > 0 ? -2 : x < 0 ? 2 : 0 };
  }
  if (agent.role === "worker") {
    const bias: Record<string, number> = {
      "worker-1": 20,
      "worker-2": 4,
      "worker-3": -14,
    };
    const x = bias[agent.id] ?? 0;
    return { x, y: -12, rotate: x > 0 ? -3 : 2 };
  }
  if (agent.role === "editor") return { x: -8, y: -10, rotate: 2 };
  if (agent.role === "designer") return { x: 8, y: -10, rotate: -2 };
  if (agent.role === "reviewer") return { x: -8, y: -10, rotate: 2 };
  return { x: 0, y: -8, rotate: 0 };
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
      x: [0, 2, 0, -2, 0],
      y: [0, -6, -9, -4, 0],
      scale: [1, 1.03, 1.06, 1.02, 1],
      rotate: [0, -1, 0, 1, 0],
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
  const size = agent.role === "ceo" ? 2.9 : 2.2;
  const motionProfile = getTravelMotion(agent);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 44 }}>
      <div style={{ minHeight: 26, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
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
            background: "rgba(255,255,255,0.56)",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.72)",
            zIndex: active ? 3 : 1,
          }}
        >
          <PixelCharacter role={agent.role} status={agent.status} agentId={agent.id} size={size} />
        </motion.div>
      </div>

      <div
        style={{
          padding: "3px 7px 3px",
          borderRadius: 999,
          border: "1.5px solid #27324a",
          background: cfg.plate,
          boxShadow: "0 2px 0 rgba(39,50,74,0.2)",
          textAlign: "center",
          minWidth: 54,
        }}
      >
        <div style={{ fontSize: 7, fontWeight: 900, color: cfg.color, letterSpacing: "0.08em" }}>{cfg.jaLabel}</div>
        <div style={{ fontSize: 6.5, color: "#4b5563", marginTop: 1, fontWeight: 700 }}>{agent.name}</div>
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

function CompactLogStrip({ logs }: { logs: LogEntry[] }) {
  const recent = logs.slice(-3);

  return (
    <div
      style={{
        borderRadius: 18,
        background: "#f8fbff",
        border: "2px solid rgba(49,64,95,0.16)",
        boxShadow: "0 8px 18px rgba(49,64,95,0.08)",
        padding: "10px 12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: "#31405f" }}>LIVE LOG</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b" }}>{logs.length}件</span>
      </div>
      {recent.length === 0 ? (
        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>ここに最新の会話が3行まで表示されます</div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {recent.map((log, index) => {
            const cfg = ROLE_CONFIG[log.role] ?? ROLE_CONFIG.system;
            return (
              <div
                key={`${log.time}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 62px 1fr",
                  gap: 8,
                  alignItems: "start",
                  fontSize: 10.5,
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: "#64748b", fontWeight: 800 }}>{log.time}</span>
                <span style={{ color: cfg.color, fontWeight: 900 }}>{cfg.jaLabel}</span>
                <span
                  style={{
                    color: "#334155",
                    fontWeight: 700,
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      )}
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
        border: `2px solid ${accent}55`,
        borderRadius: 28,
        padding: "10px 10px 12px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(247,250,255,0.9) 100%)",
        boxShadow: "0 12px 24px rgba(49,64,95,0.08)",
        minHeight: 92,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 8,
          borderRadius: 22,
          border: `1px dashed ${accent}44`,
          opacity: 0.32,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", color: accent }}>{title}</div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: "#51617c", marginTop: 1 }}>{subtitle}</div>
          </div>
          <div
            style={{
              minWidth: 22,
              height: 22,
              borderRadius: 999,
              background: "rgba(255,248,241,0.88)",
              border: `1.5px solid ${accent}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              fontSize: 10,
              fontWeight: 900,
              boxShadow: "0 4px 10px rgba(49,64,95,0.06)",
            }}
          >
            →
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function StagePanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 360,
        borderRadius: 26,
        border: "1.5px solid rgba(49,64,95,0.14)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)",
        boxShadow: "inset 0 -8px 14px rgba(255,255,255,0.22)",
        overflow: "hidden",
        padding: "10px 10px 8px",
      }}
    >
      {children}
    </div>
  );
}

function FlowLines() {
  return (
    <svg
      viewBox="0 0 1000 430"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.75,
      }}
    >
      <path d="M500 88 C418 116, 334 144, 244 196" stroke="#9f7aea" strokeWidth="3" strokeDasharray="8 12" fill="none" strokeLinecap="round" />
      <path d="M500 88 C518 128, 530 152, 500 196" stroke="#60a5fa" strokeWidth="3" strokeDasharray="8 12" fill="none" strokeLinecap="round" />
      <path d="M500 88 C588 124, 688 144, 772 196" stroke="#4ade80" strokeWidth="3" strokeDasharray="8 12" fill="none" strokeLinecap="round" />
      <path d="M500 196 C444 240, 352 266, 286 308" stroke="#fb923c" strokeWidth="3" strokeDasharray="8 12" fill="none" strokeLinecap="round" />
      <path d="M500 196 C560 236, 648 266, 716 308" stroke="#f472b6" strokeWidth="3" strokeDasharray="8 12" fill="none" strokeLinecap="round" />
      <path d="M500 88 C494 170, 494 238, 500 306" stroke="rgba(49,64,95,0.22)" strokeWidth="2" strokeDasharray="6 14" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function MeetingRoom({ logs, agents, isRunning }: Props) {
  const BASE_W = 1120;
  const BASE_H = 560;
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState(1);

  useEffect(() => {
    const node = stageViewportRef.current;
    if (!node) return;

    const updateScale = () => {
      const { width, height } = node.getBoundingClientRect();
      if (!width || !height) return;

      const nextScale = Math.min(width / BASE_W, height / BASE_H, 1);
      setStageScale((prev) => (Math.abs(prev - nextScale) < 0.01 ? prev : nextScale));
    };

    updateScale();

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const scaledWidth = Math.round(BASE_W * stageScale);
  const scaledHeight = Math.round(BASE_H * stageScale);
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
        background: "linear-gradient(180deg, #77d6ff 0%, #8fe2ff 42%, #d8f5ff 43%, #d8f5ff 100%)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 6,
          border: "4px solid #7f57f1",
          borderRadius: 18,
          boxShadow: "inset 0 0 0 4px #ffe85d",
          pointerEvents: "none",
        }}
      />

      <div
        ref={stageViewportRef}
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          padding: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: scaledWidth,
            height: scaledHeight,
            maxWidth: "100%",
            maxHeight: "100%",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: BASE_W,
              height: BASE_H,
              transform: `scale(${stageScale})`,
              transformOrigin: "top left",
            }}
          >
            <StagePanel>
              <div
                style={{
                  position: "absolute",
                  inset: 12,
                  pointerEvents: "none",
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                  opacity: 0.18,
                }}
              />
              <div style={{ position: "absolute", top: 20, left: 26, width: 96, height: 20, borderRadius: 999, background: "#ffffff", boxShadow: "22px 5px 0 0 #ffffff, 46px 0 0 0 #ffffff" }} />
              <div style={{ position: "absolute", top: 52, right: 120, width: 72, height: 16, borderRadius: 999, background: "#ffffff", boxShadow: "18px -4px 0 0 #ffffff, 38px 2px 0 0 #ffffff" }} />
              <div style={{ position: "absolute", top: 68, right: 62, width: 52, height: 12, borderRadius: 999, background: "#ffffff", boxShadow: "14px 0 0 0 #ffffff" }} />

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 72,
                  height: 28,
                  background: "linear-gradient(180deg, #49b34d 0%, #49b34d 48%, #37983b 48%, #37983b 100%)",
                  borderTop: "4px solid #83de6b",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 26,
                  height: 46,
                  background: "linear-gradient(180deg, #d38a4a 0%, #d38a4a 50%, #b86a35 50%, #b86a35 100%)",
                  borderTop: "4px solid #f5b36c",
                  borderBottom: "4px solid #8a4d28",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 26,
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
                left: 50,
                bottom: 92,
                width: 220,
                height: 96,
                background: "#8ed36e",
                borderRadius: "50% 50% 0 0",
                boxShadow: "inset 0 -10px 0 #79c25a",
                opacity: 0.82,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 44,
                bottom: 88,
                width: 248,
                height: 110,
                background: "#9ce07f",
                borderRadius: "55% 55% 0 0",
                boxShadow: "inset 0 -10px 0 #84cb66",
                opacity: 0.84,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 112,
                width: 340,
                height: 116,
                background: "#b6a0d5",
                clipPath: "polygon(0 100%, 0 42%, 16% 20%, 36% 34%, 56% 12%, 78% 28%, 100% 18%, 100% 100%)",
                opacity: 0.72,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                bottom: 110,
                width: 360,
                height: 124,
                background: "#c7b3e4",
                clipPath: "polygon(0 100%, 0 32%, 22% 16%, 40% 6%, 58% 24%, 82% 18%, 100% 34%, 100% 100%)",
                opacity: 0.72,
              }}
            />

            <motion.div style={{ position: "absolute", top: 20, left: 250, zIndex: 1, pointerEvents: "none" }} animate={{ y: [0, -4, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
              <PixelDecor pixels={COIN_SPRITE} cellSize={4} />
            </motion.div>
            <motion.div style={{ position: "absolute", top: 40, left: 318, zIndex: 1, pointerEvents: "none" }} animate={{ y: [0, -5, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
              <PixelDecor pixels={COIN_SPRITE} cellSize={3.6} />
            </motion.div>
            <motion.div style={{ position: "absolute", top: 32, right: 146, zIndex: 1, pointerEvents: "none" }} animate={{ x: [0, 6, 0], y: [0, -2, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}>
              <PixelDecor pixels={LAKITU_SPRITE} cellSize={4} />
            </motion.div>
            <motion.div style={{ position: "absolute", top: 382, left: 118, zIndex: 1, pointerEvents: "none" }} animate={{ x: [0, 6, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
              <PixelDecor pixels={GOOMBA_SPRITE} cellSize={3.8} />
            </motion.div>
            <motion.div style={{ position: "absolute", top: 382, right: 126, zIndex: 1, pointerEvents: "none" }} animate={{ x: [0, -5, 0] }} transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}>
              <PixelDecor pixels={GOOMBA_SPRITE} cellSize={3.5} />
            </motion.div>
            <motion.div style={{ position: "absolute", bottom: 48, right: 84, zIndex: 1, pointerEvents: "none" }} animate={{ y: [0, -5, 0] }} transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}>
              <PixelDecor pixels={PIRANHA_SPRITE} cellSize={4} />
            </motion.div>

            <div
              style={{
                position: "absolute",
                top: 14,
                left: 18,
                padding: "7px 10px",
                borderRadius: 999,
                background: "rgba(255,248,241,0.94)",
                border: "3px solid #31405f",
                boxShadow: "0 4px 0 rgba(49,64,95,0.2)",
                fontSize: 10,
                fontWeight: 900,
                color: "#31405f",
                letterSpacing: "0.08em",
                zIndex: 2,
              }}
            >
              PIXEL STAGE {isRunning ? "1-1 RUNNING" : "1-1 READY"}
            </div>

            <div
              style={{
                position: "absolute",
                top: 58,
                left: 24,
                right: 24,
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 276px",
                gap: 16,
                alignItems: "start",
                zIndex: 2,
              }}
            >
              <CompactLogStrip logs={logs} />

              <div
                style={{
                  borderRadius: 18,
                  padding: "10px 12px 12px",
                  background: "#fff8f1",
                  border: "2px solid rgba(49,64,95,0.16)",
                  boxShadow: "0 8px 18px rgba(49,64,95,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: "#31405f" }}>ARCADE</span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "#64748b", letterSpacing: "0.08em" }}>AGENT MAP</span>
                </div>
                <WaitingGame active={isRunning} size="small" variant="embedded" compact />
              </div>
            </div>

            {/* Row 1: CEO — top:148, 高さ~120px → 下端~268 */}
            <div style={{ position: "absolute", left: 430, top: 148, width: 260, zIndex: 2 }}>
              <ZoneCard title="CASTLE HQ" subtitle="社長エリア / 最終判断ポイント" accent="#8b5cf6">
                {topRow.map((agent) => (
                  <CharacterUnit key={agent.id} agent={agent} />
                ))}
              </ZoneCard>
            </div>

            {/* Row 2: Research / Control / Review — top:288, gap 20px from row1 */}
            <div style={{ position: "absolute", left: 42, top: 288, width: 330, zIndex: 2 }}>
              <ZoneCard title="RESEARCH FIELD" subtitle="情報を集めて司令塔へ持ち帰る" accent="#06b6d4">
                {zoneAgents.research.map((agent) => (
                  <CharacterUnit key={agent.id} agent={agent} />
                ))}
              </ZoneCard>
            </div>
            <div style={{ position: "absolute", left: 430, top: 288, width: 250, zIndex: 2 }}>
              <ZoneCard title="CONTROL TOWER" subtitle="進行管理してCEOへ報告" accent="#3b82f6">
                {zoneAgents.manager.map((agent) => (
                  <CharacterUnit key={agent.id} agent={agent} />
                ))}
              </ZoneCard>
            </div>
            <div style={{ position: "absolute", right: 42, top: 288, width: 280, zIndex: 2 }}>
              <ZoneCard title="REVIEW GATE" subtitle="品質チェックして通す" accent="#22c55e">
                {zoneAgents.review.map((agent) => (
                  <CharacterUnit key={agent.id} agent={agent} />
                ))}
              </ZoneCard>
            </div>

            {/* Row 3: Build / Creative — top:412, gap ~12px from row2 */}
            <div style={{ position: "absolute", left: 90, top: 412, width: 310, zIndex: 2 }}>
              <ZoneCard title="BUILD ZONE" subtitle="実装して素材を持って戻る" accent="#f97316">
                {zoneAgents.build.map((agent) => (
                  <CharacterUnit key={agent.id} agent={agent} />
                ))}
              </ZoneCard>
            </div>
            <div style={{ position: "absolute", right: 90, top: 412, width: 310, zIndex: 2 }}>
              <ZoneCard title="CREATIVE HOUSE" subtitle="編集とデザインで整える" accent="#ec4899">
                {zoneAgents.creative.map((agent) => (
                  <CharacterUnit key={agent.id} agent={agent} />
                ))}
              </ZoneCard>
            </div>

            <div style={{ position: "absolute", inset: "128px 46px 60px", zIndex: 1 }}>
              <FlowLines />
            </div>
            </StagePanel>
          </div>
        </div>
      </div>
    </div>
  );
}
