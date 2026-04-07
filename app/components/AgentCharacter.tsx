"use client";

import { motion } from "framer-motion";
import type { AgentRole, AgentStatus } from "../types/agent";
import type { Transition } from "framer-motion";

interface Props { role: AgentRole; status: AgentStatus; agentId?: string; }

type AnimState = { scaleY?: number[]; y?: number[]; rotate?: number[]; transition?: Transition };

const breathe: Record<AgentStatus, AnimState> = {
  idle:      { y: [0, -1.5, 0],   transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut" as const } },
  thinking:  { y: [0, -5, 0],     transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const } },
  done:      { y: [0, -12, 0],    transition: { duration: 0.4, ease: "backOut" as const } },
  waiting:   { y: [0, -0.8, 0],   transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const } },
  reviewing: { rotate: [-0.8, 0.8, -0.8], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const } },
};

// ─── 完了バッジ ────────────────────────────────────────────────────
function DoneBadge({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      style={{ transformOrigin: `${x}px ${y}px` }}>
      <circle cx={x} cy={y} r="8" fill={color} />
      <circle cx={x} cy={y} r="8" fill="none" stroke="white" strokeWidth="0.8" opacity="0.5" />
      <path d={`M${x-3.5} ${y} L${x-0.5} ${y+3} L${x+4} ${y-3.5}`}
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </motion.g>
  );
}

// ─── CEO ─────────────────────────────────────────────────────────
// 銀紫ウェーブショートヘア / 紫目 / 白シャツ+スーツベスト

function CeoCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking";
  const isDone   = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="ceoBg" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ceoSkin" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fff0e0" />
          <stop offset="60%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f5c49a" />
        </radialGradient>
        <linearGradient id="ceoHairBase" x1="0" y1="0" x2="0.3" y2="1">
          <stop stopColor="#e2d9f3" />
          <stop offset="0.4" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="ceoHairShine" x1="0" y1="0" x2="1" y2="0.5">
          <stop stopColor="#f5f0ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ceoCloth" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#312e81" />
        </linearGradient>
        <filter id="ceoBlur">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* 背景グロー */}
      <ellipse cx="50" cy="80" rx="40" ry="35" fill="url(#ceoBg)" />

      {/* 後ろ髪（レイヤー） */}
      <path d="M28 46 Q20 60 22 95 Q26 100 30 96 Q28 72 34 54 Z" fill="#a78bfa" opacity="0.7" />
      <path d="M72 46 Q80 60 78 95 Q74 100 70 96 Q72 72 66 54 Z" fill="#a78bfa" opacity="0.7" />
      <path d="M24 50 Q16 68 18 100 Q21 104 24 101 Q22 76 28 58 Z" fill="#7c3aed" opacity="0.5" />
      <path d="M76 50 Q84 68 82 100 Q79 104 76 101 Q78 76 72 58 Z" fill="#7c3aed" opacity="0.5" />

      {/* 首 */}
      <path d="M42 70 Q42 82 44 86 L56 86 Q58 82 58 70 Z" fill="url(#ceoSkin)" />
      {/* 首の影 */}
      <path d="M44 74 Q44 80 46 84 L54 84 Q56 80 56 74 Z" fill="#e8c9a0" opacity="0.4" />

      {/* 服 */}
      <path d="M18 130 Q20 95 36 88 L50 92 L64 88 Q80 95 82 130 Z" fill="url(#ceoCloth)" />
      {/* 白シャツ */}
      <path d="M40 88 L50 94 L60 88 L58 130 L42 130 Z" fill="#f8fafc" opacity="0.95" />
      {/* ネクタイ */}
      <path d="M48 90 L50 88 L52 90 L51 108 L50 110 L49 108 Z" fill="#a855f7" />
      <path d="M48 90 L50 88 L52 90 L50 94 Z" fill="#7c3aed" />
      {/* スーツラペル */}
      <path d="M36 88 Q40 92 44 96 L42 130 L18 130 Q20 95 36 88 Z" fill="#1e1b4b" />
      <path d="M64 88 Q60 92 56 96 L58 130 L82 130 Q80 95 64 88 Z" fill="#1e1b4b" />

      {/* 顔 */}
      <ellipse cx="50" cy="50" rx="22" ry="24" fill="url(#ceoSkin)" />
      {/* 顔の陰 */}
      <ellipse cx="50" cy="56" rx="18" ry="16" fill="#f0cfa0" opacity="0.15" />

      {/* 前髪 */}
      <path d="M28 44 Q30 26 50 24 Q70 26 72 44 Q66 32 50 32 Q34 32 28 44 Z" fill="url(#ceoHairBase)" />
      {/* 前髪の流れ */}
      <path d="M28 44 Q25 38 27 50 Q30 42 32 48 Z" fill="#c4b5fd" opacity="0.8" />
      <path d="M72 44 Q75 38 73 50 Q70 42 68 48 Z" fill="#c4b5fd" opacity="0.8" />
      {/* 前髪の細かい流れ */}
      <path d="M36 28 Q34 22 40 30 Q36 26 36 28 Z" fill="#e2d9f3" opacity="0.9" />
      <path d="M50 24 Q48 18 54 24 Q52 20 50 24 Z" fill="#f5f0ff" opacity="0.8" />
      <path d="M60 28 Q64 22 62 30 Q62 26 60 28 Z" fill="#e2d9f3" opacity="0.9" />
      {/* 毛束ハイライト */}
      <path d="M36 28 Q38 24 44 32 Q40 26 36 28 Z" fill="url(#ceoHairShine)" opacity="0.6" />
      <path d="M52 24 Q56 20 60 28 Q56 22 52 24 Z" fill="url(#ceoHairShine)" opacity="0.5" />

      {/* 耳 */}
      <ellipse cx="28" cy="51" rx="3.5" ry="4.5" fill="#fddcb5" />
      <ellipse cx="28" cy="51" rx="2" ry="2.8" fill="#f5c49a" opacity="0.5" />
      <ellipse cx="72" cy="51" rx="3.5" ry="4.5" fill="#fddcb5" />
      <ellipse cx="72" cy="51" rx="2" ry="2.8" fill="#f5c49a" opacity="0.5" />

      {/* 眉毛 */}
      <path d="M36 41 Q40 38.5 44 40" stroke="#8b6fb5" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M56 40 Q60 38.5 64 41" stroke="#8b6fb5" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* 目（左） */}
      <ellipse cx="40" cy="48" rx="6" ry="5.5" fill="white" />
      <ellipse cx="40" cy="48.5" rx="4.5" ry="4.8" fill="#6d28d9" />
      <ellipse cx="40" cy="49" rx="3" ry="3.2" fill="#4c1d95" />
      <circle  cx="40" cy="49" r="1.5" fill="#1e0a40" />
      {/* アイリス光彩 */}
      <circle  cx="41.5" cy="47.2" r="1.2" fill="white" opacity="0.95" />
      <circle  cx="39" cy="50.5" r="0.6" fill="white" opacity="0.5" />
      {/* まつ毛 */}
      <path d="M34.2 45.5 Q34 44.5 35 44" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M36 44.2 Q36 43 37 42.5" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M38.5 43.5 Q38.5 42.2 39.5 42" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M41 43.8 Q41.5 42.5 42.5 42.5" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M43.5 44.8 Q44.5 44 45 44.5" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* 下まつ毛 */}
      <path d="M35 51.5 Q34.5 52.5 35.5 52.5" stroke="#9575cd" strokeWidth="0.5" fill="none" />
      <path d="M38 52.5 Q37.5 53.5 38.5 53" stroke="#9575cd" strokeWidth="0.5" fill="none" />
      <path d="M41 52.5 Q41 53.5 42 53" stroke="#9575cd" strokeWidth="0.5" fill="none" />
      <path d="M44 51.5 Q44.5 52.5 45 52" stroke="#9575cd" strokeWidth="0.5" fill="none" />
      {/* アイライン */}
      <path d="M34 46.5 Q37 43.5 42 44 Q44.5 44.5 45.5 46" stroke="#2e1065" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* 目（右） */}
      <ellipse cx="60" cy="48" rx="6" ry="5.5" fill="white" />
      <ellipse cx="60" cy="48.5" rx="4.5" ry="4.8" fill="#6d28d9" />
      <ellipse cx="60" cy="49" rx="3" ry="3.2" fill="#4c1d95" />
      <circle  cx="60" cy="49" r="1.5" fill="#1e0a40" />
      <circle  cx="61.5" cy="47.2" r="1.2" fill="white" opacity="0.95" />
      <circle  cx="59" cy="50.5" r="0.6" fill="white" opacity="0.5" />
      <path d="M54.5 45.5 Q54.2 44.5 55.2 44" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M56.5 44.2 Q56.5 43 57.5 42.5" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M59 43.5 Q59 42.2 60 42" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M61.5 43.8 Q62 42.5 63 42.5" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M63.5 44.8 Q64.5 44 65 44.5" stroke="#4c1d95" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M54.5 51.5 Q54 52.5 55 52.5" stroke="#9575cd" strokeWidth="0.5" fill="none" />
      <path d="M57.5 52.5 Q57 53.5 58 53" stroke="#9575cd" strokeWidth="0.5" fill="none" />
      <path d="M60.5 52.5 Q60.5 53.5 61.5 53" stroke="#9575cd" strokeWidth="0.5" fill="none" />
      <path d="M63.5 51.5 Q64 52.5 64.5 52" stroke="#9575cd" strokeWidth="0.5" fill="none" />
      <path d="M54.5 46.5 Q57 43.5 62 44 Q64.5 44.5 65.5 46" stroke="#2e1065" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* 鼻 */}
      <path d="M48.5 56 Q50 58 51.5 56" stroke="#d4956a" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <circle cx="48.5" cy="57.5" r="1" fill="#e8b090" opacity="0.4" />
      <circle cx="51.5" cy="57.5" r="1" fill="#e8b090" opacity="0.4" />

      {/* 口 */}
      <path d="M44 63 Q50 66.5 56 63" stroke="#e07878" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M46 63.5 Q50 65 54 63.5" fill="#f49cac" opacity="0.5" />
      {/* 歯 */}
      <path d="M46.5 63.5 Q50 65.5 53.5 63.5 Q52 65 50 65 Q48 65 46.5 63.5 Z" fill="white" opacity="0.8" />

      {/* ほっぺ */}
      <ellipse cx="33" cy="56" rx="5" ry="3" fill="#f9a8d4" opacity="0.35" filter="url(#ceoBlur)" />
      <ellipse cx="67" cy="56" rx="5" ry="3" fill="#f9a8d4" opacity="0.35" filter="url(#ceoBlur)" />

      {/* ホログラムパネル（右） */}
      <motion.g
        animate={isActive ? { opacity: [0.6, 1, 0.6], x: [0, 1, 0] } : { opacity: 0.5 }}
        transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
      >
        <rect x="76" y="70" width="20" height="26" rx="4" fill="#0f0a2a" stroke="#a855f7" strokeWidth="0.8" opacity="0.9" />
        {[0,1,2,3,4].map(i => (
          <motion.rect key={i} x="79" y={74 + i * 4} rx="1" height="2"
            fill={i % 2 === 0 ? "#a855f7" : "#c4b5fd"} opacity="0.7"
            animate={isActive ? { width: [4 + (i%3)*3, 12, 4 + (i%3)*3] } : { width: 8 }}
            transition={{ duration: 0.5 + i * 0.15, repeat: Infinity }}
          />
        ))}
      </motion.g>

      {/* アクティブグロー */}
      {isActive && (
        <motion.ellipse cx="50" cy="50" rx="24" ry="26"
          stroke="#a855f7" strokeWidth="1.5" fill="none"
          animate={{ opacity: [0, 0.4, 0], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: "50px 50px" }}
        />
      )}
      {isDone && <DoneBadge x={82} y={22} color="#7c3aed" />}
    </svg>
  );
}

