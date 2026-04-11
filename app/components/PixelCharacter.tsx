"use client";

import { motion } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";

type AgentRole = "ceo" | "manager" | "worker" | "reviewer" | "researcher" | "designer" | "editor" | "system";
type AgentStatus = "idle" | "thinking" | "reviewing" | "done" | "waiting";
type PixelGrid = (string | null)[][];

interface Props {
  role: AgentRole;
  status: AgentStatus;
  agentId?: string;
  size?: number;
}

const P = {
  k: "#1d2438",
  w: "#ffffff",
  s: "#f4c7a1",
  br: "#7c4a2d",
  rd: "#d94b3d",
  rd2: "#b9382d",
  bl: "#2f67d8",
  gn: "#2fa84f",
  gn2: "#237d3a",
  yl: "#ffd558",
  yl2: "#d7a82b",
  pk: "#f39ac2",
  bn: "#8f5c36",
  bn2: "#5d391f",
  gr: "#e9edf7",
  gy: "#cfd6ea",
};

function spriteFromRows(rows: string[], palette: Record<string, string | null>): PixelGrid {
  return rows.map((row) => row.split("").map((cell) => palette[cell] ?? null));
}

const PALETTE = {
  ".": null,
  K: P.k,
  W: P.w,
  S: P.s,
  B: P.br,
  R: P.rd,
  D: P.rd2,
  U: P.bl,
  G: P.gn,
  H: P.gn2,
  Y: P.yl,
  O: P.yl2,
  P: P.pk,
  N: P.bn,
  M: P.bn2,
  C: P.gr,
  A: P.gy,
};

const MARIO = spriteFromRows([
  ".....RRRRRR.....",
  "....RRRRRRRR....",
  "....BBSSSK......",
  "...BSSSSSSK.....",
  "...BKBSSKSK.....",
  "...BSSSSSSK.....",
  "....KKSSSKK.....",
  "...UUURRUUU.....",
  "..UUUURRUUUU....",
  "..UUUURRUUUU....",
  "...SSS..SSS.....",
  "..SSSS..SSSS....",
  "..NN....NN......",
  ".NNN....NNN.....",
  "................",
  "................",
], PALETTE);

const LUIGI = spriteFromRows([
  ".....GGGGGG.....",
  "....GGGGGGGG....",
  "....BBSSSK......",
  "...BSSSSSSK.....",
  "...BKBSSKSK.....",
  "...BSSSSSSK.....",
  "....KKSSSKK.....",
  "...UUUGGUUU.....",
  "..UUUUGGUUUU....",
  "..UUUUGGUUUU....",
  "...SSS..SSS.....",
  "..SSSS..SSSS....",
  "..NN....NN......",
  ".NNN....NNN.....",
  "................",
  "................",
], PALETTE);

const GOOMBA = spriteFromRows([
  "................",
  ".....NNNNNN.....",
  "...NNNNNNNNNN...",
  "..NNNNNNNNNNNN..",
  "..NNWWNNNNWWNN..",
  ".NNNKWNNNNWKNN..",
  ".NNNNNNNNNNNNN..",
  ".NNNMMMMMMMMNN..",
  "..NNMMMMMMMMNN..",
  "...NNNNNNNNNN...",
  "...SS......SS...",
  "..SSSS....SSSS..",
  "..KKKK....KKKK..",
  "................",
  "................",
  "................",
], PALETTE);

const KOOPA = spriteFromRows([
  "......GGGG......",
  ".....GGGGGG.....",
  "....GGYYYYGG....",
  "...GYYYYYYYYG...",
  "...GYYKYYKYYG...",
  "...GYYYYYYYYG...",
  "...GGYYYYYYGG...",
  "....SSYYYYSS....",
  "...SSSSYYSSSS...",
  "...NNGGGGGGNN...",
  "..NNGGGGGGGGNN..",
  "..NNGGG..GGGNN..",
  "...NNN....NNN...",
  "................",
  "................",
  "................",
], PALETTE);

const LAKITU = spriteFromRows([
  "......GGGG......",
  ".....GGGGGG.....",
  "....GGYYYYGG....",
  "...GYYWWWWYYG...",
  "...GYYWKKWYYG...",
  "...GYYYYYYYYG...",
  ".....SSSS.......",
  "...CCCCCCCCCC...",
  "..CCCCCCCCCCCC..",
  ".CCCAAACCAAACCC.",
  ".CCCCCCCCCCCCCC.",
  "..CCCCCCCCCCCC..",
  "....CC....CC....",
  "................",
  "................",
  "................",
], PALETTE);

