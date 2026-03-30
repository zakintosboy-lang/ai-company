import type { Task, WorkerOutput } from "./types";
import type { Agent } from "./agent";

const SYSTEM = `あなたは専門的なタスク実行エージェント（Worker）です。タスクの実行のみを行います。

【判断基準】
- 回答は具体的かつ正確であること
- タスクの要件を完全に理解してから回答すること
- 必要な情報をすべて含めること
- 簡潔かつ明確に記述すること
- Reviewerからフィードバックがある場合は必ずそれを反映すること`;

/**
 * Worker: 割り当てられたタスクを実行する。
 * feedback がある場合は前回のフィードバックを会話に含めて再実行する。
 */
export async function executeTask(
  agent: Agent,
  task: Task,
  feedback: string | null = null
): Promise<WorkerOutput> {
  agent.log(
    feedback
      ? `再実行 [${task.id}]: Reviewerのフィードバックを反映します`
      : `実行開始 [${task.id}]: ${task.description.slice(0, 50)}...`
  );

  const userContent = feedback
    ? `タスク: ${task.description}\n\nReviewerからのフィードバック:\n${feedback}\n\nフィードバックを必ず反映して改善した回答を提供してください。`
    : `タスク: ${task.description}`;

  const output = await agent.think(SYSTEM, userContent);
  agent.log(`完了 [${task.id}]: ${output.slice(0, 60)}...`);

  return { taskId: task.id, workerId: agent.id, output };
}
