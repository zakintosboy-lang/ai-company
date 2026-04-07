"use client";

import { motion } from "framer-motion";
import type { AgentRole, AgentStatus } from "../types/agent";

interface Props {
  role: AgentRole;
  status: AgentStatus;
}

import type { Transition } from "framer-motion";

type AnimState = { scaleY?: number[]; y?: number[]; rotate?: number[]; transition?: Transition };

const breathe: Record<AgentStatus, AnimState> = {
  idle:      { scaleY: [1, 1.025, 1], y: [0, -1, 0],  transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const } },
  thinking:  { y: [0, -5, 0],                           transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" as const } },
  done:      { y: [0, -12, 0],                          transition: { duration: 0.4, ease: "backOut" as const } },
  waiting:   { scaleY: [1, 1.01, 1],                    transition: { duration: 4,   repeat: Infinity, ease: "easeInOut" as const } },
  reviewing: { rotate: [-1, 1, -1],                     transition: { duration: 1,   repeat: Infinity, ease: "easeInOut" as const } },
};

// ─── 共通パーツ ────────────────────────────────────────────────────

/** グリッチ風背景ジオメトリ */
function GlitchBg({ color1, color2 }: { color1: string; color2: string }) {
  return (
    <g opacity="0.18">
      <rect x="2"  y="70" width="14" height="14" rx="1" fill={color1} transform="rotate(15 9 77)" />
      <rect x="62" y="75" width="10" height="10" rx="1" fill={color2} transform="rotate(-10 67 80)" />
      <rect x="55" y="10" width="8"  height="8"  rx="1" fill={color1} transform="rotate(20 59 14)" />
      <rect x="4"  y="14" width="6"  height="6"  rx="1" fill={color2} transform="rotate(-15 7 17)" />
      <rect x="30" y="88" width="20" height="4"  rx="1" fill={color1} opacity="0.5" />
      <rect x="10" y="50" width="4"  height="18" rx="1" fill={color2} opacity="0.4" />
      <rect x="64" y="42" width="4"  height="14" rx="1" fill={color1} opacity="0.4" />
    </g>
  );
}

/** アニメ大目（グロー付き） */
function AnimeEye({
  cx, cy, pupilColor, glowColor, lidAngle = 0,
}: {
  cx: number; cy: number; pupilColor: string; glowColor: string; lidAngle?: number;
}) {
  return (
    <g>
      {/* グロー */}
      <ellipse cx={cx} cy={cy} rx="5.5" ry="5" fill={glowColor} opacity="0.25" />
      {/* 白目 */}
      <ellipse cx={cx} cy={cy} rx="4.5" ry="4.2" fill="white" />
      {/* 瞳 */}
      <ellipse cx={cx} cy={cy} rx="3"   ry="3.2" fill={pupilColor} />
      {/* ハイライト */}
      <circle  cx={cx + 1.2} cy={cy - 1.2} r="1"   fill="white" opacity="0.9" />
      <circle  cx={cx - 1}   cy={cy + 1}   r="0.5" fill="white" opacity="0.5" />
      {/* 上まぶた */}
      <path
        d={`M ${cx - 4.5} ${cy - 1} Q ${cx} ${cy - 6 + lidAngle} ${cx + 4.5} ${cy - 1}`}
        fill="#1a0a2e" stroke="none"
      />
      {/* アイライン */}
      <path
        d={`M ${cx - 4.5} ${cy - 1} Q ${cx} ${cy - 5.5 + lidAngle} ${cx + 4.5} ${cy - 1}`}
        stroke={pupilColor} strokeWidth="0.8" fill="none" opacity="0.7"
      />
    </g>
  );
}

/** 完了チェックバッジ */
function DoneBadge({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <circle cx={x} cy={y} r="9" fill={color} />
      <circle cx={x} cy={y} r="9" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
      <path d={`M${x-4} ${y} L${x-1} ${y+3} L${x+5} ${y-4}`}
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </motion.g>
  );
}

