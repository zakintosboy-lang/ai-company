import type { Task } from "./types";
import type { Agent } from "./agent";
import { WORKER_IDS } from "./config";

const DECOMPOSE_SYSTEM = `あなたはタスク分解専門のマネージャーです。タスク分解のみを行います。

【判断基準】
- 指示を 1〜3 個の独立したサブタスクに分解すること（Workerは3体）
- 各タスクに具体的な完了条件（criteria）を必ず設定すること
- タスクは並行実行可能な粒度にすること
- 1 つで十分な場合は無理に分割しないこと

必ず以下の JSON 配列のみを返してください（前後に説明文を含めない）:
[{"description":"タスクの詳細な説明","criteria":"品質判断基準"}]`;

const AGGREGATE_SYSTEM = `あなたはタスク結果の集約担当マネージャーです。

【判断基準】
- 各Workerの結果を矛盾なく統合すること
- 重複情報を排除すること
- 元の指示への回答として完結していること
- 日本語で明確かつ読みやすく記述すること`;

/**
 * Manager: 指示をサブタスクに分解し、各タスクに担当 Worker ID を割り当てる。
 */
export async function decomposeTasks(agent: Agent, instruction: string): Promise<Task[]> {
  agent.log("タスクを分解しています...");

  const text = await agent.think(DECOMPOSE_SYSTEM, instruction);

  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const raw = JSON.parse(match[0]) as Array<{ description: string; criteria: string }>;
      const tasks: Task[] = raw.slice(0, WORKER_IDS.length).map((t, i) => ({
        id: `task-${i + 1}`,
        workerId: WORKER_IDS[i],
        description: t.description,
        criteria: t.criteria,
      }));
      agent.log(`${tasks.length}個のタスクに分解しました`);
      return tasks;
    }
  } catch { /* fallback */ }

  agent.log("1個のタスクとして処理します");
  return [{ id: "task-1", workerId: WORKER_IDS[0], description: instruction, criteria: "指示の内容を完全にカバーし、具体的かつ正確であること" }];
}

/**
 * Manager: 各 Worker の承認済み結果を集約して一つの回答にまとめる。
 */
export async function aggregateResults(
  agent: Agent,
  instruction: string,
  results: { task: Task; output: string }[]
): Promise<string> {
  agent.log("Workerの結果を集約しています...");

  const resultsText = results
    .map((r, i) => `[タスク${i + 1}: ${r.task.description}]\n${r.output}`)
    .join("\n\n---\n\n");

  const text = await agent.think(
    AGGREGATE_SYSTEM,
    `元の指示: ${instruction}\n\n各タスクの結果:\n\n${resultsText}\n\nこれらを統合した包括的な回答を作成してください。`,
    2048
  );

  agent.log("集約完了。CEOに提出します");
  return text;
}