const PEACH = spriteFromRows([
  "......Y.Y.......",
  ".....YYYYY......",
  "....YYYYYYY.....",
  "....BBSSSBB.....",
  "...BSSSSSSSB....",
  "...BWWSSSWWB....",
  "...BSSSSSSSB....",
  "....KKSSSKK.....",
  ".....PPPP.......",
  "...PPPPPPPP.....",
  "..PPPPPPPPPP....",
  "..PPPPPPPPPP....",
  "...SSP..PSS.....",
  "..SSSS..SSSS....",
  "..NNN....NNN....",
  "................",
], PALETTE);

const YOSHI = spriteFromRows([
  ".......GG.......",
  "......GGGG......",
  ".....GGWWGG.....",
  "....GGWWWWGG....",
  "....GGWKKWGG....",
  ".....GGWWGG.....",
  "....GGSSSSGG....",
  "...GGSSSSSSGG...",
  "...GGGGPPGGGG...",
  "....GGGGGGGG....",
  "...SSGGGGGGSS...",
  "..SSSSGGGGSSSS..",
  "..NNN......NNN..",
  "................",
  "................",
  "................",
], PALETTE);

const TOAD = spriteFromRows([
  ".....WWWWWW.....",
  "...WWRRWWRRWW...",
  "..WWRRRRRRRRWW..",
  "..WRRWWWWWWRRW..",
  "..WWWWSSSSWWWW..",
  "...WWSSSSSSWW...",
  "...WWWKSSKWW....",
  "....WSSSSSSW....",
  ".....KKSSKK.....",
  ".....UUUUUU.....",
  "....UUUUUUUU....",
  "....SS....SS....",
  "...SSSS..SSSS...",
  "...NNN....NNN...",
  "................",
  "................",
], PALETTE);

const BLOCK = spriteFromRows([
  "..RRRRRRRRRR..",
  ".RROOOOOOOORR.",
  "RROORROORROORR",
  "RROOOOOOOOOORR",
  "RROORROORROORR",
  "RROOOOOOOOOORR",
  ".RROOOOOOOORR.",
  "..RRRRRRRRRR..",
], PALETTE);

function PixelGridView({ pixels, cellSize }: { pixels: PixelGrid; cellSize: number }) {
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

const IDLE_ANIM: TargetAndTransition = {
  y: [0, -3, 0],
  transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
};

const THINKING_ANIM: TargetAndTransition = {
  y: [0, -5, 0],
  transition: { duration: 0.55, repeat: Infinity, ease: "easeInOut" },
};

const REVIEWING_ANIM: TargetAndTransition = {
  rotate: [-3, 3, -3],
  transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
};

const DONE_ANIM: TargetAndTransition = {
  y: [0, -10, 0],
  transition: { duration: 0.38, ease: "backOut" },
};

const WAITING_ANIM: TargetAndTransition = {
  y: [0, -1.5, 0],
  transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
};

function pickSprite(role: AgentRole, agentId?: string): PixelGrid {
  if (role === "ceo") return MARIO;
  if (role === "manager") return LUIGI;
  if (role === "researcher") return LAKITU;
  if (role === "designer") return PEACH;
  if (role === "editor") return YOSHI;
  if (role === "reviewer") return TOAD;
  if (role === "worker") {
    if (agentId === "worker-2") return KOOPA;
    if (agentId === "worker-3") return BLOCK;
    return GOOMBA;
  }
  return BLOCK;
}

export default function PixelCharacter({ role, status, agentId, size = 4 }: Props) {
  const pixels = pickSprite(role, agentId);
  const animMap: Record<AgentStatus, TargetAndTransition> = {
    idle: IDLE_ANIM,
    thinking: THINKING_ANIM,
    reviewing: REVIEWING_ANIM,
    done: DONE_ANIM,
    waiting: WAITING_ANIM,
  };

  const isDone = status === "done";
  const isActive = status === "thinking" || status === "reviewing";

  const glowColor: Partial<Record<AgentRole, string>> = {
    ceo: "rgba(217,75,61,0.34)",
    manager: "rgba(47,168,79,0.34)",
    worker: "rgba(143,92,54,0.34)",
    reviewer: "rgba(255,213,88,0.30)",
    researcher: "rgba(255,255,255,0.38)",
    designer: "rgba(243,154,194,0.30)",
    editor: "rgba(47,168,79,0.30)",
  };

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {isActive && (
        <motion.div
          style={{
            position: "absolute",
            inset: -10,
            borderRadius: 12,
            background: `radial-gradient(circle, ${glowColor[role] ?? "rgba(127,87,241,0.28)"} 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {isDone && (
        <motion.div
          style={{ position: "absolute", top: -14, right: -10, fontSize: 16, lineHeight: 1 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: [0, 20, -20, 0] }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          ⭐
        </motion.div>
      )}

      <motion.div animate={animMap[status] ?? IDLE_ANIM} style={{ imageRendering: "pixelated" }}>
        <PixelGridView pixels={pixels} cellSize={size} />
      </motion.div>
    </div>
  );
}
