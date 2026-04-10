"use client";

import { motion } from "framer-motion";
import type { TargetAndTransition } from "framer-motion";

type AgentRole   = "ceo" | "manager" | "worker" | "reviewer" | "researcher" | "designer" | "editor" | "system";
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
  sk:  "#f9c8a8", // 肌（明るめ）
  sk2: "#e8a870", // 肌影
  bk:  "#1a1a2e", // アウトライン
  wh:  "#ffffff", // ハイライト
  bl:  "#f9a8d4", // ほっぺ

  // CEO（紫）
  cH:  "#7c3aed",
  cH2: "#5b21b6",
  cA:  "#ddd6fe",
  cT:  "#fbbf24", // 王冠

  // Manager（青）
  mH:  "#2563eb",
  mH2: "#1e40af",
  mA:  "#bfdbfe",

  // Worker（オレンジ）
  wH:  "#ea580c",
  wH2: "#9a3412",
  wA:  "#fed7aa",
  wT:  "#fbbf24", // ヘルメット

  // Reviewer（緑）
  rH:  "#065f46",
  rH2: "#064e3b",
  rA:  "#a7f3d0",

  // Researcher（シアン）
  reH:  "#0e7490",
  reH2: "#155e75",
  reA:  "#a5f3fc",

  // Designer（ピンク）
  dH:  "#be185d",
  dH2: "#831843",
  dA:  "#fbcfe8",

  // Editor（黄緑）
  edH:  "#4d7c0f",
  edH2: "#365314",
  edA:  "#d9f99d",

  // System
  sys: "#475569",
};

// ─── 16×16 ドット絵（パワーパフガールズ風）───────────────────────
// 大きな丸頭・巨大な目・シンプルなドレスボディ
// null = 透明

type PixelGrid = (string | null)[][];

// CEO: 紫ドレス + 王冠 + 長めのロングヘア
const CEO_PIXELS: PixelGrid = [
  [null,null,null,null,P.cT,null,P.cT,P.cT,P.cT,null,P.cT,null,null,null,null,null],
  [null,null,null,P.bk,P.cT,P.cT,P.cT,P.cT,P.cT,P.cT,P.cT,P.bk,null,null,null,null],
  [null,null,P.bk,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.bk,null,null,null],
  [null,P.bk,P.cH,P.cH,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.cH,P.cH,P.cH,P.bk,null,null],
  [null,P.bk,P.cH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.cH,P.bk,null,null],
  [null,P.bk,P.cH,P.sk,P.bk,P.wh,P.bk,P.sk,P.bk,P.wh,P.bk,P.sk,P.cH,P.bk,null,null],
  [null,P.bk,P.cH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.cH,P.bk,null,null],
  [null,P.bk,P.sk,P.bl,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bl,P.sk,P.sk,P.bk,null,null],
  [null,P.bk,P.sk,P.sk,P.sk,P.bk,P.bk,P.bk,P.bk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,null,P.bk,P.cA,P.cA,P.cA,P.cA,P.cA,P.cA,P.cA,P.cA,P.cA,P.bk,null,null,null],
  [null,P.bk,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.bk,null,null],
  [null,P.bk,P.cH,P.cH,P.cA,P.cH,P.cH,P.cH,P.cH,P.cA,P.cH,P.cH,P.cH,P.bk,null,null],
  [null,null,P.bk,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.cH,P.bk,null,null,null],
  [null,null,null,P.bk,P.cH2,P.cH2,P.cH2,P.cH2,P.cH2,P.cH2,P.cH2,P.bk,null,null,null,null],
];

