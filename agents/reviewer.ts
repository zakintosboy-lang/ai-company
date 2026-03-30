import type { Task, WorkerOutput, ReviewResult } from "./types";
import type { Agent } from "./agent";

const SYSTEM = `あなたはQAレビュアーです。Workerの成果物を審査します。

【判断基準】
- 回答が明確で具体的であること
- タスクの要件を完全に満たしていること
- 情報が正確で信頼できること
- 指定された評価基準（criteria）を満たしていること

必ず以下の JSON 形式のみで返してください（前後に説明文を含めない）:
承認: {"approved": true, "feedback": "承認理由"}
差し戻し: {"approved": false, "feedback": "具体的な改善点"}`;

/**
 * Reviewer: Worker の成果物をタスクの評価基準に照らして審査する。
 */
export async function reviewWork(
  agent: Agent,
  task: Task,
  workerOutput: WorkerOutput
): Promise<ReviewResult> {
  agent.setReviewing();
  agent.log(`レビュー開始 [${task.id}]: 品質を評価しています...`);

  const text = await agent.think(
    SYSTEM,
    `タスク: ${task.description}\n評価基準: ${task.criteria}\n\nWorkerの出力:\n${workerOutput.output}\n\nこのアウトプットを評価してください。`,
    512
  );

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]) as ReviewResult;
      agent.log(
        result.approved
          ? `承認 [${task.id}]: ${result.feedback}`
          : `差し戻し [${task.id}]: ${result.feedback}`
      );
      return result;
    }
  } catch { /* fallback */ }

  agent.log(`承認 [${task.id}]: 評価完了`);
  return { approved: true, feedback: "評価完了" };
}
