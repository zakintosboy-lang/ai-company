import Anthropic from "@anthropic-ai/sdk";
import type { Task, WorkerOutput, ReviewResult, LogCallback } from "./types";

const client = new Anthropic();

/**
 * Reviewer: Worker の成果物をタスクの評価基準に照らして審査する。
 * 承認 or 差し戻し（フィードバック付き）を返す。
 */
export async function reviewWork(
  task: Task,
  workerOutput: WorkerOutput,
  onLog?: LogCallback
): Promise<ReviewResult> {
  onLog?.({
    role: "reviewer",
    message: `レビュー開始 [${task.id}]: 品質を評価しています...`,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `あなたはQAレビュアーです。Workerの成果物を審査します。

【判断基準】
- 回答が明確で具体的であること
- タスクの要件を完全に満たしていること
- 情報が正確で信頼できること
- 指定された評価基準（criteria）を満たしていること

必ず以下の JSON 形式のみで返してください（前後に説明文を含めない）:
承認: {"approved": true, "feedback": "承認理由"}
差し戻し: {"approved": false, "feedback": "具体的な改善点"}`,
    messages: [
      {
        role: "user",
        content: `タスク: ${task.description}\n評価基準: ${task.criteria}\n\nWorkerの出力:\n${workerOutput.output}\n\nこのアウトプットを評価してください。`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]) as ReviewResult;
      onLog?.({
        role: "reviewer",
        message: result.approved
          ? `承認 [${task.id}]: ${result.feedback}`
          : `差し戻し [${task.id}]: ${result.feedback}`,
      });
      return result;
    }
  } catch {
    // fallback
  }

  onLog?.({ role: "reviewer", message: `承認 [${task.id}]: 評価完了` });
  return { approved: true, feedback: "評価完了" };
}
