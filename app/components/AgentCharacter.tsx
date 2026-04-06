"use client";

import { motion } from "framer-motion";
import type { AgentRole, AgentStatus } from "../types/agent";

interface Props {
  role: AgentRole;
  status: AgentStatus;
}

// ─── アニメーション variant 定義 ──────────────────────────────────

import type { Transition } from "framer-motion";

type AnimState = { scaleY?: number[]; y?: number[]; rotate?: number[]; transition?: Transition };

const breathe: Record<AgentStatus, AnimState> = {
  idle:      { scaleY: [1, 1.03, 1], y: [0, -1, 0],   transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const } },
  thinking:  { y: [0, -4, 0],                           transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const } },
  done:      { y: [0, -10, 0],                          transition: { duration: 0.4, ease: "backOut" as const, times: [0, 0.4, 1] } },
  waiting:   { scaleY: [1, 1.015, 1],                   transition: { duration: 4,   repeat: Infinity, ease: "easeInOut" as const } },
  reviewing: { rotate: [-1, 1, -1],                     transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const } },
};

// ─── CEO キャラクター ──────────────────────────────────────────────

function CeoCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking";
  const isDone   = status === "done";

  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* グロー背景 */}
      <circle cx="40" cy="55" r="30" fill="url(#ceoGlow)" opacity="0.25" />
      <defs>
        <radialGradient id="ceoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* スーツ本体 */}
      <rect x="18" y="58" width="44" height="34" rx="8" fill="url(#ceoSuit)" />
      <defs>
        <linearGradient id="ceoSuit" x1="18" y1="58" x2="62" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4c1d95" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>

      {/* ネクタイ */}
      <path d="M38 62 L40 58 L42 62 L41 72 L40 74 L39 72 Z" fill="#c4b5fd" />

      {/* ラペル */}
      <path d="M18 62 Q28 60 35 65" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
      <path d="M62 62 Q52 60 45 65" stroke="#7c3aed" strokeWidth="1.5" fill="none" />

      {/* 頭 */}
      <circle cx="40" cy="38" r="16" fill="url(#ceoSkin)" />
      <defs>
        <linearGradient id="ceoSkin" x1="28" y1="24" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* 髪 */}
      <path d="M26 34 Q26 20 40 20 Q54 20 54 34 Q50 26 40 26 Q30 26 26 34 Z" fill="#1c1917" />
      <path d="M54 34 Q56 28 54 24 Q58 26 58 34 Z" fill="#1c1917" />

      {/* 目（クールな半目） */}
      <ellipse cx="34" cy="38" rx="3" ry="2" fill="#1c1917" />
      <ellipse cx="46" cy="38" rx="3" ry="2" fill="#1c1917" />
      <line x1="31" y1="35.5" x2="37" y2="35.5" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="43" y1="35.5" x2="49" y2="35.5" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />

      {/* 口 */}
      <path d="M37 43 Q40 45 43 43" stroke="#c2410c" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* UIパネル（左手） */}
      <motion.g
        animate={isActive ? { opacity: [0.6, 1, 0.6], x: [-1, 1, -1] } : { opacity: 0.7 }}
        transition={isActive ? { duration: 1.2, repeat: Infinity } : {}}
      >
        <rect x="4" y="60" width="16" height="20" rx="3" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1" />
        <line x1="7" y1="65" x2="17" y2="65" stroke="#a855f7" strokeWidth="0.8" opacity="0.8" />
        <line x1="7" y1="68" x2="14" y2="68" stroke="#7c3aed" strokeWidth="0.8" opacity="0.6" />
        <line x1="7" y1="71" x2="16" y2="71" stroke="#a855f7" strokeWidth="0.8" opacity="0.8" />
        <line x1="7" y1="74" x2="13" y2="74" stroke="#7c3aed" strokeWidth="0.8" opacity="0.6" />
      </motion.g>

      {/* 右腕 */}
      <path d="M62 65 Q70 62 72 68 Q70 74 62 78" stroke="#6d28d9" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* 完了チェック */}
      {isDone && (
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <circle cx="64" cy="20" r="10" fill="#a855f7" />
          <path d="M58 20 L62 24 L70 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      )}

      {/* 思考中：光エフェクト */}
      {isActive && (
        <motion.circle
          cx="40" cy="38"
          r="18"
          stroke="#a855f7"
          strokeWidth="1.5"
          fill="none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

// ─── Manager キャラクター ─────────────────────────────────────────

function ManagerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone   = status === "done";

  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="55" r="28" fill="url(#mgGlow)" opacity="0.2" />
      <defs>
        <radialGradient id="mgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 白衣 */}
      <rect x="16" y="56" width="48" height="36" rx="10" fill="url(#mgCoat)" />
      <defs>
        <linearGradient id="mgCoat" x1="16" y1="56" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0c4a6e" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      {/* 胸ポケット */}
      <rect x="42" y="62" width="12" height="8" rx="2" fill="#075985" stroke="#38bdf8" strokeWidth="0.8" />
      <line x1="44" y1="65" x2="52" y2="65" stroke="#38bdf8" strokeWidth="0.6" />
      <line x1="44" y1="67" x2="50" y2="67" stroke="#38bdf8" strokeWidth="0.6" />

      {/* 頭 */}
      <circle cx="40" cy="36" r="16" fill="url(#mgSkin)" />
      <defs>
        <linearGradient id="mgSkin" x1="28" y1="22" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* 髪 */}
      <path d="M26 32 Q28 20 40 20 Q52 20 54 32" fill="#1c1917" />
      <path d="M24 34 Q24 20 28 20" stroke="#1c1917" strokeWidth="3" />
      <path d="M56 34 Q56 20 52 20" stroke="#1c1917" strokeWidth="3" />

      {/* メガネ */}
      <circle cx="34" cy="36" r="5" stroke="#bae6fd" strokeWidth="1.5" fill="none" />
      <circle cx="46" cy="36" r="5" stroke="#bae6fd" strokeWidth="1.5" fill="none" />
      <line x1="39" y1="36" x2="41" y2="36" stroke="#bae6fd" strokeWidth="1.2" />
      <line x1="24" y1="34" x2="29" y2="35" stroke="#bae6fd" strokeWidth="1.2" />
      <line x1="56" y1="34" x2="51" y2="35" stroke="#bae6fd" strokeWidth="1.2" />

      {/* 目 */}
      <circle cx="34" cy="36" r="2.5" fill="#1c1917" />
      <circle cx="46" cy="36" r="2.5" fill="#1c1917" />
      <circle cx="34.8" cy="35.2" r="0.7" fill="white" />
      <circle cx="46.8" cy="35.2" r="0.7" fill="white" />

      {/* 口（分析的な表情） */}
      <path d="M37 42 L40 43 L43 42" stroke="#c2410c" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* タブレット */}
      <motion.g
        animate={isActive ? { rotate: [-2, 2, -2] } : {}}
        transition={isActive ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}}
        style={{ transformOrigin: "44px 72px" }}
      >
        <rect x="34" y="64" width="26" height="18" rx="3" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.2" />
        {isActive && (
          <>
            <motion.line x1="37" y1="68" x2="57" y2="68" stroke="#38bdf8" strokeWidth="0.8"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
            />
            <motion.line x1="37" y1="71" x2="52" y2="71" stroke="#7dd3fc" strokeWidth="0.8"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
            />
            <motion.line x1="37" y1="74" x2="55" y2="74" stroke="#38bdf8" strokeWidth="0.8"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
        {!isActive && (
          <>
            <rect x="37" y="68" width="10" height="5" rx="1" fill="#075985" />
            <rect x="49" y="68" width="8" height="5" rx="1" fill="#075985" />
            <line x1="37" y1="75" x2="57" y2="75" stroke="#0284c7" strokeWidth="0.8" />
          </>
        )}
      </motion.g>

      {/* 左腕 */}
      <path d="M16 65 Q10 70 12 78" stroke="#0369a1" strokeWidth="6" strokeLinecap="round" fill="none" />

      {isDone && (
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <circle cx="64" cy="20" r="10" fill="#0ea5e9" />
          <path d="M58 20 L62 24 L70 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      )}
    </svg>
  );
}

// ─── Worker キャラクター ──────────────────────────────────────────

function WorkerCharacter({ status, variant = 0 }: { status: AgentStatus; variant?: number }) {
  const isActive = status === "thinking";
  const isDone   = status === "done";

  const toolColors = ["#fb923c", "#f97316", "#ea580c"];
  const col = toolColors[variant % 3];

  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="55" r="28" fill="url(#wkGlow)" opacity="0.2" />
      <defs>
        <radialGradient id={`wkGlow${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={col} />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 作業着 */}
      <rect x="16" y="58" width="48" height="34" rx="8" fill="url(#wkSuit)" />
      <defs>
        <linearGradient id={`wkSuit${variant}`} x1="16" y1="58" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#431407" />
          <stop offset="1" stopColor={col} stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* ストラップ */}
      <path d="M32 58 L32 54 Q34 52 40 52 Q46 52 48 54 L48 58" stroke={col} strokeWidth="2" fill="none" />

      {/* ヘルメット */}
      <path d="M24 36 Q24 20 40 20 Q56 20 56 36 Q56 30 40 30 Q24 30 24 36 Z" fill={col} />
      <rect x="22" y="34" width="36" height="5" rx="2" fill={col} opacity="0.9" />
      <rect x="26" y="35" width="6" height="3" rx="1" fill="rgba(255,255,255,0.4)" />

      {/* 頭 */}
      <ellipse cx="40" cy="40" rx="14" ry="13" fill="url(#wkSkin)" />
      <defs>
        <linearGradient id="wkSkin" x1="28" y1="28" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* 目（元気な丸目） */}
      <circle cx="34" cy="40" r="3" fill="#1c1917" />
      <circle cx="46" cy="40" r="3" fill="#1c1917" />
      <circle cx="35" cy="39" r="1" fill="white" />
      <circle cx="47" cy="39" r="1" fill="white" />

      {/* 口（笑顔） */}
      <path d="M35 46 Q40 50 45 46" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* ほっぺ */}
      <circle cx="30" cy="44" r="3" fill="#fca5a5" opacity="0.5" />
      <circle cx="50" cy="44" r="3" fill="#fca5a5" opacity="0.5" />

      {/* レンチ（右手） */}
      <motion.g
        animate={isActive ? { rotate: [-15, 15, -15] } : {}}
        transition={isActive ? { duration: 0.5, repeat: Infinity } : {}}
        style={{ transformOrigin: "65px 70px" }}
      >
        <rect x="60" y="62" width="5" height="18" rx="2" fill="#78716c" />
        <ellipse cx="62.5" cy="62" rx="5" ry="3" fill="#a8a29e" />
        <ellipse cx="62.5" cy="80" rx="3.5" ry="2" fill="#a8a29e" />
      </motion.g>

      {/* 作業中の光 */}
      {isActive && (
        <motion.g
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          <circle cx="63" cy="64" r="4" fill={col} opacity="0.5" />
        </motion.g>
      )}

      {isDone && (
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 12 }}
        >
          <circle cx="64" cy="18" r="10" fill={col} />
          <path d="M58 18 L62 22 L70 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      )}
    </svg>
  );
}

// ─── Reviewer キャラクター ────────────────────────────────────────

function ReviewerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "reviewing" || status === "thinking";
  const isDone   = status === "done";

  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="55" r="28" fill="url(#rvGlow)" opacity="0.2" />
      <defs>
        <radialGradient id="rvGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ジャケット */}
      <rect x="16" y="57" width="48" height="35" rx="10" fill="url(#rvJacket)" />
      <defs>
        <linearGradient id="rvJacket" x1="16" y1="57" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14532d" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {/* エンブレム */}
      <circle cx="30" cy="67" r="5" fill="#15803d" stroke="#22c55e" strokeWidth="1" />
      <path d="M27 67 L29 69 L33 65" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* 頭 */}
      <circle cx="40" cy="36" r="15" fill="url(#rvSkin)" />
      <defs>
        <linearGradient id="rvSkin" x1="28" y1="22" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* 髪 */}
      <path d="M28 30 Q30 20 40 20 Q50 20 52 30" fill="#44403c" />
      <path d="M52 30 Q54 24 52 22 Q56 22 56 30 Z" fill="#44403c" />

      {/* 目（穏やかな細目） */}
      <path d="M32 37 Q34 34 36 37" stroke="#1c1917" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M44 37 Q46 34 48 37" stroke="#1c1917" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* 口（優しい笑顔） */}
      <path d="M36 43 Q40 47 44 43" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* クリップボード */}
      <motion.g
        animate={isActive ? { y: [-1, 1, -1] } : {}}
        transition={isActive ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
      >
        <rect x="44" y="63" width="20" height="24" rx="2" fill="#052e16" stroke="#22c55e" strokeWidth="1" />
        <rect x="46" y="60" width="16" height="5" rx="2" fill="#15803d" />
        <rect x="52" y="59" width="4" height="3" rx="1" fill="#22c55e" />

        {/* チェックリスト */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <motion.rect
              x="46" y={69 + i * 5} width="3" height="3" rx="0.5"
              fill={isActive && i === 0 ? "#22c55e" : isDone ? "#22c55e" : "#1a2e1a"}
              stroke="#22c55e" strokeWidth="0.5"
              animate={isActive && i === 0 ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            {(isDone || (isActive && i < 1)) && (
              <path
                d={`M${47} ${70.5 + i * 5} L${48} ${71.5 + i * 5} L${50} ${69.5 + i * 5}`}
                stroke="white" strokeWidth="0.8" strokeLinecap="round"
              />
            )}
            <line x1="51" y1={70.5 + i * 5} x2="62" y2={70.5 + i * 5}
              stroke="#166534" strokeWidth="0.8" />
          </g>
        ))}
      </motion.g>

      {/* 審査中のスキャン光 */}
      {isActive && (
        <motion.line
          x1="16" y1="55" x2="64" y2="55"
          stroke="#22c55e"
          strokeWidth="1.5"
          opacity="0.5"
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {isDone && (
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <circle cx="14" cy="20" r="10" fill="#22c55e" />
          <path d="M8 20 L12 24 L20 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      )}
    </svg>
  );
}

// ─── メインエクスポート ──────────────────────────────────────────

export default function AgentCharacter({ role, status }: Props) {
  const variantMap: Record<string, number> = {
    "worker-1": 0, "worker-2": 1, "worker-3": 2,
  };

  // roleがworkerのとき variant でキャラを少し変える
  const animVariant = breathe[status] ?? breathe.idle;

  return (
    <motion.div
      style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
      animate={animVariant}
    >
      {role === "ceo"      && <CeoCharacter status={status} />}
      {role === "manager"  && <ManagerCharacter status={status} />}
      {role === "worker"   && <WorkerCharacter status={status} variant={variantMap[role] ?? 0} />}
      {role === "reviewer" && <ReviewerCharacter status={status} />}
      {role === "system"   && (
        <svg viewBox="0 0 80 100" fill="none">
          <circle cx="40" cy="50" r="20" fill="#334155" />
          <text x="40" y="56" textAnchor="middle" fill="#94a3b8" fontSize="20">⚙</text>
        </svg>
      )}
    </motion.div>
  );
}
