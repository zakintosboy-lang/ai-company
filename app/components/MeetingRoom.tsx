"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import PixelCharacter from "./PixelCharacter";

type AgentRole = "ceo" | "manager" | "worker" | "reviewer" | "researcher" | "designer" | "editor" | "system";
type AgentStatus = "idle" | "thinking" | "reviewing" | "done" | "waiting";

interface LogEntry {
  time: string;
  role: AgentRole;
  message: string;
}

interface AgentInfo {
  id: string;
  role: AgentRole;
  name: string;
  status: AgentStatus;
  lastMessage?: string;
  model?: string;
}

interface Props {
  logs: LogEntry[];
  agents: AgentInfo[];
  isRunning: boolean;
  output: boolean;
}

const ROLE_META: Record<AgentRole, {
  label: string;
  color: string;
  soft: string;
  strong: string;
  badge: string;
}> = {
  ceo: { label: "CEO", color: "#8b5cf6", soft: "#f3e8ff", strong: "#6d28d9", badge: "HQ" },
  manager: { label: "Manager", color: "#2563eb", soft: "#dbeafe", strong: "#1d4ed8", badge: "OPS" },
  worker: { label: "Worker", color: "#f97316", soft: "#ffedd5", strong: "#ea580c", badge: "BUILD" },
  reviewer: { label: "Reviewer", color: "#16a34a", soft: "#dcfce7", strong: "#15803d", badge: "CHECK" },
  researcher: { label: "Researcher", color: "#0891b2", soft: "#cffafe", strong: "#0e7490", badge: "SEARCH" },
  designer: { label: "Designer", color: "#ec4899", soft: "#fce7f3", strong: "#db2777", badge: "DESIGN" },
  editor: { label: "Editor", color: "#84cc16", soft: "#ecfccb", strong: "#65a30d", badge: "EDIT" },
  system: { label: "System", color: "#64748b", soft: "#e2e8f0", strong: "#475569", badge: "SYS" },
};

const STATUS_META: Record<AgentStatus, { label: string; color: string; bg: string; glow: string }> = {
  idle: { label: "待機中", color: "#64748b", bg: "#f8fafc", glow: "rgba(100,116,139,0.12)" },
  thinking: { label: "作業中", color: "#7c3aed", bg: "#f5f3ff", glow: "rgba(124,58,237,0.18)" },
  reviewing: { label: "レビュー中", color: "#16a34a", bg: "#f0fdf4", glow: "rgba(22,163,74,0.18)" },
  done: { label: "完了", color: "#0891b2", bg: "#ecfeff", glow: "rgba(8,145,178,0.16)" },
  waiting: { label: "待機列", color: "#d97706", bg: "#fffbeb", glow: "rgba(217,119,6,0.18)" },
};

const DEFAULT_AGENTS: AgentInfo[] = [
  { id: "ceo", role: "ceo", name: "CEO", status: "idle" },
  { id: "manager", role: "manager", name: "Manager", status: "idle" },
  { id: "worker-1", role: "worker", name: "Worker Lead", status: "idle" },
  { id: "worker-2", role: "worker", name: "Worker Core", status: "idle" },
  { id: "worker-3", role: "worker", name: "Worker Quality", status: "idle" },
  { id: "reviewer", role: "reviewer", name: "Reviewer", status: "idle" },
  { id: "researcher-1", role: "researcher", name: "Researcher News", status: "idle" },
  { id: "researcher-2", role: "researcher", name: "Researcher Compare", status: "idle" },
  { id: "researcher-3", role: "researcher", name: "Researcher Source", status: "idle" },
  { id: "editor", role: "editor", name: "Editor", status: "idle" },
  { id: "designer", role: "designer", name: "Designer", status: "idle" },
];

function getStageLabel(logs: LogEntry[], isRunning: boolean, output: boolean) {
  if (output) return "Deliverables Ready";
  if (!isRunning) return "Standby";

  const joined = logs.map((log) => log.message).join("\n");
  if (joined.includes("【Phase 6】")) return "Designing";
  if (joined.includes("【Editor】")) return "Editing";
  if (joined.includes("【Phase 5】")) return "Reviewing";
  if (joined.includes("【Phase 4】")) return "Building";
  if (joined.includes("【Phase 3】")) return "Researching";
  if (joined.includes("【Phase 2】")) return "Planning";
  if (joined.includes("【Phase 1】")) return "Strategy";
  return "Booting";
}