// ─── Manager ─────────────────────────────────────────────────────
// 水色ボブ / 青目+メガネ / パーカー

function ManagerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone   = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="mgSkin" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fff4e8" />
          <stop offset="60%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <linearGradient id="mgHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#e0f7ff" />
          <stop offset="0.3" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="mgCloth" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#e8f4ff" />
          <stop offset="1" stopColor="#bae6fd" />
        </linearGradient>
        <filter id="mgBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      {/* 後ろ髪ボブ */}
      <path d="M26 46 Q20 55 22 80 Q24 90 28 88 Q26 68 32 52 Z" fill="#38bdf8" opacity="0.7" />
      <path d="M74 46 Q80 55 78 80 Q76 90 72 88 Q74 68 68 52 Z" fill="#38bdf8" opacity="0.7" />
      {/* ボブの広がり */}
      <path d="M22 55 Q16 68 20 85 Q22 88 24 86 Q22 72 26 60 Z" fill="#0ea5e9" opacity="0.5" />
      <path d="M78 55 Q84 68 80 85 Q78 88 76 86 Q78 72 74 60 Z" fill="#0ea5e9" opacity="0.5" />

      {/* 首 */}
      <path d="M43 68 Q43 80 45 84 L55 84 Q57 80 57 68 Z" fill="url(#mgSkin)" />

      {/* 服（カラフルパーカー） */}
      <path d="M16 130 Q18 96 34 88 L50 93 L66 88 Q82 96 84 130 Z" fill="#dbeafe" />
      {/* パーカーの柄 */}
      <path d="M34 88 Q38 95 42 130 L30 130 Q22 105 20 96 Z" fill="#bfdbfe" />
      <path d="M66 88 Q62 95 58 130 L70 130 Q78 105 80 96 Z" fill="#bfdbfe" />
      {/* 色のブロック */}
      <rect x="28" y="100" width="8" height="8" rx="2" fill="#60a5fa" opacity="0.7" />
      <rect x="36" y="108" width="8" height="8" rx="2" fill="#34d399" opacity="0.7" />
      <rect x="62" y="100" width="8" height="8" rx="2" fill="#f472b6" opacity="0.7" />
      <rect x="56" y="112" width="8" height="8" rx="2" fill="#fbbf24" opacity="0.7" />
      {/* ジップ */}
      <path d="M50 88 L50 130" stroke="#93c5fd" strokeWidth="1" opacity="0.6" />

      {/* 顔 */}
      <ellipse cx="50" cy="48" rx="22" ry="23" fill="url(#mgSkin)" />

      {/* 前髪ボブ */}
      <path d="M28 44 Q30 26 50 24 Q70 26 72 44 Q66 30 50 30 Q34 30 28 44 Z" fill="url(#mgHair)" />
      <path d="M28 44 Q25 37 27 50 Q29 40 32 47 Z" fill="#7dd3fc" />
      <path d="M72 44 Q75 37 73 50 Q71 40 68 47 Z" fill="#7dd3fc" />
      {/* 前髪の細毛 */}
      <path d="M36 26 Q34 20 39 30 Q36 24 36 26 Z" fill="#e0f7ff" opacity="0.9" />
      <path d="M50 24 Q48 18 53 24 Q51 20 50 24 Z" fill="#f0faff" opacity="0.9" />
      <path d="M62 26 Q66 20 63 30 Q64 24 62 26 Z" fill="#e0f7ff" opacity="0.8" />
      {/* ハイライト */}
      <path d="M34 28 Q38 24 46 32 Q40 26 34 28 Z" fill="white" opacity="0.4" />

      {/* 耳 */}
      <ellipse cx="28" cy="49" rx="3.5" ry="4.5" fill="#fddcb5" />
      <ellipse cx="72" cy="49" rx="3.5" ry="4.5" fill="#fddcb5" />

      {/* 眉毛 */}
      <path d="M35 40 Q39 37.5 43 39" stroke="#5ea0cc" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M57 39 Q61 37.5 65 40" stroke="#5ea0cc" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* メガネフレーム */}
      <rect x="32" y="43.5" width="16" height="11" rx="5.5" stroke="#bae6fd" strokeWidth="1.5" fill="rgba(186,230,253,0.08)" />
      <rect x="52" y="43.5" width="16" height="11" rx="5.5" stroke="#bae6fd" strokeWidth="1.5" fill="rgba(186,230,253,0.08)" />
      <path d="M48 49 L52 49" stroke="#bae6fd" strokeWidth="1.3" />
      <path d="M26 46.5 L32 47.5" stroke="#bae6fd" strokeWidth="1.2" />
      <path d="M74 46.5 L68 47.5" stroke="#bae6fd" strokeWidth="1.2" />

      {/* 目（左） */}
      <ellipse cx="40" cy="48.5" rx="5" ry="4.5" fill="white" />
      <ellipse cx="40" cy="49" rx="3.8" ry="4" fill="#0369a1" />
      <ellipse cx="40" cy="49.5" rx="2.4" ry="2.6" fill="#01497c" />
      <circle  cx="40" cy="49.5" r="1.4" fill="#012a4a" />
      <circle  cx="41.4" cy="47.8" r="1.1" fill="white" opacity="0.95" />
      <circle  cx="39.2" cy="51" r="0.5" fill="white" opacity="0.5" />
      <path d="M35.5 45.5 Q38 43 42.5 43.5 Q45 44 45.5 46" stroke="#01497c" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* まつ毛 */}
      <path d="M36 44.5 Q35.5 43.5 36.5 43" stroke="#01497c" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M38 43.5 Q37.8 42.5 39 42" stroke="#01497c" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M40.5 43 Q40.5 42 41.5 41.8" stroke="#01497c" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M43 43.5 Q43.5 42.5 44.5 43" stroke="#01497c" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* 目（右） */}
      <ellipse cx="60" cy="48.5" rx="5" ry="4.5" fill="white" />
      <ellipse cx="60" cy="49" rx="3.8" ry="4" fill="#0369a1" />
      <ellipse cx="60" cy="49.5" rx="2.4" ry="2.6" fill="#01497c" />
      <circle  cx="60" cy="49.5" r="1.4" fill="#012a4a" />
      <circle  cx="61.4" cy="47.8" r="1.1" fill="white" opacity="0.95" />
      <circle  cx="59.2" cy="51" r="0.5" fill="white" opacity="0.5" />
      <path d="M55.5 45.5 Q58 43 62.5 43.5 Q65 44 65.5 46" stroke="#01497c" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M56 44.5 Q55.5 43.5 56.5 43" stroke="#01497c" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M58 43.5 Q57.8 42.5 59 42" stroke="#01497c" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M60.5 43 Q60.5 42 61.5 41.8" stroke="#01497c" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M63 43.5 Q63.5 42.5 64.5 43" stroke="#01497c" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* 鼻 */}
      <path d="M48.5 55.5 Q50 57.5 51.5 55.5" stroke="#d4956a" strokeWidth="0.9" fill="none" strokeLinecap="round" />

      {/* 口（穏やかな笑顔） */}
      <path d="M44.5 62 Q50 66 55.5 62" stroke="#e07878" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M46.5 62.5 Q50 65 53.5 62.5" fill="#f49cac" opacity="0.45" />

      {/* ほっぺ */}
      <ellipse cx="33" cy="54" rx="5" ry="3" fill="#93c5fd" opacity="0.35" filter="url(#mgBlur)" />
      <ellipse cx="67" cy="54" rx="5" ry="3" fill="#93c5fd" opacity="0.35" filter="url(#mgBlur)" />

      {/* タブレット */}
      <motion.g
        animate={isActive ? { rotate: [-2, 2, -2] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "16px 75px" }}
      >
        <rect x="4" y="62" width="24" height="32" rx="4" fill="#041e35" stroke="#38bdf8" strokeWidth="1.2" />
        <rect x="4" y="62" width="24" height="8" rx="4" fill="#0369a1" opacity="0.6" />
        {isActive ? (
          [0,1,2,3,4].map(i => (
            <motion.rect key={i} x="7" y={72 + i*4} rx="1" height="2" fill="#38bdf8" opacity="0.7"
              animate={{ width: [5 + (i%3)*4, 16, 5 + (i%3)*4] }}
              transition={{ duration: 0.4 + i*0.12, repeat: Infinity }}
            />
          ))
        ) : (
          [0,1,2,3,4].map(i => (
            <rect key={i} x="7" y={72 + i*4} width={10 + (i%2)*6} height="2" rx="1" fill="#0369a1" opacity="0.6" />
          ))
        )}
      </motion.g>

      {isActive && (
        <motion.ellipse cx="50" cy="48" rx="24" ry="25"
          stroke="#38bdf8" strokeWidth="1.2" fill="none"
          animate={{ opacity: [0, 0.35, 0], scale: [0.95, 1.07, 0.95] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          style={{ transformOrigin: "50px 48px" }}
        />
      )}
      {isDone && <DoneBadge x={82} y={22} color="#0ea5e9" />}
    </svg>
  );
}

