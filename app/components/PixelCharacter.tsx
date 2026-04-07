"use client";

import { motion } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";

type AgentRole   = "ceo" | "manager" | "worker" | "reviewer" | "system";
type AgentStatus = "idle" | "thinking" | "reviewing" | "done" | "waiting";

interface Props {
  role: AgentRole;
  status: AgentStatus;
  agentId?: string;
  size?: number;
}

// ─── ピクセルカラー定義 ──────────────────────────────────────────

const P = {
  // 共通
  sk: "#f5c49a", // 肌
  sk2: "#e8a870", // 肌影
  bk: "#1a1a2e", // アウトライン
  wh: "#f8f8f8", // 白
  ey: "#1a1a2e", // 目

  // CEO（紫）
  cH: "#7c3aed", // 帽子・スーツ
  cH2: "#5b21b6",
  cA: "#c4b5fd", // アクセント
  cT: "#f59e0b", // クラウン

  // Manager（青）
  mH: "#1d4ed8",
  mH2: "#1e40af",
  mA: "#93c5fd",
  mG: "#e2e8f0", // メガネ

  // Worker（オレンジ）
  wH: "#c2410c",
  wH2: "#9a3412",
  wA: "#fed7aa",
  wT: "#fbbf24", // ヘルメット

  // Reviewer（緑）
  rH: "#065f46",
  rH2: "#064e3b",
  rA: "#6ee7b7",
  rC: "#047857", // クリップボード

  // System
  sys: "#475569",
};

// ─── 16×16 ドット絵データ（1セル＝1色コード） ───────────────────
// null = 透明

type PixelGrid = (string | null)[][];

