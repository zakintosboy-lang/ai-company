import Anthropic from "@anthropic-ai/sdk";
import type { Task, WorkerOutput, LogCallback } from "./types";

const client = new Anthropic();

/**
 * Worker: タスク実行のみを担う。
 * Reviewer からフィードバックがある場合はそれを反映して再実行する。
 */
export async function executeTask(
  task: Task,
  feedback: string | null = null,
  onLog?: LogCallback
): Promise<WorkerOutput> {
  onLog?.({
    role: "worker",
    message: feedback
      ? `再実行 [${task.id}]: Reviewerのフィードバックを反映します`
      : `実行開始 [${task.id}]: ${task.description.slice(0, 50)}...`,
  });

  const userContent = feedback
    ? `タスク: ${task.description}\n\nReviewerからのフィードバック:\n${feedback}\n\n上記のフィードバックを必ず反映して、改善した回答を提供してください。`
    : `タスク: ${task.description}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `あなたは専門的なタスク実行エージェント（Worker）です。タスクの実行のみを行います。

【判断基準】
- 回答は具体的かつ正確であること
- タスクの要件を完全に理解してから回答すること
- 必要な情報をすべて含めること
- 簡潔かつ明確に記述すること
- Reviewerからフィードバックがある場合は必ずそれを反映すること`,
    messages: [{ role: "user", content: userContent }],
  });

  const output =
    response.content[0].type === "text" ? response.content[0].text : "";
  onLog?.({
    role: "worker",
    message: `完了 [${task.id}]: ${output.slice(0, 60)}...`,
  });

  return { taskId: task.id, output };
}