// Manager: 青ドレス + ヘッドセット
const MANAGER_PIXELS: PixelGrid = [
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  [null,null,null,null,P.mA,P.mH,P.mH,P.mH,P.mH,P.mH,P.mA,null,null,null,null,null],
  [null,null,P.bk,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.bk,null,null,null],
  [null,P.bk,P.mH,P.mH,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.mH,P.mH,P.mH,P.bk,null,null],
  [P.mA,P.bk,P.mH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.mH,P.bk,P.mA,null],
  [P.mH,P.bk,P.mH,P.sk,P.bk,P.wh,P.bk,P.sk,P.bk,P.wh,P.bk,P.sk,P.mH,P.bk,P.mH,null],
  [P.mA,P.bk,P.mH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.mH,P.bk,P.mA,null],
  [null,P.bk,P.sk,P.bl,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bl,P.sk,P.sk,P.bk,null,null],
  [null,P.bk,P.sk,P.sk,P.sk,P.bk,P.bk,P.bk,P.bk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,null,P.bk,P.mA,P.mA,P.mA,P.mA,P.mA,P.mA,P.mA,P.mA,P.mA,P.bk,null,null,null],
  [null,P.bk,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.bk,null,null],
  [null,P.bk,P.mH,P.mH,P.mA,P.mH,P.mH,P.mH,P.mH,P.mA,P.mH,P.mH,P.mH,P.bk,null,null],
  [null,null,P.bk,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.mH,P.bk,null,null,null],
  [null,null,null,P.bk,P.mH2,P.mH2,P.mH2,P.mH2,P.mH2,P.mH2,P.mH2,P.bk,null,null,null,null],
];

// Worker: オレンジドレス + ヘルメット
const WORKER_PIXELS: PixelGrid = [
  [null,null,null,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,null,null,null],
  [null,null,P.bk,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.wT,P.bk,null,null,null],
  [null,null,P.bk,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.bk,null,null,null],
  [null,P.bk,P.wH,P.wH,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.wH,P.wH,P.wH,P.bk,null,null],
  [null,P.bk,P.wH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.wH,P.bk,null,null],
  [null,P.bk,P.wH,P.sk,P.bk,P.wh,P.bk,P.sk,P.bk,P.wh,P.bk,P.sk,P.wH,P.bk,null,null],
  [null,P.bk,P.wH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.wH,P.bk,null,null],
  [null,P.bk,P.sk,P.bl,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bl,P.sk,P.sk,P.bk,null,null],
  [null,P.bk,P.sk,P.sk,P.sk,P.bk,P.bk,P.bk,P.bk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,null,P.bk,P.wA,P.wA,P.wA,P.wA,P.wA,P.wA,P.wA,P.wA,P.wA,P.bk,null,null,null],
  [null,P.bk,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.bk,null,null],
  [null,P.bk,P.wH,P.wH,P.wA,P.wH,P.wH,P.wH,P.wH,P.wA,P.wH,P.wH,P.wH,P.bk,null,null],
  [null,null,P.bk,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.wH,P.bk,null,null,null],
  [null,null,null,P.bk,P.wH2,P.wH2,P.wH2,P.wH2,P.wH2,P.wH2,P.wH2,P.bk,null,null,null,null],
];

// Reviewer: 緑ドレス + ショートヘア
const REVIEWER_PIXELS: PixelGrid = [
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  [null,null,null,P.bk,P.rA,P.rH,P.rH,P.rH,P.rH,P.rH,P.rA,P.bk,null,null,null,null],
  [null,null,P.bk,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.bk,null,null,null],
  [null,P.bk,P.rH,P.rH,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.rH,P.rH,P.rH,P.bk,null,null],
  [null,P.bk,P.rH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.rH,P.bk,null,null],
  [null,P.bk,P.rH,P.sk,P.bk,P.wh,P.bk,P.sk,P.bk,P.wh,P.bk,P.sk,P.rH,P.bk,null,null],
  [null,P.bk,P.rH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.rH,P.bk,null,null],
  [null,P.bk,P.sk,P.bl,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bl,P.sk,P.sk,P.bk,null,null],
  [null,P.bk,P.sk,P.sk,P.sk,P.bk,P.bk,P.bk,P.bk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,null,P.bk,P.rA,P.rA,P.rA,P.rA,P.rA,P.rA,P.rA,P.rA,P.rA,P.bk,null,null,null],
  [null,P.bk,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.bk,null,null],
  [null,P.bk,P.rH,P.rH,P.rA,P.rH,P.rH,P.rH,P.rH,P.rA,P.rH,P.rH,P.rH,P.bk,null,null],
  [null,null,P.bk,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.rH,P.bk,null,null,null],
  [null,null,null,P.bk,P.rH2,P.rH2,P.rH2,P.rH2,P.rH2,P.rH2,P.rH2,P.bk,null,null,null,null],
];