// ─── Worker ──────────────────────────────────────────────────────
// 暖色ウェーブ / 元気笑顔 / カラフルパーカー（3バリアント）

function WorkerCharacter({ status, variant = 0 }: { status: AgentStatus; variant?: number }) {
  const isActive = status === "thinking";
  const isDone   = status === "done";

  const themes = [
    { h1: "#fed7aa", h2: "#fb923c", h3: "#ea580c", eye: "#c2410c", eyeD: "#7c2d12", blush: "#fca5a5", c1: "#fff7ed", c2: "#fed7aa", accent: "#fb923c" },
    { h1: "#fef08a", h2: "#fbbf24", h3: "#d97706", eye: "#92400e", eyeD: "#451a03", blush: "#fde68a", c1: "#fffbeb", c2: "#fef08a", accent: "#fbbf24" },
    { h1: "#fce7f3", h2: "#f472b6", h3: "#db2777", eye: "#831843", eyeD: "#500724", blush: "#fbcfe8", c1: "#fdf2f8", c2: "#fce7f3", accent: "#f472b6" },
  ];
  const t = themes[variant % 3];

  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id={`wkSkin${variant}`} cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fff4e8" />
          <stop offset="60%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <linearGradient id={`wkHair${variant}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop stopColor={t.h1} />
          <stop offset="0.4" stopColor={t.h2} />
          <stop offset="1" stopColor={t.h3} />
        </linearGradient>
        <filter id={`wkBlur${variant}`}><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      {/* 後ろ髪（ウェーブ） */}
      <path d="M26 44 Q18 58 20 90 Q22 96 26 93 Q24 72 30 54 Z" fill={t.h2} opacity="0.7" />
      <path d="M74 44 Q82 58 80 90 Q78 96 74 93 Q76 72 70 54 Z" fill={t.h2} opacity="0.7" />
      <path d="M22 50 Q14 68 16 94 Q18 98 22 96 Q20 76 26 58 Z" fill={t.h3} opacity="0.5" />
      <path d="M78 50 Q86 68 84 94 Q82 98 78 96 Q80 76 74 58 Z" fill={t.h3} opacity="0.5" />

      {/* 首 */}
      <path d="M43 70 Q43 82 45 86 L55 86 Q57 82 57 70 Z" fill={`url(#wkSkin${variant})`} />

      {/* 服（カラフルパーカー） */}
      <path d="M16 130 Q18 96 34 88 L50 93 L66 88 Q82 96 84 130 Z" fill={t.c1} />
      {/* パーカー本体のブロック */}
      <path d="M22 110 L34 88 L42 130 Z" fill={t.c2} opacity="0.8" />
      <path d="M78 110 L66 88 L58 130 Z" fill={t.c2} opacity="0.8" />
      {/* 色ブロック装飾 */}
      <circle cx="34" cy="105" r="5" fill={t.accent} opacity="0.6" />
      <circle cx="66" cy="105" r="5" fill={t.accent} opacity="0.6" />
      <rect x="44" y="98" width="12" height="5" rx="2.5" fill={t.h2} opacity="0.5" />
      <rect x="44" y="108" width="12" height="5" rx="2.5" fill={t.h3} opacity="0.5" />

      {/* 顔 */}
      <ellipse cx="50" cy="50" rx="22" ry="24" fill={`url(#wkSkin${variant})`} />

      {/* 前髪ウェーブ */}
      <path d="M28 44 Q30 24 50 22 Q70 24 72 44 Q66 30 50 30 Q34 30 28 44 Z" fill={`url(#wkHair${variant})`} />
      <path d="M28 44 Q24 36 26 52 Q28 40 32 48 Z" fill={t.h2} />
      <path d="M72 44 Q76 36 74 52 Q72 40 68 48 Z" fill={t.h2} />
      {/* ウェーブ感 */}
      <path d="M34 26 Q30 20 38 30 Q34 24 34 26 Z" fill={t.h1} opacity="0.9" />
      <path d="M50 22 Q48 16 54 22 Q52 18 50 22 Z" fill={t.h1} opacity="0.9" />
      <path d="M64 26 Q70 20 64 30 Q66 24 64 26 Z" fill={t.h1} opacity="0.8" />
      <path d="M36 26 Q40 22 48 32 Q42 26 36 26 Z" fill="white" opacity="0.3" />

      {/* 耳 */}
      <ellipse cx="28" cy="51" rx="3.5" ry="4.5" fill="#fddcb5" />
      <ellipse cx="72" cy="51" rx="3.5" ry="4.5" fill="#fddcb5" />

      {/* 眉毛 */}
      <path d="M35 41 Q39.5 38 44 40" stroke={t.eye} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M56 40 Q60.5 38 65 41" stroke={t.eye} strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* 目（左）大きな丸目 */}
      <ellipse cx="40" cy="49" rx="6.5" ry="6" fill="white" />
      <ellipse cx="40" cy="49.5" rx="5" ry="5.2" fill={t.eye} />
      <ellipse cx="40" cy="50" rx="3.2" ry="3.4" fill={t.eyeD} />
      <circle  cx="40" cy="50" r="1.8" fill="#1a0a00" />
      <circle  cx="41.8" cy="48" r="1.4" fill="white" opacity="0.95" />
      <circle  cx="39" cy="52" r="0.7" fill="white" opacity="0.5" />
      <path d="M34 46 Q37 42.5 43 43 Q46 43.5 46.5 46" stroke={t.eyeD} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* まつ毛（元気） */}
      <path d="M34.5 45.5 Q34 44 35 43.5" stroke={t.eyeD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M36.5 44 Q36.5 42.5 37.5 42" stroke={t.eyeD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M39 43.2 Q39 41.8 40.2 41.5" stroke={t.eyeD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M41.5 43.5 Q42.2 42.2 43.5 42.5" stroke={t.eyeD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M44 45 Q45 43.8 45.8 44.5" stroke={t.eyeD} strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* 目（右） */}
      <ellipse cx="60" cy="49" rx="6.5" ry="6" fill="white" />
      <ellipse cx="60" cy="49.5" rx="5" ry="5.2" fill={t.eye} />
      <ellipse cx="60" cy="50" rx="3.2" ry="3.4" fill={t.eyeD} />
      <circle  cx="60" cy="50" r="1.8" fill="#1a0a00" />
      <circle  cx="61.8" cy="48" r="1.4" fill="white" opacity="0.95" />
      <circle  cx="59" cy="52" r="0.7" fill="white" opacity="0.5" />
      <path d="M54 46 Q57 42.5 63 43 Q66 43.5 66.5 46" stroke={t.eyeD} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M54.5 45.5 Q54 44 55 43.5" stroke={t.eyeD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M56.5 44 Q56.5 42.5 57.5 42" stroke={t.eyeD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M59 43.2 Q59 41.8 60.2 41.5" stroke={t.eyeD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M61.5 43.5 Q62.2 42.2 63.5 42.5" stroke={t.eyeD} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M64 45 Q65 43.8 65.8 44.5" stroke={t.eyeD} strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* 鼻 */}
      <path d="M48.5 57 Q50 59 51.5 57" stroke="#d4956a" strokeWidth="0.9" fill="none" strokeLinecap="round" />

      {/* 口（笑顔 大きめ） */}
      <path d="M43 63 Q50 69 57 63" stroke="#e07878" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M45 63.5 Q50 68 55 63.5" fill="#f49cac" opacity="0.5" />
      <path d="M45.5 64 Q50 68 54.5 64 Q52 67 50 67 Q48 67 45.5 64 Z" fill="white" opacity="0.8" />

      {/* ほっぺ（大きめ） */}
      <ellipse cx="32" cy="57" rx="6" ry="3.5" fill={t.blush} opacity="0.45" filter={`url(#wkBlur${variant})`} />
      <ellipse cx="68" cy="57" rx="6" ry="3.5" fill={t.blush} opacity="0.45" filter={`url(#wkBlur${variant})`} />

      {/* ツールグローブ（右腕） */}
      <motion.g
        animate={isActive ? { rotate: [-18, 18, -18] } : {}}
        transition={{ duration: 0.45, repeat: Infinity }}
        style={{ transformOrigin: "80px 80px" }}
      >
        <path d="M76 72 Q86 70 88 78 Q86 88 78 90" stroke={t.h3} strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="88" cy="78" r="6" fill={t.accent} opacity="0.9" />
        {isActive && (
          <motion.circle cx="88" cy="78" r="10" fill={t.accent} opacity="0.25"
            animate={{ r: [6, 14, 6], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 0.45, repeat: Infinity }}
          />
        )}
      </motion.g>

      {isActive && (
        <motion.ellipse cx="50" cy="50" rx="24" ry="26"
          stroke={t.accent} strokeWidth="1.2" fill="none"
          animate={{ opacity: [0, 0.4, 0], scale: [0.94, 1.08, 0.94] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ transformOrigin: "50px 50px" }}
        />
      )}
      {isDone && <DoneBadge x={16} y={22} color={t.h3} />}
    </svg>
  );
}