// ─── CEO ─────────────────────────────────────────────────────────
// 銀髪ロング・紫グロー目・黒テックスーツ・ホログラムパネル

function CeoCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking";
  const isDone   = status === "done";

  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <GlitchBg color1="#a855f7" color2="#ec4899" />

      {/* 後ろ髪 */}
      <path d="M22 38 Q18 60 20 85 Q28 90 30 85 Q28 65 32 50 Z" fill="url(#ceoHairBack)" />
      <path d="M58 38 Q62 60 60 85 Q52 90 50 85 Q52 65 48 50 Z" fill="url(#ceoHairBack)" />
      <defs>
        <linearGradient id="ceoHairBack" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {/* 首 */}
      <rect x="35" y="52" width="10" height="10" rx="2" fill="#fde8c8" />

      {/* テックスーツ（胸） */}
      <path d="M16 62 Q20 56 40 54 Q60 56 64 62 L66 92 Q40 96 14 92 Z" fill="url(#ceoSuit)" />
      <defs>
        <linearGradient id="ceoSuit" x1="16" y1="54" x2="66" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f0624" />
          <stop offset="1" stopColor="#1e0a40" />
        </linearGradient>
      </defs>

      {/* スーツライン装飾 */}
      <path d="M40 56 L40 80" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />
      <path d="M30 62 L36 68 M50 62 L44 68" stroke="#c4b5fd" strokeWidth="0.6" opacity="0.5" />
      <rect x="33" y="72" width="14" height="8" rx="2" fill="#2d1460" stroke="#a855f7" strokeWidth="0.6" />
      <motion.rect x="35" y="74" width="10" height="4" rx="1" fill="#a855f7" opacity="0.4"
        animate={isActive ? { opacity: [0.2, 0.8, 0.2] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      />

      {/* 頭 */}
      <circle cx="40" cy="36" r="17" fill="url(#ceoSkin)" />
      <defs>
        <linearGradient id="ceoSkin" x1="26" y1="22" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe4c4" />
          <stop offset="1" stopColor="#f5c49a" />
        </linearGradient>
      </defs>

      {/* 前髪 */}
      <path d="M23 32 Q24 18 40 18 Q56 18 57 32 Q52 22 40 22 Q28 22 23 32 Z" fill="url(#ceoHair)" />
      <path d="M23 32 Q20 28 22 36" fill="#d8b4fe" />
      <path d="M57 32 Q60 28 58 36" fill="#d8b4fe" />
      <path d="M28 22 Q30 14 36 20" fill="#c4b5fd" opacity="0.8" />
      <path d="M52 22 Q50 14 44 20" fill="#e9d5ff" opacity="0.7" />
      {/* ピンクメッシュ */}
      <path d="M38 18 Q42 14 46 20 Q43 18 40 20 Q39 19 38 18 Z" fill="#f472b6" opacity="0.7" />
      <defs>
        <linearGradient id="ceoHair" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#e9d5ff" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* ヘッドフォン */}
      <path d="M22 34 Q20 24 40 22 Q60 24 58 34" stroke="#7c3aed" strokeWidth="3" fill="none" />
      <rect x="18" y="32" width="7" height="10" rx="3" fill="#4c1d95" stroke="#a855f7" strokeWidth="0.8" />
      <rect x="55" y="32" width="7" height="10" rx="3" fill="#4c1d95" stroke="#a855f7" strokeWidth="0.8" />
      <motion.rect x="19" y="34" width="5" height="6" rx="2" fill="#a855f7" opacity="0.6"
        animate={isActive ? { opacity: [0.3, 1, 0.3] } : {}}
        transition={{ duration: 0.6, repeat: Infinity }}
      />

      {/* 目 */}
      <AnimeEye cx={33} cy={37} pupilColor="#7c3aed" glowColor="#a855f7" />
      <AnimeEye cx={47} cy={37} pupilColor="#7c3aed" glowColor="#a855f7" />

      {/* 鼻 */}
      <path d="M39 42 Q40 44 41 42" stroke="#d4a06a" strokeWidth="0.7" fill="none" />

      {/* 口（クール） */}
      <path d="M36 46 Q40 47.5 44 46" stroke="#e07070" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* ほっぺ */}
      <circle cx="29" cy="43" r="3.5" fill="#f9a8d4" opacity="0.35" />
      <circle cx="51" cy="43" r="3.5" fill="#f9a8d4" opacity="0.35" />

      {/* ホログラムパネル（右） */}
      <motion.g
        animate={isActive ? { x: [0, 1, 0], opacity: [0.7, 1, 0.7] } : { opacity: 0.6 }}
        transition={isActive ? { duration: 1.2, repeat: Infinity } : {}}
      >
        <rect x="60" y="56" width="18" height="22" rx="3" fill="#0f0624" stroke="#a855f7" strokeWidth="1" opacity="0.9" />
        {[0,1,2,3].map(i => (
          <motion.rect key={i} x="62" y={60 + i * 4} width={8 + (i % 2) * 4} height="2" rx="1" fill="#a855f7" opacity="0.7"
            animate={isActive ? { width: [8 + (i%2)*4, 12 + (i%2)*2, 8 + (i%2)*4] } : {}}
            transition={{ duration: 0.6 + i * 0.2, repeat: Infinity }}
          />
        ))}
      </motion.g>

      {/* アクティブグロー */}
      {isActive && (
        <motion.circle cx="40" cy="36" r="19"
          stroke="#a855f7" strokeWidth="1.5" fill="none"
          animate={{ opacity: [0, 0.5, 0], scale: [0.95, 1.1, 0.95] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: "40px 36px" }}
        />
      )}

      {isDone && <DoneBadge x={66} y={18} color="#7c3aed" />}
    </svg>
  );
}