// Researcher: シアンドレス + ロングヘア
const RESEARCHER_PIXELS: PixelGrid = [
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  [null,null,null,null,P.reA,P.reH,P.reH,P.reH,P.reH,P.reH,P.reA,null,null,null,null,null],
  [null,null,P.bk,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.bk,null,null,null],
  [null,P.bk,P.reH,P.reH,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.reH,P.reH,P.reH,P.bk,null,null],
  [null,P.bk,P.reH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.reH,P.bk,null,null],
  [null,P.bk,P.reH,P.sk,P.bk,P.wh,P.bk,P.sk,P.bk,P.wh,P.bk,P.sk,P.reH,P.bk,null,null],
  [null,P.bk,P.reH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.reH,P.bk,null,null],
  [null,P.bk,P.sk,P.bl,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bl,P.sk,P.sk,P.bk,null,null],
  [null,P.bk,P.sk,P.sk,P.sk,P.bk,P.bk,P.bk,P.bk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,null,P.bk,P.reA,P.reA,P.reA,P.reA,P.reA,P.reA,P.reA,P.reA,P.reA,P.bk,null,null,null],
  [null,P.bk,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.bk,null,null],
  [null,P.bk,P.reH,P.reH,P.reA,P.reH,P.reH,P.reH,P.reH,P.reA,P.reH,P.reH,P.reH,P.bk,null,null],
  [null,null,P.bk,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.reH,P.bk,null,null,null],
  [null,null,null,P.bk,P.reH2,P.reH2,P.reH2,P.reH2,P.reH2,P.reH2,P.reH2,P.bk,null,null,null,null],
];

// Designer: ピンクドレス + ツインテール
const DESIGNER_PIXELS: PixelGrid = [
  [null,null,P.dA,null,null,null,null,null,null,null,null,null,P.dA,null,null,null],
  [null,P.bk,P.dH,P.bk,P.dA,P.dH,P.dH,P.dH,P.dH,P.dH,P.dA,P.bk,P.dH,P.bk,null,null],
  [null,P.dH,P.bk,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.bk,P.dH,null,null],
  [null,P.bk,P.dH,P.dH,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.dH,P.dH,P.dH,P.bk,null,null],
  [null,P.bk,P.dH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.dH,P.bk,null,null],
  [null,P.bk,P.dH,P.sk,P.bk,P.wh,P.bk,P.sk,P.bk,P.wh,P.bk,P.sk,P.dH,P.bk,null,null],
  [null,P.bk,P.dH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.dH,P.bk,null,null],
  [null,P.bk,P.sk,P.bl,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bl,P.sk,P.sk,P.bk,null,null],
  [null,P.bk,P.sk,P.sk,P.sk,P.bk,P.bk,P.bk,P.bk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,null,P.bk,P.dA,P.dA,P.dA,P.dA,P.dA,P.dA,P.dA,P.dA,P.dA,P.bk,null,null,null],
  [null,P.bk,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.bk,null,null],
  [null,P.bk,P.dH,P.dH,P.dA,P.dH,P.dH,P.dH,P.dH,P.dA,P.dH,P.dH,P.dH,P.bk,null,null],
  [null,null,P.bk,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.dH,P.bk,null,null,null],
  [null,null,null,P.bk,P.dH2,P.dH2,P.dH2,P.dH2,P.dH2,P.dH2,P.dH2,P.bk,null,null,null,null],
];

