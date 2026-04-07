import type { Task } from "./types";
import type { Agent } from "./agent";
import { WORKER_IDS } from "./config";

const DECOMPOSE_SYSTEM = `あなたはAI Companyの「進行役（Manager）」です。タスク分解と進行管理が役割です。

【Phase 2: タスク分解】
指示を 1〜3 個の独立したサブタスクに分解してください。

ルール:
- 各タスクは並行実行できる粒度にする
- 各タスクに具体的な完了条件を設定する
- 1つで十分な場合は無理に分割しない
- Workerは3体いる（worker-1 / worker-2 / worker-3）

必ず以下のJSON配列のみを返してください（前後に説明文を含めない）:
[{"description":"タスクの詳細な説明（何を・どのように・どの水準で）","criteria":"品質判断基準（具体的に）"}]`;

const AGGREGATE_SYSTEM = `あなたはAI Companyの「進行役（Manager）」です。Workerの成果を集約します。

【集約のルール】
- 各Workerの結果を矛盾なく統合する
- 重複情報を排除し、補完関係にある情報は統合する
- 元の指示への回答として完結している内容にする
- 日本語で明確かつ読みやすく記述する
- 構造化された形式（見出し・箇条書き）で整理する`;

/**
 * Manager: 指示をサブタスクに分解し、各タスクに担当 Worker ID を割り当てる。
 */
export async function decomposeTasks(agent: Agent, instruction: string): Promise<Task[]> {
  agent.log("指示を分析しています。最適なタスク構成を考えます...");

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
      agent.log(`${tasks.length}個のタスクに分解しました。各Workerに割り当てます`);
      tasks.forEach((t, i) => {
        agent.log(`Worker ${i + 1} → ${t.description.slice(0, 50)}...`);
      });
      return tasks;
    }
  } catch { /* fallback */ }

  agent.log("1つのタスクとして進行します");
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
  agent.log("全Workerの成果物を確認しています...");

  const resultsText = results
    .map((r, i) => `[タスク${i + 1}: ${r.task.description}]\n${r.output}`)
    .join("\n\n---\n\n");

  const text = await agent.think(
    AGGREGATE_SYSTEM,
    `元の指示: ${instruction}\n\n各Workerの成果:\n\n${resultsText}\n\nこれらを統合した完成回答を作成してください。`,
    3000
  );

  agent.log("集約完了。CEOに最終判断を依頼します");
  return text;
}