// ─── Reviewer ────────────────────────────────────────────────────
// ミントグリーンセミロング / 緑目 / 白ジャケット

function ReviewerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "reviewing" || status === "thinking";
  const isDone   = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="rvSkin" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fff4e8" />
          <stop offset="60%" stopColor="#fde8cc" />
          <stop offset="100%" stopColor="#f0c898" />
        </radialGradient>
        <linearGradient id="rvHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#d1fae5" />
          <stop offset="0.35" stopColor="#6ee7b7" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <filter id="rvBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      {/* 後ろ髪（セミロング） */}
      <path d="M26 46 Q18 62 20 100 Q22 106 26 103 Q24 80 30 56 Z" fill="#34d399" opacity="0.7" />
      <path d="M74 46 Q82 62 80 100 Q78 106 74 103 Q76 80 70 56 Z" fill="#34d399" opacity="0.7" />
      <path d="M22 54 Q14 72 16 102 Q18 106 22 104 Q20 82 26 62 Z" fill="#059669" opacity="0.5" />
      <path d="M78 54 Q86 72 84 102 Q82 106 78 104 Q80 82 74 62 Z" fill="#059669" opacity="0.5" />

      {/* 首 */}
      <path d="M43 68 Q43 80 45 84 L55 84 Q57 80 57 68 Z" fill="url(#rvSkin)" />

      {/* 服（白ジャケット） */}
      <path d="M16 130 Q18 96 34 88 L50 93 L66 88 Q82 96 84 130 Z" fill="#f8fafc" />
      <path d="M34 88 Q36 93 38 130 L22 130 Q18 105 20 96 Z" fill="#e2e8f0" opacity="0.8" />
      <path d="M66 88 Q64 93 62 130 L78 130 Q82 105 80 96 Z" fill="#e2e8f0" opacity="0.8" />
      {/* エンブレム */}
      <circle cx="30" cy="102" r="7" fill="#d1fae5" stroke="#22c55e" strokeWidth="1" />
      <path d="M27 102 L29.5 104.5 L34 99" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* カフス */}
      <rect x="18" y="115" width="12" height="5" rx="2.5" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="0.8" />
      <rect x="70" y="115" width="12" height="5" rx="2.5" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="0.8" />

      {/* 顔 */}
      <ellipse cx="50" cy="49" rx="22" ry="23" fill="url(#rvSkin)" />

      {/* 前髪 */}
      <path d="M28 44 Q30 26 50 24 Q70 26 72 44 Q66 30 50 30 Q34 30 28 44 Z" fill="url(#rvHair)" />
      <path d="M28 44 Q24 37 26 50 Q28 40 32 47 Z" fill="#6ee7b7" />
      <path d="M72 44 Q76 37 74 50 Q72 40 68 47 Z" fill="#6ee7b7" />
      <path d="M34 26 Q30 20 38 30 Q34 24 34 26 Z" fill="#d1fae5" opacity="0.95" />
      <path d="M50 24 Q48 16 54 24 Q52 18 50 24 Z" fill="#ecfdf5" opacity="0.9" />
      <path d="M64 26 Q70 20 64 30 Q66 24 64 26 Z" fill="#d1fae5" opacity="0.85" />
      <path d="M36 26 Q40 22 48 32 Q42 26 36 26 Z" fill="white" opacity="0.35" />

      {/* 耳 */}
      <ellipse cx="28" cy="50" rx="3.5" ry="4.5" fill="#fde8cc" />
      <ellipse cx="72" cy="50" rx="3.5" ry="4.5" fill="#fde8cc" />

      {/* 眉毛（緩やか） */}
      <path d="M35 40.5 Q39.5 37.5 44 39.5" stroke="#2d6a4f" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M56 39.5 Q60.5 37.5 65 40.5" stroke="#2d6a4f" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* 目（左） */}
      <ellipse cx="40" cy="48" rx="6" ry="5.5" fill="white" />
      <ellipse cx="40" cy="48.5" rx="4.5" ry="4.8" fill="#059669" />
      <ellipse cx="40" cy="49" rx="2.8" ry="3" fill="#065f46" />
      <circle  cx="40" cy="49" r="1.5" fill="#022c22" />
      <circle  cx="41.5" cy="47.2" r="1.2" fill="white" opacity="0.95" />
      <circle  cx="39" cy="51" r="0.55" fill="white" opacity="0.5" />
      {/* 穏やかなアイライン（細め） */}
      <path d="M34.5 46 Q37 43 42 43.5 Q44.5 44 45.2 46" stroke="#022c22" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M35 47.5 Q34.5 50.5 37 52" stroke="#6ee7b7" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M45.5 47.5 Q46 50.5 44 52" stroke="#6ee7b7" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* まつ毛 */}
      <path d="M35.5 44.5 Q35 43.5 36 43" stroke="#022c22" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M37.5 43.5 Q37.5 42.2 38.5 42" stroke="#022c22" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M40 43 Q40 41.8 41 41.5" stroke="#022c22" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M42.5 43.5 Q43 42.3 44 42.5" stroke="#022c22" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* 目（右） */}
      <ellipse cx="60" cy="48" rx="6" ry="5.5" fill="white" />
      <ellipse cx="60" cy="48.5" rx="4.5" ry="4.8" fill="#059669" />
      <ellipse cx="60" cy="49" rx="2.8" ry="3" fill="#065f46" />
      <circle  cx="60" cy="49" r="1.5" fill="#022c22" />
      <circle  cx="61.5" cy="47.2" r="1.2" fill="white" opacity="0.95" />
      <circle  cx="59" cy="51" r="0.55" fill="white" opacity="0.5" />
      <path d="M54.5 46 Q57 43 62 43.5 Q64.5 44 65.2 46" stroke="#022c22" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M55 47.5 Q54.5 50.5 57 52" stroke="#6ee7b7" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M65.5 47.5 Q66 50.5 64 52" stroke="#6ee7b7" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M55.5 44.5 Q55 43.5 56 43" stroke="#022c22" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M57.5 43.5 Q57.5 42.2 58.5 42" stroke="#022c22" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M60 43 Q60 41.8 61 41.5" stroke="#022c22" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M62.5 43.5 Q63 42.3 64 42.5" stroke="#022c22" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* 鼻 */}
      <path d="M48.5 55.5 Q50 57.5 51.5 55.5" stroke="#c8956a" strokeWidth="0.9" fill="none" strokeLinecap="round" />

      {/* 口（優しい笑顔） */}
      <path d="M44.5 62 Q50 66.5 55.5 62" stroke="#e07878" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M46.5 62.5 Q50 65.5 53.5 62.5" fill="#f49cac" opacity="0.4" />
      <path d="M47 63 Q50 66 53 63 Q51.5 66 50 66 Q48.5 66 47 63 Z" fill="white" opacity="0.75" />

      {/* ほっぺ */}
      <ellipse cx="33" cy="55" rx="5.5" ry="3" fill="#6ee7b7" opacity="0.35" filter="url(#rvBlur)" />
      <ellipse cx="67" cy="55" rx="5.5" ry="3" fill="#6ee7b7" opacity="0.35" filter="url(#rvBlur)" />

      {/* ホログラムチェックリスト */}
      <motion.g
        animate={isActive ? { y: [-1.5, 1.5, -1.5], opacity: [0.85, 1, 0.85] } : {}}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="74" y="65" width="22" height="30" rx="4" fill="#022c22" stroke="#22c55e" strokeWidth="1" opacity="0.95" />
        <rect x="74" y="65" width="22" height="7" rx="4" fill="#065f46" />
        <rect x="80" y="63" width="6" height="4" rx="2" fill="#22c55e" />
        {[0,1,2,3].map(i => (
          <g key={i}>
            <motion.rect x="77" y={74 + i*5} width="3" height="3" rx="0.5"
              fill={isDone || (isActive && i < 2) ? "#22c55e" : "#065f46"}
              stroke="#22c55e" strokeWidth="0.5"
              animate={isActive && i === 1 ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
            {(isDone || (isActive && i < 2)) && (
              <path d={`M${77.8} ${75.5 + i*5} L${79.5} ${77 + i*5} L${82} ${73.5 + i*5}`}
                stroke="white" strokeWidth="0.9" strokeLinecap="round" />
            )}
            <line x1="82" y1={75.5 + i*5} x2="93" y2={75.5 + i*5} stroke="#065f46" strokeWidth="0.9" />
          </g>
        ))}
      </motion.g>

      {isActive && (
        <motion.rect x="28" y="58" width="44" height="2" rx="1"
          fill="#22c55e" opacity="0.4"
          animate={{ y: [58, 68, 58] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {isDone && <DoneBadge x={16} y={22} color="#059669" />}
    </svg>
  );
}

// ─── メインエクスポート ────────────────────────────────────────────
const WORKER_VARIANT: Record<string, number> = {
  "worker-1": 0, "worker-2": 1, "worker-3": 2,
};

export default function AgentCharacter({ role, status, agentId }: Props) {
  const animVariant = breathe[status] ?? breathe.idle;
  const workerVariant = agentId ? (WORKER_VARIANT[agentId] ?? 0) : 0;

  return (
    <motion.div
      style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
      animate={animVariant}
    >
      {role === "ceo"      && <CeoCharacter status={status} />}
      {role === "manager"  && <ManagerCharacter status={status} />}
      {role === "worker"   && <WorkerCharacter status={status} variant={workerVariant} />}
      {role === "reviewer" && <ReviewerCharacter status={status} />}
      {role === "system"   && (
        <svg viewBox="0 0 100 130" fill="none">
          <circle cx="50" cy="60" r="28" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <text x="50" y="68" textAnchor="middle" fill="#475569" fontSize="26">⚙</text>
        </svg>
      )}
    </motion.div>
  );
}