// Editor: 黄緑ドレス + ハイライトヘア
const EDITOR_PIXELS: PixelGrid = [
  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  [null,null,null,P.bk,P.edH,P.edA,P.edH,P.edH,P.edH,P.edA,P.edH,P.bk,null,null,null,null],
  [null,null,P.bk,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.bk,null,null,null],
  [null,P.bk,P.edH,P.edH,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.edH,P.edH,P.edH,P.bk,null,null],
  [null,P.bk,P.edH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.edH,P.bk,null,null],
  [null,P.bk,P.edH,P.sk,P.bk,P.wh,P.bk,P.sk,P.bk,P.wh,P.bk,P.sk,P.edH,P.bk,null,null],
  [null,P.bk,P.edH,P.sk,P.bk,P.bk,P.bk,P.sk,P.bk,P.bk,P.bk,P.sk,P.edH,P.bk,null,null],
  [null,P.bk,P.sk,P.bl,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bl,P.sk,P.sk,P.bk,null,null],
  [null,P.bk,P.sk,P.sk,P.sk,P.bk,P.bk,P.bk,P.bk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null],
  [null,null,P.bk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.sk,P.bk,null,null,null],
  [null,null,null,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,P.bk,null,null,null,null],
  [null,null,P.bk,P.edA,P.edA,P.edA,P.edA,P.edA,P.edA,P.edA,P.edA,P.edA,P.bk,null,null,null],
  [null,P.bk,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.bk,null,null],
  [null,P.bk,P.edH,P.edH,P.edA,P.edH,P.edH,P.edH,P.edH,P.edA,P.edH,P.edH,P.edH,P.bk,null,null],
  [null,null,P.bk,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.edH,P.bk,null,null,null],
  [null,null,null,P.bk,P.edH2,P.edH2,P.edH2,P.edH2,P.edH2,P.edH2,P.edH2,P.bk,null,null,null,null],
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
  y: [0, -3, 0],
  transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
};

const THINKING_ANIM: TargetAndTransition = {
  y: [0, -5, 0],
  transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
};

const REVIEWING_ANIM: TargetAndTransition = {
  rotate: [-3, 3, -3],
  transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" },
};

const DONE_ANIM: TargetAndTransition = {
  y: [0, -10, 0],
  transition: { duration: 0.38, ease: "backOut" },
};

const WAITING_ANIM: TargetAndTransition = {
  y: [0, -1.5, 0],
  transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
};

// ─── メインコンポーネント ────────────────────────────────────────

export default function PixelCharacter({ role, status, size = 4 }: Props) {
  const pixelMap: Partial<Record<AgentRole, PixelGrid>> = {
    ceo:        CEO_PIXELS,
    manager:    MANAGER_PIXELS,
    worker:     WORKER_PIXELS,
    reviewer:   REVIEWER_PIXELS,
    researcher: RESEARCHER_PIXELS,
    designer:   DESIGNER_PIXELS,
    editor:     EDITOR_PIXELS,
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

  const isDone = status === "done";
  const isActive = status === "thinking" || status === "reviewing";

  // ロールカラーマップ（グロー色）
  const glowColor: Partial<Record<AgentRole, string>> = {
    ceo:        "rgba(124,58,237,0.5)",
    manager:    "rgba(37,99,235,0.5)",
    worker:     "rgba(234,88,12,0.5)",
    reviewer:   "rgba(6,95,70,0.5)",
    researcher: "rgba(14,116,144,0.5)",
    designer:   "rgba(190,24,93,0.5)",
    editor:     "rgba(77,124,15,0.5)",
  };

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {/* アクティブグロー */}
      {isActive && (
        <motion.div style={{
          position: "absolute", inset: -10,
          borderRadius: 12,
          background: `radial-gradient(circle, ${glowColor[role] ?? "rgba(99,102,241,0.4)"} 0%, transparent 70%)`,
        }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 1.0, repeat: Infinity }}
        />
      )}

      {/* 完了スター */}
      {isDone && (
        <motion.div
          style={{
            position: "absolute", top: -14, right: -10,
            fontSize: 16, lineHeight: 1,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: [0, 20, -20, 0] }}
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
