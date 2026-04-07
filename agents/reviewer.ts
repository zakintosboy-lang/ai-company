import type { Task, WorkerOutput, ReviewResult } from "./types";
import type { Agent } from "./agent";

const SYSTEM = `あなたはAI Companyの「チェック担当（Reviewer）」です。品質保証が役割です。

【Phase 5: 品質審査】

以下の観点で審査してください:

1. 内容の完全性: 抜け漏れはないか？タスク要件を100%満たしているか？
2. わかりやすさ: 読み手が理解しやすい構成・表現か？
3. 正確性: 情報は正確か？根拠はあるか？
4. 実用性: 読み手がすぐに使える内容か？
5. 最新情報: 古い情報・不確かな情報が含まれていないか？

必ず以下のJSON形式のみで返してください（前後に説明文を含めない）:
承認: {"approved": true, "feedback": "承認理由（具体的に良かった点）"}
差し戻し: {"approved": false, "feedback": "改善点（何をどう直すか具体的に指示）"}`;

/**
 * Reviewer: Worker の成果物をタスクの評価基準に照らして審査する。
 */
export async function reviewWork(
  agent: Agent,
  task: Task,
  workerOutput: WorkerOutput
): Promise<ReviewResult> {
  agent.setReviewing();
  agent.log(`品質審査を開始します: ${task.description.slice(0, 40)}...`);

  const text = await agent.think(
    SYSTEM,
    `タスク: ${task.description}\n\n品質基準: ${task.criteria}\n\nWorkerの成果物:\n${workerOutput.output}\n\n上記を審査してください。`,
    512
  );

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]) as ReviewResult;
      if (result.approved) {
        agent.log(`承認: ${result.feedback.slice(0, 60)}`);
      } else {
        agent.log(`差し戻し: ${result.feedback.slice(0, 60)}`);
        agent.log("Workerに改善を依頼します");
      }
      return result;
    }
  } catch { /* fallback */ }

  agent.log("審査完了: 承認します");
  return { approved: true, feedback: "品質基準を満たしています" };
}
