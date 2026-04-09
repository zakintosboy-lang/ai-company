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

// ─── 共通VTuberパーツ（目・髪・顔）を返す関数 ─────────────────────────
// Each character calls this with their unique gradient prefix.

interface BaseProps {
  p: string; // gradient ID prefix
  outfitFill: string;
  outfitFillDark: string;
  outfitFront: string;
  glowColor: string;
}

function VTuberBase({ p, outfitFill, outfitFillDark, outfitFront, glowColor }: BaseProps) {
  return (
    <>
      {/* background glow */}
      <ellipse cx="50" cy="82" rx="40" ry="34" fill={`url(#${p}Glow)`} />

      {/* back hair — long silver-blue */}
      <path d="M30 44 C22 65,16 90,18 116 C22 120,28 118,28 116 C28 92,28 70,34 52Z"
        fill={`url(#${p}Hair)`} opacity="0.88" />
      <path d="M70 44 C78 65,84 90,82 116 C78 120,72 118,72 116 C72 92,72 70,66 52Z"
        fill={`url(#${p}Hair)`} opacity="0.88" />
      <path d="M26 52 C18 76,18 103,20 116 C22 119,25 117,24 116 C22 98,22 78,26 62Z"
        fill="#90b8d8" opacity="0.45" />
      <path d="M74 52 C82 76,82 103,80 116 C78 119,75 117,76 116 C78 98,78 78,74 62Z"
        fill="#90b8d8" opacity="0.45" />

      {/* neck */}
      <path d="M43 70 Q43 82,45 87 L55 87 Q57 82,57 70Z" fill={`url(#${p}Skin)`} />
      <path d="M45 72 Q45 80,47 85 L53 85 Q55 80,55 72Z" fill="#e8c090" opacity="0.22" />

      {/* outfit body */}
      <path d="M18 130 Q20 96,37 88 L50 93 L63 88 Q80 96,82 130Z" fill={outfitFill} />
      <path d="M40 89 L50 94 L60 89 L60 130 L40 130Z" fill={outfitFront} opacity="0.92" />
      <path d="M37 88 Q41 93,44 97 L42 130 L18 130 Q20 96,37 88Z" fill={outfitFillDark} />
      <path d="M63 88 Q59 93,56 97 L58 130 L82 130 Q80 96,63 88Z" fill={outfitFillDark} />

      {/* face */}
      <ellipse cx="50" cy="50" rx="22" ry="23" fill={`url(#${p}Skin)`} />
      <ellipse cx="50" cy="56" rx="18" ry="15" fill="#f0c090" opacity="0.1" />

      {/* front bangs — straight, silver-blue */}
      <path d="M28 46 Q30 26,50 24 Q70 26,72 46 Q64 32,50 32 Q36 32,28 46Z"
        fill={`url(#${p}HairF)`} />
      <path d="M30 46 Q28 38,30 52 L32 52 Q31 40,30 46Z" fill="#b0cce8" opacity="0.65" />
      <path d="M70 46 Q72 38,70 52 L68 52 Q69 40,70 46Z" fill="#b0cce8" opacity="0.65" />
      <path d="M34 32 Q32 26,38 34 Q36 28,34 32Z" fill="#daeef8" opacity="0.8" />
      <path d="M66 32 Q68 26,62 34 Q64 28,66 32Z" fill="#daeef8" opacity="0.8" />
      {/* hair highlight shine */}
      <path d="M36 28 Q42 24,48 30 Q42 25,36 28Z" fill="white" opacity="0.28" />

      {/* blue ribbon bow (right side of head) */}
      <path d="M62 37 Q59 29,66 32 Q68 30,70 36 Q67 41,62 37Z" fill="#2e88cc" />
      <path d="M62 37 Q59 29,66 32 Q68 30,70 36 Q67 41,62 37Z" fill="#66b8f0" opacity="0.35" />
      <path d="M78 37 Q81 29,74 32 Q72 30,70 36 Q73 41,78 37Z" fill="#2e88cc" />
      <path d="M78 37 Q81 29,74 32 Q72 30,70 36 Q73 41,78 37Z" fill="#66b8f0" opacity="0.35" />
      <ellipse cx="70" cy="36" rx="3" ry="2.5" fill="#1a6aaa" stroke="#66b8f0" strokeWidth="0.5" />
      <path d="M69 39 Q65 46,63 52" stroke="#1a6aaa" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M71 39 Q75 46,77 52" stroke="#1a6aaa" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* ears */}
      <ellipse cx="28" cy="52" rx="3.5" ry="4.5" fill="#fddcb5" />
      <ellipse cx="28" cy="52" rx="2" ry="2.8" fill="#f0b888" opacity="0.4" />
      <ellipse cx="72" cy="52" rx="3.5" ry="4.5" fill="#fddcb5" />
      <ellipse cx="72" cy="52" rx="2" ry="2.8" fill="#f0b888" opacity="0.4" />

      {/* eyebrows */}
      <path d="M35 42 Q39 39.5,43 41" stroke="#7060a8" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M57 41 Q61 39.5,65 42" stroke="#7060a8" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* left eye */}
      <ellipse cx="40" cy="49" rx="6.5" ry="6" fill="white" />
      <ellipse cx="40" cy="49.5" rx="5" ry="5.2" fill={`url(#${p}Iris)`} />
      <ellipse cx="40" cy="50" rx="3.2" ry="3.5" fill="#2838a0" />
      <circle cx="40" cy="49.5" r="1.8" fill="#101838" />
      <ellipse cx="41.2" cy="46.5" rx="1.5" ry="1.2" fill="white" opacity="0.95" />
      <circle cx="38" cy="51.5" r="0.7" fill="white" opacity="0.55" />
      <path d="M33.5 46 Q37 43.5,42 44 Q44.5 44.5,45.5 46.5"
        stroke="#101838" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M34 45.8 Q33.5 44.5,34.8 44" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M36.5 44.2 Q36 43,37.5 42.6" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M39 43.5 Q39 42.2,40.2 42" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M41.8 43.8 Q42.5 42.6,43.5 43" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M44.2 45 Q45.2 44.2,46 44.8" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* right eye */}
      <ellipse cx="60" cy="49" rx="6.5" ry="6" fill="white" />
      <ellipse cx="60" cy="49.5" rx="5" ry="5.2" fill={`url(#${p}Iris)`} />
      <ellipse cx="60" cy="50" rx="3.2" ry="3.5" fill="#2838a0" />
      <circle cx="60" cy="49.5" r="1.8" fill="#101838" />
      <ellipse cx="61.2" cy="46.5" rx="1.5" ry="1.2" fill="white" opacity="0.95" />
      <circle cx="58" cy="51.5" r="0.7" fill="white" opacity="0.55" />
      <path d="M54.5 46.5 Q57.5 44.5,62 44 Q64.5 44.5,65.5 46"
        stroke="#101838" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M55 45.8 Q54.5 44.5,55.8 44" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M57.5 44.2 Q57 43,58.5 42.6" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M60 43.5 Q60 42.2,61.2 42" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M62.8 43.8 Q63.5 42.6,64.5 43" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M65.2 45 Q66.2 44.2,67 44.8" stroke="#3040b0" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* nose */}
      <path d="M49 58 Q50 60.5,51 58" stroke="#d4956a" strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* mouth — soft smile */}
      <path d="M44 65 Q47 67.5,50 67.5 Q53 67.5,56 65"
        stroke="#e07878" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M46 65 Q50 67.5,54 65 Q52.5 68.2,50 68.2 Q47.5 68.2,46 65Z"
        fill="#f49cac" opacity="0.5" />

      {/* blush */}
      <ellipse cx="33" cy="57" rx="5.5" ry="3" fill="#ffaec9" opacity="0.35" filter={`url(#${p}Blur)`} />
      <ellipse cx="67" cy="57" rx="5.5" ry="3" fill="#ffaec9" opacity="0.35" filter={`url(#${p}Blur)`} />

      {/* unused glow param suppressor */}
      <g opacity="0" aria-hidden><circle r="0" fill={glowColor} /></g>
    </>
  );
}

