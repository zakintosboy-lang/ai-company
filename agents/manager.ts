import Anthropic from "@anthropic-ai/sdk";
import type { Task, LogCallback } from "./types";

const client = new Anthropic();

/**
 * Manager: タスク分解のみを担う。
 * 受け取った指示を 1〜3 個の独立したサブタスク（評価基準付き）に分解して返す。
 */
export async function decomposeTasks(
  instruction: string,
  onLog?: LogCallback
): Promise<Task[]> {
  onLog?.({ role: "manager", message: "タスクを分解しています..." });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `あなたはタスク分解専門のマネージャーです。タスク分解のみを行います。

【判断基準】
- 指示を 1〜3 個の独立したサブタスクに分解すること
- 各タスクに具体的な完了条件（criteria）を必ず設定すること
- タスクは並行実行可能な粒度にすること
- 1 つで十分な場合は無理に分割しないこと

必ず以下の JSON 配列のみを返してください（前後に説明文を含めない）:
[{"id":"task-1","description":"タスクの詳細な説明","criteria":"品質判断基準"}]`,
    messages: [{ role: "user", content: instruction }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const tasks = JSON.parse(match[0]) as Task[];
      if (tasks.length > 0) {
        onLog?.({
          role: "manager",
          message: `${tasks.length}個のタスクに分解しました`,
        });
        return tasks;
      }
    }
  } catch {
    // fallback
  }

  const fallback: Task[] = [
    {
      id: "task-1",
      description: instruction,
      criteria: "指示の内容を完全にカバーし、具体的かつ正確であること",
    },
  ];
  onLog?.({ role: "manager", message: "1個のタスクとして処理します" });
  return fallback;
}

/**
 * Manager: Worker の承認済み結果を集約して一つの回答にまとめる。
 */
export async function aggregateResults(
  instruction: string,
  results: { task: Task; output: string }[],
  onLog?: LogCallback
): Promise<string> {
  onLog?.({ role: "manager", message: "Workerの結果を集約しています..." });

  const resultsText = results
    .map((r, i) => `[タスク${i + 1}: ${r.task.description}]\n${r.output}`)
    .join("\n\n---\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: `あなたはタスク結果の集約担当マネージャーです。

【判断基準】
- 各Workerの結果を矛盾なく統合すること
- 重複情報を排除すること
- 元の指示への回答として完結していること
- 日本語で明確かつ読みやすく記述すること`,
    messages: [
      {
        role: "user",
        content: `元の指示: ${instruction}\n\n各タスクの結果:\n\n${resultsText}\n\nこれらを統合した包括的な回答を作成してください。`,
      },
    ],
  });

  const aggregated =
    response.content[0].type === "text" ? response.content[0].text : "";
  onLog?.({ role: "manager", message: "集約完了。CEOに提出します" });
  return aggregated;
}