// ─── Manager ──────────────────────────────────────────────────────
// 青髪ショート・水色目・メガネ・データタブレット

function ManagerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone   = status === "done";

  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <GlitchBg color1="#38bdf8" color2="#818cf8" />

      {/* 後ろ髪 */}
      <path d="M24 36 Q22 48 24 58 Q28 60 30 58 Q28 48 30 40 Z" fill="#0ea5e9" />
      <path d="M56 36 Q58 48 56 58 Q52 60 50 58 Q52 48 50 40 Z" fill="#0ea5e9" />

      {/* 首 */}
      <rect x="35" y="52" width="10" height="10" rx="2" fill="#ffe4c4" />

      {/* テックコート */}
      <path d="M16 62 Q20 55 40 54 Q60 55 64 62 L66 92 Q40 97 14 92 Z" fill="url(#mgCoat)" />
      <defs>
        <linearGradient id="mgCoat" x1="16" y1="54" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#082f49" />
          <stop offset="1" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>
      <path d="M40 56 L40 92" stroke="#38bdf8" strokeWidth="0.6" opacity="0.4" />
      <path d="M16 70 Q40 66 64 70" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3" />
      <rect x="26" y="74" width="10" height="12" rx="2" fill="#0c2a4a" stroke="#38bdf8" strokeWidth="0.6" />
      <rect x="44" y="74" width="10" height="12" rx="2" fill="#0c2a4a" stroke="#38bdf8" strokeWidth="0.6" />
      {[0,1,2].map(i => (
        <motion.line key={i}
          x1="28" y1={77 + i * 3} x2="34" y2={77 + i * 3}
          stroke="#38bdf8" strokeWidth="0.7" opacity="0.7"
          animate={isActive ? { opacity: [0.3, 1, 0.3] } : {}}
          transition={{ duration: 0.5 + i * 0.2, repeat: Infinity }}
        />
      ))}

      {/* 頭 */}
      <circle cx="40" cy="36" r="17" fill="url(#mgSkin)" />
      <defs>
        <linearGradient id="mgSkin" x1="26" y1="22" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe8cc" />
          <stop offset="1" stopColor="#f5c49a" />
        </linearGradient>
      </defs>

      {/* 髪（ショートブルー） */}
      <path d="M23 32 Q25 16 40 16 Q55 16 57 32 Q52 20 40 20 Q28 20 23 32 Z" fill="url(#mgHair)" />
      <path d="M23 32 Q20 28 23 37" fill="#0284c7" />
      <path d="M57 32 Q60 28 57 37" fill="#0284c7" />
      <path d="M28 18 Q30 12 36 18 Q32 16 28 18 Z" fill="#38bdf8" opacity="0.9" />
      <path d="M44 18 Q46 12 52 18 Q48 16 44 18 Z" fill="#7dd3fc" opacity="0.7" />
      <defs>
        <linearGradient id="mgHair" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* メガネ */}
      <circle cx="33" cy="37" r="5.5" stroke="#bae6fd" strokeWidth="1.2" fill="none" opacity="0.8" />
      <circle cx="47" cy="37" r="5.5" stroke="#bae6fd" strokeWidth="1.2" fill="none" opacity="0.8" />
      <line x1="38.5" y1="37" x2="41.5" y2="37" stroke="#bae6fd" strokeWidth="1" />
      <line x1="22" y1="35" x2="27.5" y2="36" stroke="#bae6fd" strokeWidth="1" />
      <line x1="58" y1="35" x2="52.5" y2="36" stroke="#bae6fd" strokeWidth="1" />

      {/* 目 */}
      <AnimeEye cx={33} cy={37} pupilColor="#0369a1" glowColor="#38bdf8" lidAngle={1} />
      <AnimeEye cx={47} cy={37} pupilColor="#0369a1" glowColor="#38bdf8" lidAngle={1} />

      {/* 鼻・口 */}
      <path d="M39 42 Q40 44 41 42" stroke="#d4a06a" strokeWidth="0.7" fill="none" />
      <path d="M37 46 L40 47 L43 46" stroke="#e07070" strokeWidth="0.9" fill="none" strokeLinecap="round" />

      {/* ほっぺ */}
      <circle cx="28" cy="43" r="3" fill="#93c5fd" opacity="0.3" />
      <circle cx="52" cy="43" r="3" fill="#93c5fd" opacity="0.3" />

      {/* タブレット */}
      <motion.g
        animate={isActive ? { rotate: [-2, 2, -2] } : {}}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "16px 72px" }}
      >
        <rect x="4" y="60" width="22" height="28" rx="3" fill="#041e35" stroke="#38bdf8" strokeWidth="1.2" />
        {isActive ? (
          <>
            {[0,1,2,3,4].map(i => (
              <motion.rect key={i} x="7" y={64 + i * 4} rx="1"
                height="2" fill="#38bdf8" opacity="0.7"
                animate={{ width: [6 + (i%3)*3, 14 - (i%2)*3, 6 + (i%3)*3] }}
                transition={{ duration: 0.4 + i * 0.15, repeat: Infinity }}
              />
            ))}
          </>
        ) : (
          <>
            <rect x="7" y="64" width="16" height="2" rx="1" fill="#0369a1" />
            <rect x="7" y="68" width="12" height="2" rx="1" fill="#0369a1" opacity="0.7" />
            <rect x="7" y="72" width="14" height="2" rx="1" fill="#0369a1" opacity="0.5" />
            <rect x="7" y="76" width="10" height="2" rx="1" fill="#0369a1" opacity="0.4" />
          </>
        )}
      </motion.g>

      {isActive && (
        <motion.circle cx="40" cy="36" r="19"
          stroke="#38bdf8" strokeWidth="1.2" fill="none"
          animate={{ opacity: [0, 0.4, 0], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          style={{ transformOrigin: "40px 36px" }}
        />
      )}

      {isDone && <DoneBadge x={66} y={18} color="#0ea5e9" />}
    </svg>
  );
}