// ─── CEO ─────────────────────────────────────────────────────────
function CeoCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="ceoGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ceoHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#d8eaf8" /><stop offset="0.5" stopColor="#a8c8e8" />
          <stop offset="1" stopColor="#80a8d4" />
        </linearGradient>
        <linearGradient id="ceoHairF" x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor="#e0eef8" /><stop offset="0.6" stopColor="#b8d2f0" />
          <stop offset="1" stopColor="#90b8dc" />
        </linearGradient>
        <linearGradient id="ceoIris" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop stopColor="#7080d8" /><stop offset="1" stopColor="#3848a0" />
        </linearGradient>
        <radialGradient id="ceoSkin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff0e0" />
          <stop offset="70%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <filter id="ceoBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      <VTuberBase p="ceo"
        outfitFill="url(#ceoOutfit)" outfitFillDark="#4c1d95" outfitFront="#f8f4ff"
        glowColor="#c4b5fd" />

      {/* CEO-specific defs inline */}
      <defs>
        <linearGradient id="ceoOutfit" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#7c3aed" /><stop offset="1" stopColor="#3b0764" />
        </linearGradient>
      </defs>

      {/* necktie */}
      <path d="M48 91 L50 89 L52 91 L51 110 L50 112 L49 110Z" fill="#a855f7" />
      <path d="M48 91 L50 89 L52 91 L50 95Z" fill="#7c3aed" />

      {/* hologram panel */}
      <motion.g
        animate={isActive ? { opacity: [0.7, 1, 0.7], x: [0, 0.8, 0] } : { opacity: 0.55 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="75" y="62" width="20" height="28" rx="3" fill="#0f0a30" stroke="#a855f7" strokeWidth="0.8" opacity="0.9" />
        <rect x="75" y="62" width="20" height="6" rx="3" fill="#3b0764" />
        {[0,1,2].map(i => (
          <g key={i}>
            <line x1="78" y1={71 + i*7} x2="92" y2={71 + i*7} stroke="#7c3aed" strokeWidth="0.7" opacity="0.6" />
            <motion.rect x="78" y={68 + i*7} width="8" height="2" rx="1"
              fill="#a855f7" opacity="0.65"
              animate={isActive ? { width: [8, 14 - i*2, 8] } : {}}
              transition={{ duration: 1.5 + i*0.3, repeat: Infinity }}
            />
          </g>
        ))}
      </motion.g>

      {isDone && <DoneBadge x={16} y={22} color="#7c3aed" />}
    </svg>
  );
}

