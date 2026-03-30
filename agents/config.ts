import type { AgentConfig } from "./types";

/**
 * 固定エージェント定義。
 * model フィールドの provider / modelId を変更するだけで
 * 役割ごとに Claude / OpenAI / Gemini を差し替えられる。
 */
export const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: "ceo",
    role: "ceo",
    name: "CEO",
    model: {
      provider: "claude",
      modelId: "claude-opus-4-6",
      displayName: "Claude Opus 4.6",
    },
    criteria: [
      "ユーザーの指示を完全に満たしているか",
      "回答の品質・完成度が十分か",
      "情報の正確性・信頼性に問題がないか",
      "ビジネス・倫理的観点から問題がないか",
    ],
  },
  {
    id: "manager",
    role: "manager",
    name: "Manager",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-6",
      displayName: "Claude Sonnet 4.6",
    },
    criteria: [
      "指示を適切な数のサブタスクに分解できているか",
      "各タスクに具体的な完了条件を設定しているか",
      "タスクが並行実行可能な粒度か",
      "各Workerの結果を矛盾なく統合できているか",
    ],
  },
  {
    id: "worker-1",
    role: "worker",
    name: "Worker 1",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-6",
      displayName: "Claude Sonnet 4.6",
    },
    criteria: [
      "回答が具体的かつ正確であること",
      "タスクの要件を完全に満たすこと",
      "Reviewerのフィードバックを必ず反映すること",
    ],
  },
  {
    id: "worker-2",
    role: "worker",
    name: "Worker 2",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-6",
      displayName: "Claude Sonnet 4.6",
    },
    criteria: [
      "回答が具体的かつ正確であること",
      "タスクの要件を完全に満たすこと",
      "Reviewerのフィードバックを必ず反映すること",
    ],
  },
  {
    id: "worker-3",
    role: "worker",
    name: "Worker 3",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-6",
      displayName: "Claude Sonnet 4.6",
    },
    criteria: [
      "回答が具体的かつ正確であること",
      "タスクの要件を完全に満たすこと",
      "Reviewerのフィードバックを必ず反映すること",
    ],
  },
  {
    id: "reviewer",
    role: "reviewer",
    name: "Reviewer",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-6",
      displayName: "Claude Sonnet 4.6",
    },
    criteria: [
      "回答が明確で具体的であること",
      "タスクの要件を完全に満たしていること",
      "情報が正確で信頼できること",
      "指定された評価基準（criteria）を満たしていること",
    ],
  },
];

export const WORKER_IDS = ["worker-1", "worker-2", "worker-3"] as const;
export type WorkerId = (typeof WORKER_IDS)[number];