// ─── Worker ───────────────────────────────────────────────────────
// オレンジ髪・活発・ツールグローブ・ヘッドギア

function WorkerCharacter({ status, variant = 0 }: { status: AgentStatus; variant?: number }) {
  const isActive = status === "thinking";
  const isDone   = status === "done";

  const palettes = [
    { hair1: "#fb923c", hair2: "#ea580c", eye: "#c2410c", glow: "#fb923c", suit1: "#431407", suit2: "#9a3412" },
    { hair1: "#fbbf24", hair2: "#d97706", eye: "#b45309", glow: "#fbbf24", suit1: "#422006", suit2: "#92400e" },
    { hair1: "#f472b6", hair2: "#db2777", eye: "#9d174d", glow: "#f472b6", suit1: "#3b0764", suit2: "#86198f" },
  ];
  const p = palettes[variant % 3];

  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <GlitchBg color1={p.hair1} color2={p.glow} />

      {/* 後ろ髪（ツインテ or ポニー） */}
      {variant === 0 && (
        <>
          <path d="M22 36 Q14 50 16 72 Q20 76 22 72 Q20 54 26 42 Z" fill={p.hair2} />
          <path d="M58 36 Q66 50 64 72 Q60 76 58 72 Q60 54 54 42 Z" fill={p.hair2} />
        </>
      )}
      {variant === 1 && (
        <path d="M40 44 Q55 48 60 65 Q56 70 52 65 Q50 52 40 50 Z" fill={p.hair2} />
      )}
      {variant === 2 && (
        <>
          <path d="M24 36 Q20 54 22 70" stroke={p.hair2} strokeWidth="6" strokeLinecap="round" />
          <path d="M56 36 Q60 54 58 70" stroke={p.hair2} strokeWidth="6" strokeLinecap="round" />
        </>
      )}

      {/* 首 */}
      <rect x="35" y="52" width="10" height="10" rx="2" fill="#ffe4c4" />

      {/* テックパーカー */}
      <path d="M14 63 Q18 55 40 54 Q62 55 66 63 L68 92 Q40 97 12 92 Z" fill={`url(#wkSuit${variant})`} />
      <defs>
        <linearGradient id={`wkSuit${variant}`} x1="14" y1="54" x2="66" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor={p.suit1} />
          <stop offset="1" stopColor={p.suit2} />
        </linearGradient>
      </defs>
      {/* フード輪郭 */}
      <path d="M20 62 Q30 58 40 57 Q50 58 60 62" stroke={p.hair1} strokeWidth="0.8" fill="none" opacity="0.5" />
      {/* ポケット */}
      <rect x="22" y="76" width="14" height="10" rx="3" fill={p.suit1} stroke={p.hair1} strokeWidth="0.7" opacity="0.8" />
      <rect x="44" y="76" width="14" height="10" rx="3" fill={p.suit1} stroke={p.hair1} strokeWidth="0.7" opacity="0.8" />

      {/* 頭 */}
      <circle cx="40" cy="36" r="17" fill="url(#wkSkin)" />
      <defs>
        <linearGradient id="wkSkin" x1="26" y1="22" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe8cc" />
          <stop offset="1" stopColor="#f5c49a" />
        </linearGradient>
      </defs>

      {/* ヘッドギア（カチューシャ型） */}
      <rect x="22" y="22" width="36" height="5" rx="2.5" fill="#1c1917" />
      <rect x="28" y="20" width="24" height="4" rx="2" fill={p.hair1} opacity="0.8" />
      <circle cx="26" cy="22" r="3" fill={p.suit2} stroke={p.hair1} strokeWidth="0.8" />
      <circle cx="54" cy="22" r="3" fill={p.suit2} stroke={p.hair1} strokeWidth="0.8" />
      <motion.circle cx="26" cy="22" r="1.5" fill={p.hair1}
        animate={isActive ? { opacity: [0.4, 1, 0.4] } : {}} transition={{ duration: 0.5, repeat: Infinity }} />
      <motion.circle cx="54" cy="22" r="1.5" fill={p.hair1}
        animate={isActive ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.6 }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }} />

      {/* 前髪 */}
      <path d="M23 28 Q26 16 40 16 Q54 16 57 28 Q52 20 40 20 Q28 20 23 28 Z" fill={`url(#wkHair${variant})`} />
      <path d="M23 28 Q20 26 22 35" fill={p.hair2} />
      <path d="M57 28 Q60 26 58 35" fill={p.hair2} />
      <defs>
        <linearGradient id={`wkHair${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={p.hair1} />
          <stop offset="1" stopColor={p.hair2} />
        </linearGradient>
      </defs>

      {/* 目 */}
      <AnimeEye cx={33} cy={37} pupilColor={p.eye} glowColor={p.glow} />
      <AnimeEye cx={47} cy={37} pupilColor={p.eye} glowColor={p.glow} />

      {/* 鼻・口（笑顔） */}
      <path d="M39 42 Q40 44 41 42" stroke="#d4a06a" strokeWidth="0.7" fill="none" />
      <path d="M35 46 Q40 51 45 46" stroke="#e07070" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* ほっぺ（元気） */}
      <circle cx="27" cy="44" r="4" fill={p.glow} opacity="0.25" />
      <circle cx="53" cy="44" r="4" fill={p.glow} opacity="0.25" />

      {/* ツールグローブ（右腕） */}
      <motion.g
        animate={isActive ? { rotate: [-20, 20, -20] } : {}}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: "63px 66px" }}
      >
        <path d="M60 62 Q68 60 70 66 Q68 74 62 76" stroke={p.suit2} strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="70" cy="66" r="4" fill={p.hair1} opacity="0.8" />
        {isActive && (
          <motion.circle cx="70" cy="66" r="7" fill={p.glow} opacity="0.3"
            animate={{ r: [4, 9, 4], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
        )}
      </motion.g>

      {isActive && (
        <motion.circle cx="40" cy="36" r="19"
          stroke={p.glow} strokeWidth="1.2" fill="none"
          animate={{ opacity: [0, 0.5, 0], scale: [0.94, 1.1, 0.94] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ transformOrigin: "40px 36px" }}
        />
      )}

      {isDone && <DoneBadge x={10} y={18} color={p.hair2} />}
    </svg>
  );
}

// ─── Reviewer ─────────────────────────────────────────────────────
// ミントグリーン髪・緑目・穏やか・ホロチェックリスト

function ReviewerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "reviewing" || status === "thinking";
  const isDone   = status === "done";

  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <GlitchBg color1="#22c55e" color2="#a3e635" />

      {/* 後ろ髪（セミロング） */}
      <path d="M22 38 Q18 56 20 78 Q26 82 28 78 Q26 60 30 46 Z" fill="#16a34a" />
      <path d="M58 38 Q62 56 60 78 Q54 82 52 78 Q54 60 50 46 Z" fill="#16a34a" />

      {/* 首 */}
      <rect x="35" y="52" width="10" height="10" rx="2" fill="#ffe4c4" />

      {/* テックジャケット */}
      <path d="M16 62 Q20 55 40 54 Q60 55 64 62 L66 92 Q40 97 14 92 Z" fill="url(#rvJacket)" />
      <defs>
        <linearGradient id="rvJacket" x1="16" y1="54" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#052e16" />
          <stop offset="1" stopColor="#166534" />
        </linearGradient>
      </defs>
      <path d="M40 56 L40 92" stroke="#22c55e" strokeWidth="0.6" opacity="0.4" />
      {/* エンブレム */}
      <circle cx="31" cy="68" r="6" fill="#14532d" stroke="#22c55e" strokeWidth="1" />
      <path d="M27.5 68 L30 70.5 L34.5 65.5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* 頭 */}
      <circle cx="40" cy="36" r="17" fill="url(#rvSkin)" />
      <defs>
        <linearGradient id="rvSkin" x1="26" y1="22" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe8cc" />
          <stop offset="1" stopColor="#f5c49a" />
        </linearGradient>
      </defs>

      {/* 髪（ミントグリーン） */}
      <path d="M23 32 Q25 16 40 16 Q55 16 57 32 Q52 20 40 20 Q28 20 23 32 Z" fill="url(#rvHair)" />
      <path d="M23 32 Q20 27 22 37" fill="#15803d" />
      <path d="M57 32 Q60 27 58 37" fill="#15803d" />
      <path d="M30 18 Q34 12 38 18 Q34 16 30 18 Z" fill="#86efac" opacity="0.8" />
      <path d="M42 18 Q46 12 50 18 Q46 16 42 18 Z" fill="#bbf7d0" opacity="0.6" />
      {/* 白メッシュ */}
      <path d="M38 16 Q40 12 42 16" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
      <defs>
        <linearGradient id="rvHair" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#86efac" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {/* 目（穏やか・細め） */}
      <AnimeEye cx={33} cy={38} pupilColor="#15803d" glowColor="#22c55e" lidAngle={2} />
      <AnimeEye cx={47} cy={38} pupilColor="#15803d" glowColor="#22c55e" lidAngle={2} />

      {/* 鼻・口（優しい笑顔） */}
      <path d="M39 43 Q40 45 41 43" stroke="#d4a06a" strokeWidth="0.7" fill="none" />
      <path d="M36 47 Q40 51 44 47" stroke="#e07070" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* ほっぺ */}
      <circle cx="28" cy="44" r="3.5" fill="#86efac" opacity="0.3" />
      <circle cx="52" cy="44" r="3.5" fill="#86efac" opacity="0.3" />

      {/* ホログラムチェックリスト */}
      <motion.g
        animate={isActive ? { y: [-1, 1, -1], opacity: [0.8, 1, 0.8] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="54" y="58" width="22" height="28" rx="3" fill="#022c22" stroke="#22c55e" strokeWidth="1" opacity="0.95" />
        <rect x="56" y="54" width="18" height="6" rx="2" fill="#14532d" stroke="#22c55e" strokeWidth="0.8" />
        <rect x="61" y="53" width="4" height="4" rx="1" fill="#22c55e" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <motion.rect
              x="57" y={64 + i * 5} width="3" height="3" rx="0.5"
              fill={isDone || (isActive && i < 2) ? "#22c55e" : "#14532d"}
              stroke="#22c55e" strokeWidth="0.5"
              animate={isActive && i === 1 ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            {(isDone || (isActive && i < 2)) && (
              <path d={`M${58} ${65.5 + i*5} L${59.5} ${67 + i*5} L${62} ${63.5 + i*5}`}
                stroke="white" strokeWidth="0.8" strokeLinecap="round" />
            )}
            <line x1="62" y1={65.5 + i * 5} x2="73" y2={65.5 + i * 5}
              stroke="#166534" strokeWidth="0.8" />
          </g>
        ))}
      </motion.g>

      {/* スキャンライン */}
      {isActive && (
        <motion.rect x="16" y="50" width="48" height="1.5" rx="0.5"
          fill="#22c55e" opacity="0.4"
          animate={{ y: [50, 58, 50] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {isDone && <DoneBadge x={12} y={18} color="#16a34a" />}
    </svg>
  );
}

// ─── メインエクスポート ────────────────────────────────────────────

const WORKER_VARIANT: Record<string, number> = {
  "worker-1": 0, "worker-2": 1, "worker-3": 2,
};

export default function AgentCharacter({ role, status, agentId }: Props & { agentId?: string }) {
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
        <svg viewBox="0 0 80 100" fill="none">
          <circle cx="40" cy="50" r="22" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <text x="40" y="56" textAnchor="middle" fill="#475569" fontSize="22">⚙</text>
        </svg>
      )}
    </motion.div>
  );
}