// ─── Manager ─────────────────────────────────────────────────────
function ManagerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="mgrGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mgrHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#d8eaf8" /><stop offset="0.5" stopColor="#a8c8e8" />
          <stop offset="1" stopColor="#80a8d4" />
        </linearGradient>
        <linearGradient id="mgrHairF" x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor="#e0eef8" /><stop offset="0.6" stopColor="#b8d2f0" />
          <stop offset="1" stopColor="#90b8dc" />
        </linearGradient>
        <linearGradient id="mgrIris" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop stopColor="#6090e0" /><stop offset="1" stopColor="#1848b0" />
        </linearGradient>
        <radialGradient id="mgrSkin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff0e0" />
          <stop offset="70%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <linearGradient id="mgrOutfit" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#2563eb" /><stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <filter id="mgrBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      <VTuberBase p="mgr"
        outfitFill="url(#mgrOutfit)" outfitFillDark="#1e3a8a" outfitFront="#eff6ff"
        glowColor="#93c5fd" />

      {/* collar + bow tie */}
      <path d="M47 90 L50 92 L53 90 L52 94 L50 95 L48 94Z" fill="#dbeafe" />
      <path d="M48 90 L46 92 L50 92Z" fill="#93c5fd" />
      <path d="M52 90 L54 92 L50 92Z" fill="#93c5fd" />

      {/* clipboard */}
      <motion.g
        animate={isActive ? { rotate: [-2, 2, -2] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "82px 80px" }}>
        <rect x="73" y="60" width="18" height="24" rx="2" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="0.8" />
        <rect x="79" y="58" width="6" height="4" rx="1" fill="#3b82f6" />
        <rect x="75" y="65" width="14" height="1.5" rx="0.75" fill="#60a5fa" opacity="0.7" />
        <rect x="75" y="69" width="11" height="1.5" rx="0.75" fill="#60a5fa" opacity="0.7" />
        <rect x="75" y="73" width="13" height="1.5" rx="0.75" fill="#60a5fa" opacity="0.7" />
        <rect x="75" y="77" width="8" height="1.5" rx="0.75" fill="#60a5fa" opacity="0.7" />
        <motion.rect x="75" y="65" width="0" height="14"
          fill="#93c5fd" opacity="0.15"
          animate={isActive ? { width: [0, 14, 0] } : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </motion.g>

      {isDone && <DoneBadge x={16} y={22} color="#2563eb" />}
    </svg>
  );
}

