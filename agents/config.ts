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
      provider: "openai",
      modelId: "gpt-5.4",
      displayName: "GPT-5.4",
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
      modelId: "claude-sonnet-4-5",
      displayName: "Claude Sonnet 4.5",
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
    name: "Worker Lead",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-5",
      displayName: "Claude Sonnet 4.5",
    },
    criteria: [
      "短時間で論点を広く拾えていること",
      "初稿として十分な具体性があること",
      "重要な論点の抜け漏れが少ないこと",
      "Reviewerのフィードバックを必ず反映すること",
    ],
  },
  {
    id: "worker-2",
    role: "worker",
    name: "Worker Core",
    model: {
      provider: "openai",
      modelId: "gpt-4.1",
      displayName: "GPT-4.1",
    },
    criteria: [
      "情報整理と構造化が明確であること",
      "タスクの要件を過不足なく満たすこと",
      "比較や提案の論理が自然につながっていること",
      "Reviewerのフィードバックを必ず反映すること",
    ],
  },
  {
    id: "worker-3",
    role: "worker",
    name: "Worker Quality",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-5",
      displayName: "Claude Sonnet 4.5",
    },
    criteria: [
      "文章品質と説得力が高いこと",
      "読み手に伝わる構成と表現になっていること",
      "提案や企画としての完成度が高いこと",
      "Reviewerのフィードバックを必ず反映すること",
    ],
  },
  {
    id: "reviewer",
    role: "reviewer",
    name: "Reviewer",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-5",
      displayName: "Claude Sonnet 4.5",
    },
    criteria: [
      "回答が明確で具体的であること",
      "タスクの要件を完全に満たしていること",
      "情報が正確で信頼できること",
      "指定された評価基準（criteria）を満たしていること",
    ],
  },
  {
    id: "researcher-1",
    role: "researcher",
    name: "Researcher News",
    model: {
      provider: "openai",
      modelId: "gpt-4.1",
      displayName: "GPT-4.1",
    },
    criteria: [
      "最新情報・トレンドを網羅していること",
      "複数の視点・比較を含むこと",
      "情報の根拠・信頼性を明示すること",
    ],
  },
  {
    id: "researcher-2",
    role: "researcher",
    name: "Researcher Compare",
    model: {
      provider: "openai",
      modelId: "gpt-4.1",
      displayName: "GPT-4.1",
    },
    criteria: [
      "競合比較・選択肢比較が明確であること",
      "価格・特徴・メリットデメリットが整理されていること",
      "意思決定に使える比較視点を含むこと",
    ],
  },
  {
    id: "researcher-3",
    role: "researcher",
    name: "Researcher Source",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-5",
      displayName: "Claude Sonnet 4.5",
    },
    criteria: [
      "出典・発表日・一次情報が明確であること",
      "信頼性や不確実性が適切に示されていること",
      "最新性に関する注意点が明示されていること",
    ],
  },
  {
    id: "editor",
    role: "editor",
    name: "Editor",
    model: {
      provider: "openai",
      modelId: "gpt-4.1",
      displayName: "GPT-4.1",
    },
    criteria: [
      "文章が論理的な順序で整理されていること",
      "表現が統一されていること",
      "冗長な繰り返しが除去されていること",
      "読み手に伝わりやすい構成であること",
    ],
  },
  {
    id: "designer",
    role: "designer",
    name: "Designer",
    model: {
      provider: "claude",
      modelId: "claude-sonnet-4-5",
      displayName: "Claude Sonnet 4.5",
    },
    criteria: [
      "Canvaで再現可能な具体的なデザイン仕様であること",
      "カラー・フォント・レイアウトが明確であること",
      "PDF化を前提とした設計であること",
    ],
  },
];

export const WORKER_IDS = ["worker-1", "worker-2", "worker-3"] as const;
export type WorkerId = (typeof WORKER_IDS)[number];
