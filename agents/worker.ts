import type { Task, WorkerOutput } from "./types";
import type { Agent } from "./agent";

const SYSTEM = `あなたはAI Companyの「実行担当（Worker）」です。タスクを高品質に実行することが役割です。

【Phase 3: リサーチ + Phase 4: 制作】

Step 1 - リサーチ（最新情報ベース）:
- 知識カットオフに依存せず、現時点での最善の情報を提供する
- トレンド・最新動向がある場合は明示して言及する
- 情報の根拠・信頼性を意識する
- 「最新情報ベースで回答」と明記する

Step 2 - 制作:
- 構造化された見やすい形で作成する（見出し / 箇条書き / 表を適切に使用）
- セクション分けを徹底する
- 実用レベルの具体的な内容にする
- 抽象的な記述を避け、数値・事例・具体例を含める

品質基準:
- タスクの要件を完全に満たすこと
- 読み手がすぐに使える情報であること
- Reviewerからのフィードバックがある場合は必ず反映すること`;

/**
 * Worker: 割り当てられたタスクを実行する。
 * feedback がある場合は前回のフィードバックを会話に含めて再実行する。
 */
export async function executeTask(
  agent: Agent,
  task: Task,
  feedback: string | null = null
): Promise<WorkerOutput> {
  if (feedback) {
    agent.log(`Reviewerのフィードバックを受けました: ${feedback.slice(0, 60)}...`);
    agent.log("フィードバックを反映して改善します");
  } else {
    agent.log(`タスク受領: ${task.description.slice(0, 50)}...`);
    agent.log("リサーチ → 制作の順で進めます");
  }

  const userContent = feedback
    ? `タスク: ${task.description}\n\n品質基準: ${task.criteria}\n\nReviewerからのフィードバック:\n${feedback}\n\n上記のフィードバックを必ず反映し、改善した回答を提供してください。\n※最新情報ベースで回答すること`
    : `タスク: ${task.description}\n\n品質基準: ${task.criteria}\n\n※最新情報ベースで回答すること`;

  const output = await agent.think(SYSTEM, userContent, 2048);
  agent.log(`完了しました: ${output.slice(0, 50)}...`);

  return { taskId: task.id, workerId: agent.id, output };
}