// ─── Worker ──────────────────────────────────────────────────────
function WorkerCharacter({ status, variant }: { status: AgentStatus; variant: number }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="wkGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#fdba74" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#c2410c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wkHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#d8eaf8" /><stop offset="0.5" stopColor="#a8c8e8" />
          <stop offset="1" stopColor="#80a8d4" />
        </linearGradient>
        <linearGradient id="wkHairF" x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor="#e0eef8" /><stop offset="0.6" stopColor="#b8d2f0" />
          <stop offset="1" stopColor="#90b8dc" />
        </linearGradient>
        <linearGradient id="wkIris" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop stopColor="#fb923c" /><stop offset="1" stopColor="#9a3412" />
        </linearGradient>
        <radialGradient id="wkSkin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff0e0" />
          <stop offset="70%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <linearGradient id="wkOutfit" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ea580c" /><stop offset="1" stopColor="#7c2d12" />
        </linearGradient>
        <filter id="wkBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      <VTuberBase p="wk"
        outfitFill="url(#wkOutfit)" outfitFillDark="#9a3412" outfitFront="#fff7ed"
        glowColor="#fdba74" />

      {/* casual hoodie pocket */}
      <path d="M42 115 Q50 118 58 115 L58 130 L42 130Z" fill="#9a3412" opacity="0.5" />

      {/* variant accessory */}
      {variant === 0 && (
        /* gear icon for Fast worker */
        <motion.g
          animate={isActive ? { rotate: [0, 360] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "82px 72px" }}>
          <circle cx="82" cy="72" r="9" fill="#7c2d12" stroke="#fb923c" strokeWidth="1" />
          <circle cx="82" cy="72" r="5" fill="#431407" />
          {[0,45,90,135,180,225,270,315].map((deg, i) => (
            <rect key={i} x="81" y="63" width="2" height="4" rx="1" fill="#fb923c"
              style={{ transformOrigin: "82px 72px", transform: `rotate(${deg}deg)` }} />
          ))}
          <circle cx="82" cy="72" r="2.5" fill="#fb923c" opacity="0.8" />
        </motion.g>
      )}
      {variant === 1 && (
        /* terminal for Core worker */
        <motion.g
          animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 0.65 }}
          transition={{ duration: 1.2, repeat: Infinity }}>
          <rect x="72" y="62" width="22" height="18" rx="3" fill="#1c0a00" stroke="#fb923c" strokeWidth="0.8" />
          <path d="M75 68 L79 71 L75 74" stroke="#fb923c" strokeWidth="1" fill="none" strokeLinecap="round" />
          <line x1="81" y1="74" x2="89" y2="74" stroke="#fb923c" strokeWidth="1" />
          <motion.rect x="75" y="66" width="1.5" height="4" rx="0.5" fill="#fb923c"
            animate={isActive ? { opacity: [1, 0, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </motion.g>
      )}
      {variant === 2 && (
        /* feather pen for Quality worker */
        <motion.g
          animate={isActive ? { rotate: [-5, 5, -5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "82px 68px" }}>
          <path d="M76 80 Q80 65,88 60" stroke="#fb923c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M78 78 Q80 70,86 62 Q84 68,82 72 Q80 76,78 78Z" fill="#fdba74" opacity="0.7" />
          <path d="M76 80 L74 84" stroke="#9a3412" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </motion.g>
      )}

      {isDone && <DoneBadge x={16} y={22} color="#ea580c" />}
    </svg>
  );
}

// ─── Reviewer ────────────────────────────────────────────────────
function ReviewerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="rvGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rvHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#d8eaf8" /><stop offset="0.5" stopColor="#a8c8e8" />
          <stop offset="1" stopColor="#80a8d4" />
        </linearGradient>
        <linearGradient id="rvHairF" x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor="#e0eef8" /><stop offset="0.6" stopColor="#b8d2f0" />
          <stop offset="1" stopColor="#90b8dc" />
        </linearGradient>
        <linearGradient id="rvIris" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop stopColor="#34d399" /><stop offset="1" stopColor="#065f46" />
        </linearGradient>
        <radialGradient id="rvSkin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff0e0" />
          <stop offset="70%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <linearGradient id="rvOutfit" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#059669" /><stop offset="1" stopColor="#064e3b" />
        </linearGradient>
        <filter id="rvBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      <VTuberBase p="rv"
        outfitFill="url(#rvOutfit)" outfitFillDark="#064e3b" outfitFront="#f0fdf4"
        glowColor="#6ee7b7" />

      {/* badge on collar */}
      <circle cx="50" cy="92" r="3.5" fill="#064e3b" stroke="#34d399" strokeWidth="0.7" />
      <path d="M48 92 L50 90 L52 92 L51.5 94 L48.5 94Z" fill="#34d399" opacity="0.8" />

      {/* magnifying glass */}
      <motion.g
        animate={isActive ? { x: [-2, 2, -2], y: [0, -1, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="79" cy="68" r="9" fill="none" stroke="#34d399" strokeWidth="2" />
        <circle cx="79" cy="68" r="6.5" fill="#022c22" opacity="0.8" />
        <line x1="86" y1="75" x2="93" y2="82" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
        {isActive && (
          <motion.circle cx="79" cy="68" r="4" fill="#34d399" opacity="0.15"
            animate={{ r: [4, 6, 4] }} transition={{ duration: 1, repeat: Infinity }} />
        )}
        <line x1="76" y1="65" x2="82" y2="71" stroke="#6ee7b7" strokeWidth="0.8" opacity="0.5" />
      </motion.g>

      {isDone && <DoneBadge x={16} y={22} color="#059669" />}
    </svg>
  );
}

// ─── Researcher ──────────────────────────────────────────────────
function ResearcherCharacter({ status, agentId }: { status: AgentStatus; agentId?: string }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone = status === "done";
  const variant = agentId === "researcher-2" ? "compare" : agentId === "researcher-3" ? "source" : "news";

  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="rsGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rsHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#d8eaf8" /><stop offset="0.5" stopColor="#a8c8e8" />
          <stop offset="1" stopColor="#80a8d4" />
        </linearGradient>
        <linearGradient id="rsHairF" x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor="#e0eef8" /><stop offset="0.6" stopColor="#b8d2f0" />
          <stop offset="1" stopColor="#90b8dc" />
        </linearGradient>
        <linearGradient id="rsIris" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop stopColor="#38bdf8" /><stop offset="1" stopColor="#0c4a6e" />
        </linearGradient>
        <radialGradient id="rsSkin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff0e0" />
          <stop offset="70%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <linearGradient id="rsOutfit" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#0ea5e9" /><stop offset="1" stopColor="#075985" />
        </linearGradient>
        <filter id="rsBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      <VTuberBase p="rs"
        outfitFill="url(#rsOutfit)" outfitFillDark="#075985" outfitFront="#f0f9ff"
        glowColor="#7dd3fc" />

      {/* glasses (Researcher has glasses) */}
      <g opacity="0.9">
        <rect x="33" y="46" width="13" height="9" rx="4.5" fill="none" stroke="#0c4a6e" strokeWidth="1" />
        <rect x="53" y="46" width="13" height="9" rx="4.5" fill="none" stroke="#0c4a6e" strokeWidth="1" />
        <line x1="46" y1="50.5" x2="53" y2="50.5" stroke="#0c4a6e" strokeWidth="1" />
        <line x1="27" y1="50.5" x2="33" y2="50.5" stroke="#0c4a6e" strokeWidth="1" />
        <line x1="66" y1="50.5" x2="72" y2="50.5" stroke="#0c4a6e" strokeWidth="1" />
        <rect x="33" y="46" width="13" height="9" rx="4.5" fill="#bae6fd" opacity="0.12" />
        <rect x="53" y="46" width="13" height="9" rx="4.5" fill="#bae6fd" opacity="0.12" />
      </g>

      {/* accessory by variant */}
      {variant === "news" && (
        /* newspaper/tablet */
        <motion.g
          animate={isActive ? { y: [-1, 1, -1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}>
          <rect x="73" y="60" width="22" height="28" rx="2" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="0.8" />
          <rect x="75" y="62" width="18" height="5" rx="1" fill="#075985" />
          <rect x="75" y="69" width="18" height="1.5" rx="0.5" fill="#7dd3fc" opacity="0.6" />
          <rect x="75" y="73" width="13" height="1.5" rx="0.5" fill="#7dd3fc" opacity="0.6" />
          <rect x="75" y="77" width="16" height="1.5" rx="0.5" fill="#7dd3fc" opacity="0.6" />
          <rect x="75" y="81" width="10" height="1.5" rx="0.5" fill="#7dd3fc" opacity="0.6" />
          {isActive && <motion.rect x="75" y="62" width="18" height="26" fill="#38bdf8"
            opacity="0.07" animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 1.2, repeat: Infinity }} />}
        </motion.g>
      )}
      {variant === "compare" && (
        /* comparison chart */
        <motion.g
          animate={isActive ? { opacity: [0.75, 1, 0.75] } : { opacity: 0.7 }}
          transition={{ duration: 1.8, repeat: Infinity }}>
          <rect x="73" y="60" width="22" height="28" rx="2" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="0.8" />
          <line x1="84" y1="62" x2="84" y2="88" stroke="#38bdf8" strokeWidth="0.6" />
          {[0,1,2,3].map(i => (
            <g key={i}>
              <rect x="75" y={64+i*6} width={[7,5,8,4][i]} height="3.5" rx="1" fill="#0ea5e9" opacity="0.7" />
              <rect x="85" y={64+i*6} width={[5,8,3,7][i]} height="3.5" rx="1" fill="#38bdf8" opacity="0.7" />
            </g>
          ))}
        </motion.g>
      )}
      {variant === "source" && (
        /* open book */
        <motion.g
          animate={isActive ? { rotate: [-2, 2, -2] } : {}}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ transformOrigin: "84px 76px" }}>
          <path d="M73 66 Q84 63,95 66 L95 88 Q84 85,73 88Z" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="0.8" />
          <line x1="84" y1="64" x2="84" y2="87" stroke="#38bdf8" strokeWidth="0.6" />
          <line x1="76" y1="71" x2="83" y2="71" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.7" />
          <line x1="76" y1="74" x2="83" y2="74" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.7" />
          <line x1="76" y1="77" x2="83" y2="77" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.7" />
          <line x1="85" y1="71" x2="93" y2="71" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.7" />
          <line x1="85" y1="74" x2="93" y2="74" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.7" />
          <line x1="85" y1="77" x2="93" y2="77" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.7" />
        </motion.g>
      )}

      {isDone && <DoneBadge x={16} y={22} color="#0ea5e9" />}
    </svg>
  );
}