// CEO: 紫スーツ + 王冠
const CEO_PIXELS: PixelGrid = [
  [null,null,null,null,null,P.cT,null,P.cT,null,P.cT,null,null,null,null,null,null],
  [null,null,null,null,P.cT,P.cT,P.cT,P.cT,P.cT,P.cT,P.cT,null,null,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.ey,P.sk,P.sk,P.sk,P.sk,P.ey,P.sk,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk2,P.sk,P.sk2,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,P.bk,P.cA,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cA,P.bk,null,null],
  [null,P.cH,P.cH,P.cH,P.cH,P.wh,P.cH,P.cH,P.cH,P.cH,P.wh,P.cH,P.cH,P.cH,null,null],
  [null,P.cH,P.cA,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cA,P.cH,null,null],
  [null,P.cH2,P.cH,P.cH,null,null,null,null,null,null,null,P.cH,P.cH,P.cH2,null,null],
  [null,null,P.cH2,P.cH,null,null,null,null,null,null,null,P.cH,P.cH2,null,null,null],
  [null,null,P.cH,P.cH2,null,null,null,null,null,null,null,P.cH2,P.cH,null,null,null],
  [null,null,P.cH,P.cH,null,null,null,null,null,null,null,null,P.cH,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
];

// Manager: 青コート + メガネ
const MANAGER_PIXELS: PixelGrid = [
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  [null,null,null,P.bk,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.bk,null,null,null,null],
  [null,null,P.bk,P.mH,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.mH,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.mG,P.mG,P.sk,P.sk,P.mG,P.mG,P.sk,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.mG,P.ey,P.mG,P.mG,P.mG,P.ey,P.mG,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk2,P.sk,P.bk,P.sk2,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,P.bk,P.mA,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mA,P.bk,null,null],
  [null,P.mH,P.mH,P.mH,P.rC,P.rC,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,null,null],
  [null,P.mH,P.mA,P.mH,P.rC,P.rC,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mA,P.mH,null,null],
  [null,P.mH2,P.mH,P.mH,null,null,null,null,null,null,null,P.mH,P.mH,P.mH2,null,null],
  [null,null,P.mH2,P.mH,null,null,null,null,null,null,null,P.mH,P.mH2,null,null,null],
  [null,null,P.mH,P.mH2,null,null,null,null,null,null,null,P.mH2,P.mH,null,null,null],
  [null,null,P.mH,P.mH,null,null,null,null,null,null,null,null,P.mH,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
];

// Worker: オレンジ作業着 + ヘルメット
const WORKER_PIXELS: PixelGrid = [
  [null,null,null,null,null,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,null,null,null,null,null],
  [null,null,null,null,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,null,null,null,null],
  [null,null,null,P.bk,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.ey,P.sk,P.sk,P.sk,P.sk,P.ey,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk2,P.sk,P.bk,P.sk2,P.sk,P.sk,P.wA,P.sk,P.bk,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null],
  [null,P.bk,P.wA,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wA,P.bk,null,null],
  [null,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,null,null],
  [null,P.wH,P.wA,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wA,P.wH,null,null],
  [null,P.wH2,P.wH,P.wH,null,null,P.wA,null,null,P.wA,null,P.wH,P.wH,P.wH2,null,null],
  [null,null,P.wH2,P.wH,null,null,null,null,null,null,null,P.wH,P.wH2,null,null,null],
  [null,null,P.wH,P.wH2,null,null,null,null,null,null,null,P.wH2,P.wH,null,null,null],
  [null,null,P.wH,P.wH,null,null,null,null,null,null,null,null,P.wH,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
];

// Reviewer: 緑チェックコート + クリップボード
const REVIEWER_PIXELS: PixelGrid = [
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  [null,null,null,P.bk,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.bk,null,null,null,null],
  [null,null,P.bk,P.rA,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.rA,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.ey,P.sk,P.sk,P.sk,P.sk,P.ey,P.sk,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk2,P.sk,P.rA,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,P.bk,P.rA,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rA,P.bk,null,null],
  [null,P.rH,P.rH,P.rH,P.rC,P.rC,P.rC,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,null,null],
  [null,P.rH,P.rA,P.rH,P.rC,P.rA,P.rC,P.rH,P.rH,P.rH,P.rH,P.rH,P.rA,P.rH,null,null],
  [null,P.rH2,P.rH,P.rH,P.rC,P.rC,P.rC,null,null,null,null,P.rH,P.rH,P.rH2,null,null],
  [null,null,P.rH2,P.rH,null,null,null,null,null,null,null,P.rH,P.rH2,null,null,null],
  [null,null,P.rH,P.rH2,null,null,null,null,null,null,null,P.rH2,P.rH,null,null,null],
  [null,null,P.rH,P.rH,null,null,null,null,null,null,null,null,P.rH,null,null,null],
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
];

// ─── ピクセルグリッド描画 ────────────────────────────────────────

function PixelGrid({ pixels, cellSize }: { pixels: PixelGrid; cellSize: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, imageRendering: "pixelated" }}>
      {pixels.map((row, y) => (
        <div key={y} style={{ display: "flex" }}>
          {row.map((color, x) => (
            <div key={x} style={{
              width: cellSize, height: cellSize,
              background: color ?? "transparent",
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── アニメーション variant ──────────────────────────────────────

const IDLE_ANIM: TargetAndTransition = {
  y: [0, -2, 0],
  transition: { duration: 2.0, repeat: Infinity, ease: "easeInOut" },
};

const THINKING_ANIM: TargetAndTransition = {
  y: [0, -4, 0],
  transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
};

const REVIEWING_ANIM: TargetAndTransition = {
  rotate: [-2, 2, -2],
  transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
};

const DONE_ANIM: TargetAndTransition = {
  y: [0, -8, 0],
  transition: { duration: 0.35, ease: "backOut" },
};

const WAITING_ANIM: TargetAndTransition = {
  y: [0, -1, 0],
  transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
};

// ─── メインコンポーネント ────────────────────────────────────────

export default function PixelCharacter({ role, status, size = 3 }: Props) {
  const pixelMap: Partial<Record<AgentRole, PixelGrid>> = {
    ceo:      CEO_PIXELS,
    manager:  MANAGER_PIXELS,
    worker:   WORKER_PIXELS,
    reviewer: REVIEWER_PIXELS,
  };

  const pixels = pixelMap[role] ?? CEO_PIXELS;

  const animMap: Record<AgentStatus, TargetAndTransition> = {
    idle:      IDLE_ANIM,
    thinking:  THINKING_ANIM,
    reviewing: REVIEWING_ANIM,
    done:      DONE_ANIM,
    waiting:   WAITING_ANIM,
  };

  const anim = animMap[status] ?? IDLE_ANIM;

  // 完了時の光エフェクト
  const isDone = status === "done";
  const isActive = status === "thinking" || status === "reviewing";

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {/* アクティブグロー */}
      {isActive && (
        <motion.div style={{
          position: "absolute", inset: -8,
          borderRadius: 8,
          background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
        }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* 完了スター */}
      {isDone && (
        <motion.div
          style={{
            position: "absolute", top: -12, right: -8,
            fontSize: 14, lineHeight: 1,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: [0, 15, -15, 0] }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          ⭐
        </motion.div>
      )}

      <motion.div animate={anim} style={{ imageRendering: "pixelated" }}>
        <PixelGrid pixels={pixels} cellSize={size} />
      </motion.div>
    </div>
  );
}
