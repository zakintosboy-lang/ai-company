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
  agent.log("全Workerの成果物を高速に整理しています...");

  if (results.length === 0) {
    agent.log("成果物が見つからなかったため、元の指示のみで続行します");
    return instruction;
  }

  if (results.length === 1) {
    agent.log("単一成果物のため、そのまま最終判断に回します");
    return normalizeOutput(results[0].output);
  }

  const text = [
    "# 統合ドラフト",
    `元の指示: ${instruction}`,
    "以下は各担当の成果物を読みやすくまとめた統合ドラフトです。",
    ...results.map((result, index) => {
      const title = buildSectionTitle(result.task.description, index);
      return `## ${title}\n${normalizeOutput(result.output)}`;
    }),
  ].join("\n\n");

  agent.log("整理完了。CEOに最終判断を依頼します");
  return text;
}

function normalizeOutput(text: string) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function buildSectionTitle(description: string, index: number) {
  const firstLine = description
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return `担当 ${index + 1}`;

  const cleaned = firstLine
    .replace(/^[-*・\d.\s]+/, "")
    .replace(/[。.!?].*$/, "")
    .trim();

  return cleaned.slice(0, 42) || `担当 ${index + 1}`;
}