// ─── Editor ──────────────────────────────────────────────────────
function EditorCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="edGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#d9f99d" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3f6212" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="edHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#d8eaf8" /><stop offset="0.5" stopColor="#a8c8e8" />
          <stop offset="1" stopColor="#80a8d4" />
        </linearGradient>
        <linearGradient id="edHairF" x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor="#e0eef8" /><stop offset="0.6" stopColor="#b8d2f0" />
          <stop offset="1" stopColor="#90b8dc" />
        </linearGradient>
        <linearGradient id="edIris" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop stopColor="#86efac" /><stop offset="1" stopColor="#3f6212" />
        </linearGradient>
        <radialGradient id="edSkin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff0e0" />
          <stop offset="70%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <linearGradient id="edOutfit" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#84cc16" /><stop offset="1" stopColor="#3f6212" />
        </linearGradient>
        <filter id="edBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      <VTuberBase p="ed"
        outfitFill="url(#edOutfit)" outfitFillDark="#3f6212" outfitFront="#f7fee7"
        glowColor="#d9f99d" />

      {/* scarf/neckerchief */}
      <path d="M43 88 Q50 92 57 88 L55 96 Q50 98 45 96Z" fill="#65a30d" opacity="0.7" />

      {/* pencil */}
      <motion.g
        animate={isActive ? { rotate: [-8, 8, -8] } : {}}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "82px 72px" }}>
        <rect x="79" y="58" width="4" height="26" rx="2" fill="#fef08a" stroke="#a3a300" strokeWidth="0.5" />
        <polygon points="79,84 83,84 81,90" fill="#f5c09a" />
        <polygon points="79.5,84 82.5,84 81,88" fill="#d4784a" />
        <rect x="79" y="58" width="4" height="3" rx="1" fill="#d4d4d4" />
        <line x1="81" y1="61" x2="81" y2="83" stroke="#a3a300" strokeWidth="0.4" opacity="0.5" />
        {isActive && (
          <motion.line x1="76" y1="90" x2="86" y2="90" stroke="#84cc16" strokeWidth="0.8"
            animate={{ x1: [76, 73, 76], x2: [86, 89, 86] }}
            transition={{ duration: 1.4, repeat: Infinity }} />
        )}
      </motion.g>

      {isDone && <DoneBadge x={16} y={22} color="#84cc16" />}
    </svg>
  );
}