function getHeroCopy(logs: LogEntry[], isRunning: boolean, output: boolean) {
  if (output) return "AI チームが成果物を仕上げました。下の Deliverables で確認できます。";
  if (!isRunning) return "指示を入力すると、各エージェントが分担して調査・制作・レビューを進めます。";

  const latest = [...logs].reverse().find((log) => log.role !== "system");
  if (latest?.message) return latest.message;
  return "エージェントたちが役割ごとに連携しながら成果物を制作しています。";
}

function normalizeBubbleMessage(agent: AgentInfo) {
  if (agent.lastMessage?.trim()) return agent.lastMessage.trim();
  if (agent.status === "thinking") return "担当タスクを進めています";
  if (agent.status === "reviewing") return "レビュー観点を整理しています";
  if (agent.status === "waiting") return "次の依頼を待っています";
  if (agent.status === "done") return "この担当範囲は完了しました";
  return "スタンバイ中";
}

function AgentBubble({ agent }: { agent: AgentInfo }) {
  const roleMeta = ROLE_META[agent.role] ?? ROLE_META.system;
  const statusMeta = STATUS_META[agent.status] ?? STATUS_META.idle;
  const isActive = agent.status === "thinking" || agent.status === "reviewing";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${agent.id}-${normalizeBubbleMessage(agent)}`}
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        style={{
          maxWidth: 220,
          minHeight: 84,
          padding: "12px 14px",
          borderRadius: 18,
          border: `2px solid ${roleMeta.color}55`,
          background: "#fffdfa",
          boxShadow: isActive ? `0 14px 28px ${statusMeta.glow}` : "0 10px 22px rgba(15,23,42,0.08)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: roleMeta.strong,
            }}
          >
            {roleMeta.badge}
          </span>
          <span
            style={{
              borderRadius: 999,
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 900,
              color: statusMeta.color,
              background: statusMeta.bg,
            }}
          >
            {statusMeta.label}
          </span>
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "#243042",
            fontWeight: 700,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 42,
          }}
        >
          {normalizeBubbleMessage(agent)}
        </div>

        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -11,
            width: 20,
            height: 20,
            background: "#fffdfa",
            borderLeft: `2px solid ${roleMeta.color}55`,
            borderBottom: `2px solid ${roleMeta.color}55`,
            transform: "translateX(-50%) rotate(-45deg)",
            borderBottomLeftRadius: 6,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

function AgentUnit({ agent }: { agent: AgentInfo }) {
  const roleMeta = ROLE_META[agent.role] ?? ROLE_META.system;
  const statusMeta = STATUS_META[agent.status] ?? STATUS_META.idle;
  const isActive = agent.status === "thinking" || agent.status === "reviewing";
  const size = agent.role === "ceo" ? 3.35 : 2.75;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, minWidth: 132 }}>
      <AgentBubble agent={agent} />

      <motion.div
        animate={isActive ? { y: [0, -6, 0], scale: [1, 1.03, 1] } : { y: [0, -2, 0] }}
        transition={{ duration: isActive ? 1.7 : 2.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -8,
            transform: "translateX(-50%)",
            width: 66,
            height: 14,
            borderRadius: 999,
            background: "rgba(15,23,42,0.14)",
            filter: "blur(3px)",
          }}
        />
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 22,
            background: "#ffffffcc",
            border: `2px solid ${roleMeta.color}33`,
            boxShadow: isActive ? `0 12px 24px ${statusMeta.glow}` : "0 8px 20px rgba(15,23,42,0.08)",
          }}
        >
          <PixelCharacter role={agent.role} status={agent.status} agentId={agent.id} size={size} />
        </div>
      </motion.div>

      <div
        style={{
          width: "100%",
          maxWidth: 160,
          borderRadius: 18,
          border: `2px solid ${roleMeta.color}33`,
          background: "#fffdfa",
          padding: "10px 12px",
          boxShadow: "0 10px 18px rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: roleMeta.strong }}>{roleMeta.label}</span>
          <span
            style={{
              borderRadius: 999,
              width: 11,
              height: 11,
              background: statusMeta.color,
              boxShadow: `0 0 0 4px ${statusMeta.glow}`,
              flexShrink: 0,
            }}
          />
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 4, lineHeight: 1.35 }}>{agent.name}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: 700 }}>
          {agent.model ?? "Team Model"}
        </div>
      </div>
    </div>
  );
}

function ZonePanel({
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
        borderRadius: 28,
        border: `2px solid ${accent}33`,
        background: "#ffffffd8",
        boxShadow: "0 18px 32px rgba(15,23,42,0.08)",
        padding: "18px 18px 20px",
        minHeight: 220,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: 20,
          border: `1px dashed ${accent}44`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: accent, textTransform: "uppercase" }}>{title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "#51617c", marginTop: 4, fontWeight: 700 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function FlowBackdrop() {
  return (
    <svg
      viewBox="0 0 1200 760"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.8 }}
    >
      <path d="M600 126 C600 178, 600 198, 600 250" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="10 14" fill="none" strokeLinecap="round" />
      <path d="M600 294 C468 332, 376 362, 266 416" stroke="#0891b2" strokeWidth="4" strokeDasharray="10 14" fill="none" strokeLinecap="round" />
      <path d="M600 294 C596 336, 594 370, 592 430" stroke="#2563eb" strokeWidth="4" strokeDasharray="10 14" fill="none" strokeLinecap="round" />
      <path d="M600 294 C730 338, 848 366, 952 414" stroke="#16a34a" strokeWidth="4" strokeDasharray="10 14" fill="none" strokeLinecap="round" />
      <path d="M290 510 C370 566, 428 592, 520 638" stroke="#f97316" strokeWidth="4" strokeDasharray="10 14" fill="none" strokeLinecap="round" />
      <path d="M938 506 C846 564, 766 594, 670 638" stroke="#ec4899" strokeWidth="4" strokeDasharray="10 14" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function MeetingRoom({ logs, agents, isRunning, output }: Props) {
  const agentMap = useMemo(() => {
    const list = agents.length > 0 ? agents : DEFAULT_AGENTS;
    return new Map(list.map((agent) => [agent.id, agent]));
  }, [agents]);

  const allAgents = useMemo(
    () => DEFAULT_AGENTS.map((fallback) => agentMap.get(fallback.id) ?? fallback),
    [agentMap]
  );

  const zones = {
    hq: allAgents.filter((agent) => agent.id === "ceo"),
    research: allAgents.filter((agent) => agent.role === "researcher"),
    control: allAgents.filter((agent) => agent.id === "manager"),
    review: allAgents.filter((agent) => agent.id === "reviewer"),
    build: allAgents.filter((agent) => agent.role === "worker"),
    creative: allAgents.filter((agent) => agent.role === "editor" || agent.role === "designer"),
  };

  const activeCount = allAgents.filter((agent) => agent.status === "thinking" || agent.status === "reviewing").length;
  const stageLabel = getStageLabel(logs, isRunning, output);
  const heroCopy = getHeroCopy(logs, isRunning, output);
  const latestSystemLog = [...logs].reverse().find((log) => log.role === "system");

  return (
    <div
      style={{
        height: "100%",
        borderRadius: 28,
        overflow: "hidden",
        border: "3px solid #31405f",
        background:
          "linear-gradient(180deg, #7fd7ff 0%, #9be5ff 28%, #d6f4ff 29%, #e7fbff 72%, #dff3bf 72%, #dff3bf 100%)",
        boxShadow: "0 14px 34px rgba(15,23,42,0.10)",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", inset: 12, borderRadius: 22, border: "4px solid #7f57f1", boxShadow: "inset 0 0 0 4px #ffe85d", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 34, top: 32, width: 120, height: 26, borderRadius: 999, background: "#ffffff", boxShadow: "28px 6px 0 0 #ffffff, 62px 1px 0 0 #ffffff", opacity: 0.92 }} />
      <div style={{ position: "absolute", right: 120, top: 42, width: 82, height: 18, borderRadius: 999, background: "#ffffff", boxShadow: "20px -5px 0 0 #ffffff, 42px 2px 0 0 #ffffff", opacity: 0.88 }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 80, height: 32, background: "linear-gradient(180deg, #52b74f 0%, #37983b 100%)", borderTop: "4px solid #92e271" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 28, height: 52, background: "linear-gradient(180deg, #d99150 0%, #b66b37 100%)", borderTop: "4px solid #f5b36c", borderBottom: "4px solid #87481f" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 28, height: 52, opacity: 0.24, backgroundImage: "linear-gradient(90deg, transparent 0, transparent 12px, #7b4627 12px, #7b4627 14px, transparent 14px, transparent 40px, #7b4627 40px, #7b4627 42px, transparent 42px)", backgroundSize: "54px 24px" }} />
      <div style={{ position: "absolute", left: 0, bottom: 104, width: 330, height: 140, background: "#b5a2d8", clipPath: "polygon(0 100%, 0 38%, 18% 14%, 34% 26%, 56% 10%, 74% 22%, 100% 8%, 100% 100%)", opacity: 0.72 }} />
      <div style={{ position: "absolute", right: 0, bottom: 108, width: 360, height: 150, background: "#c9b7e6", clipPath: "polygon(0 100%, 0 34%, 16% 18%, 36% 10%, 54% 26%, 78% 18%, 100% 34%, 100% 100%)", opacity: 0.7 }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", padding: "24px 24px 22px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto auto",
            gap: 12,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              borderRadius: 20,
              background: "#fff8f1",
              border: "3px solid #31405f",
              boxShadow: "0 8px 0 rgba(49,64,95,0.12)",
              padding: "14px 18px",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: "#7f57f1", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              AI Company Control Stage
            </div>
            <div style={{ marginTop: 6, fontSize: 22, lineHeight: 1.25, fontWeight: 900, color: "#0f172a" }}>{stageLabel}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#475569", lineHeight: 1.55, fontWeight: 700 }}>
              {heroCopy}
            </div>
          </div>

          <div
            style={{
              borderRadius: 20,
              background: "#fffdfa",
              border: "2px solid rgba(49,64,95,0.14)",
              padding: "12px 14px",
              minWidth: 144,
              boxShadow: "0 10px 20px rgba(15,23,42,0.06)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Active Agents
            </div>
            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 900, color: "#0f172a" }}>{activeCount}</div>
            <div style={{ marginTop: 2, fontSize: 11, fontWeight: 800, color: "#51617c" }}>
              {isRunning ? "現在稼働中" : "実行待機中"}
            </div>
          </div>

          <div
            style={{
              borderRadius: 20,
              background: "#fffdfa",
              border: "2px solid rgba(49,64,95,0.14)",
              padding: "12px 14px",
              minWidth: 216,
              boxShadow: "0 10px 20px rgba(15,23,42,0.06)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              System Feed
            </div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "#1f2937", lineHeight: 1.55 }}>
              {latestSystemLog?.message ?? "待機中です。実行するとフェーズ進行がここに流れます。"}
            </div>
          </div>
        </div>

        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          <FlowBackdrop />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: "grid",
              gridTemplateColumns: "1.25fr 1fr 1fr",
              gridTemplateRows: "auto 1fr 1fr",
              gap: 18,
              gridTemplateAreas: `
                "hq hq hq"
                "research control review"
                "build build creative"
              `,
            }}
          >
            <div style={{ gridArea: "hq", display: "flex", justifyContent: "center" }}>
              <ZonePanel title="Headquarters" subtitle="最終意思決定と全体品質を管理する司令塔" accent="#8b5cf6">
                {zones.hq.map((agent) => <AgentUnit key={agent.id} agent={agent} />)}
              </ZonePanel>
            </div>

            <div style={{ gridArea: "research" }}>
              <ZonePanel title="Research Field" subtitle="最新情報を調べ、比較材料を持ち帰る調査班" accent="#0891b2">
                {zones.research.map((agent) => <AgentUnit key={agent.id} agent={agent} />)}
              </ZonePanel>
            </div>

            <div style={{ gridArea: "control" }}>
              <ZonePanel title="Control Tower" subtitle="CEO と現場をつなぐ進行管理" accent="#2563eb">
                {zones.control.map((agent) => <AgentUnit key={agent.id} agent={agent} />)}
              </ZonePanel>
            </div>

            <div style={{ gridArea: "review" }}>
              <ZonePanel title="Review Gate" subtitle="品質・根拠・仕上がりをチェックする検証ライン" accent="#16a34a">
                {zones.review.map((agent) => <AgentUnit key={agent.id} agent={agent} />)}
              </ZonePanel>
            </div>

            <div style={{ gridArea: "build" }}>
              <ZonePanel title="Build Zone" subtitle="調査結果をもとにドラフトを作り、成果物の芯をつくる制作班" accent="#f97316">
                {zones.build.map((agent) => <AgentUnit key={agent.id} agent={agent} />)}
              </ZonePanel>
            </div>

            <div style={{ gridArea: "creative" }}>
              <ZonePanel title="Creative House" subtitle="文章とデザインを整えて納品品質へ引き上げる仕上げ班" accent="#ec4899">
                {zones.creative.map((agent) => <AgentUnit key={agent.id} agent={agent} />)}
              </ZonePanel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