// ─── Designer ────────────────────────────────────────────────────
function DesignerCharacter({ status }: { status: AgentStatus }) {
  const isActive = status === "thinking" || status === "reviewing";
  const isDone = status === "done";
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="dsGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#9d174d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dsHair" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#d8eaf8" /><stop offset="0.5" stopColor="#a8c8e8" />
          <stop offset="1" stopColor="#80a8d4" />
        </linearGradient>
        <linearGradient id="dsHairF" x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor="#e0eef8" /><stop offset="0.6" stopColor="#b8d2f0" />
          <stop offset="1" stopColor="#90b8dc" />
        </linearGradient>
        <linearGradient id="dsIris" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop stopColor="#f472b6" /><stop offset="1" stopColor="#9d174d" />
        </linearGradient>
        <radialGradient id="dsSkin" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff0e0" />
          <stop offset="70%" stopColor="#fddcb5" />
          <stop offset="100%" stopColor="#f0c090" />
        </radialGradient>
        <linearGradient id="dsOutfit" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ec4899" /><stop offset="1" stopColor="#831843" />
        </linearGradient>
        <filter id="dsBlur"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>

      <VTuberBase p="ds"
        outfitFill="url(#dsOutfit)" outfitFillDark="#831843" outfitFront="#fdf2f8"
        glowColor="#f9a8d4" />

      {/* ruffle collar */}
      <path d="M43 89 Q46 92 50 91 Q54 92 57 89 Q54 95 50 94 Q46 95 43 89Z" fill="#f9a8d4" opacity="0.6" />

      {/* paint palette */}
      <motion.g
        animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "82px 75px" }}>
        <ellipse cx="82" cy="75" rx="11" ry="9" fill="#831843" stroke="#f9a8d4" strokeWidth="0.8" />
        <ellipse cx="87" cy="71" rx="2.5" ry="2.5" fill="#831843" />
        {/* color dots */}
        <circle cx="76" cy="71" r="2.2" fill="#f59e0b" />
        <circle cx="80" cy="69" r="2.2" fill="#22c55e" />
        <circle cx="84" cy="69" r="2.2" fill="#3b82f6" />
        <circle cx="76" cy="78" r="2.2" fill="#ef4444" />
        <circle cx="88" cy="75" r="2.2" fill="#a855f7" />
      </motion.g>

      {/* paint brush */}
      <motion.g
        animate={isActive ? { rotate: [-10, 10, -10] } : {}}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "93px 60px" }}>
        <line x1="89" y1="56" x2="97" y2="64" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="97" cy="65" rx="2" ry="3.5"
          style={{ transform: "rotate(45deg)", transformOrigin: "97px 65px" }}
          fill="#f9a8d4" />
        {isActive && (
          <motion.circle cx="97" cy="65" r="2" fill="#f472b6" opacity="0.4"
            animate={{ r: [2, 4, 2], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity }} />
        )}
      </motion.g>

      {isDone && <DoneBadge x={16} y={22} color="#ec4899" />}
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
      {role === "ceo"        && <CeoCharacter status={status} />}
      {role === "manager"    && <ManagerCharacter status={status} />}
      {role === "worker"     && <WorkerCharacter status={status} variant={workerVariant} />}
      {role === "reviewer"   && <ReviewerCharacter status={status} />}
      {role === "researcher" && <ResearcherCharacter status={status} agentId={agentId} />}
      {role === "editor"     && <EditorCharacter status={status} />}
      {role === "designer"   && <DesignerCharacter status={status} />}
      {role === "system" && (
        <svg viewBox="0 0 100 130" fill="none">
          <circle cx="50" cy="60" r="28" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <text x="50" y="68" textAnchor="middle" fill="#475569" fontSize="26">⚙</text>
        </svg>
      )}
    </motion.div>
  );
}
