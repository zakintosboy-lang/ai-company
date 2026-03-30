import type { LogCallback, StateCallback, StructuredOutput } from "./types";
import { AGENT_CONFIGS, WORKER_IDS } from "./config";
import { Agent } from "./agent";
import { decomposeTasks, aggregateResults } from "./manager";
import { executeTask } from "./worker";
import { reviewWork } from "./reviewer";
import { makeFinalDecision } from "./ceo";
import { formatOutput } from "./formatter";

const MAX_REVIEW_CYCLES = 2;
const MAX_CEO_CYCLES = 2;

/**
 * AI Company のオーケストレーター。
 *
 * フロー:
 *   CEO (指示受領)
 *   → Manager (タスク分解)
 *   → Worker × N ↔ Reviewer (並列・最大 MAX_REVIEW_CYCLES 往復)
 *   → Manager (結果集約)
 *   → CEO (最終判断: 承認 or 差し戻し → 最大 MAX_CEO_CYCLES 回)
 *   → Formatter (構造化 JSON に変換)
 */
export async function runCompany(
  instruction: string,
  onLog: LogCallback,
  onState: StateCallback
): Promise<StructuredOutput> {
  // 実行ごとに新規 Agent インスタンスを生成（会話ログを初期化）
  const agentMap: Record<string, Agent> = {};
  for (const config of AGENT_CONFIGS) {
    agentMap[config.id] = new Agent(config, onLog, onState);
  }

  const ceo      = agentMap["ceo"];
  const manager  = agentMap["manager"];
  const reviewer = agentMap["reviewer"];

  onLog({ role: "system", message: "=== AI Company 起動 ===" });
  ceo.log(`指示受領: "${instruction.slice(0, 60)}${instruction.length > 60 ? "..." : ""}"`);
  ceo.log("Managerにタスク分解を依頼します");
  ceo.setWaiting();

  let currentInstruction = instruction;

  for (let ceoCycle = 0; ceoCycle < MAX_CEO_CYCLES; ceoCycle++) {
    if (ceoCycle > 0) {
      manager.log(`CEOのフィードバックを受けて再実行します (${ceoCycle + 1}回目)`);
      for (const agent of Object.values(agentMap)) agent.reset();
    }

    // ── Manager: タスク分解 ──────────────────────────────────
    const tasks = await decomposeTasks(manager, currentInstruction);
    manager.setWaiting("Workerの完了待ち...");

    // 使われない Worker を待機状態にする
    const activeWorkerIds = new Set(tasks.map((t) => t.workerId));
    for (const wid of WORKER_IDS) {
      if (!activeWorkerIds.has(wid)) {
        agentMap[wid].setWaiting("タスク待機中");
        agentMap[wid].log("今回の実行では担当タスクなし");
      }
    }

    // ── Worker × Reviewer: 並列実行 ─────────────────────────
    const results = await Promise.all(
      tasks.map(async (task) => {
        const worker = agentMap[task.workerId];
        let feedback: string | null = null;

        for (let rev = 0; rev < MAX_REVIEW_CYCLES; rev++) {
          const workerOutput = await executeTask(worker, task, feedback);
          worker.setWaiting("Reviewerの審査待ち...");

          const reviewResult = await reviewWork(reviewer, task, workerOutput);

          if (reviewResult.approved) {
            worker.setDone("承認済み");
            return { task, output: workerOutput.output };
          }
          feedback = reviewResult.feedback;
        }

        worker.log(`最終実行 [${task.id}]: レビューサイクル上限到達`);
        const finalOutput = await executeTask(worker, task, feedback);
        worker.setDone("完了");
        return { task, output: finalOutput.output };
      })
    );

    reviewer.setDone("全タスクのレビュー完了");

    // ── Manager: 結果集約 ────────────────────────────────────
    const aggregated = await aggregateResults(manager, currentInstruction, results);
    manager.setDone("集約完了");

    // ── CEO: 最終判断 ────────────────────────────────────────
    const decision = await makeFinalDecision(ceo, currentInstruction, aggregated);

    if (decision.approved && decision.finalAnswer) {
      // ── Formatter: 構造化 ────────────────────────────────
      const structured = await formatOutput(instruction, decision.finalAnswer, onLog);
      onLog({ role: "system", message: "=== 処理完了 ===" });
      return structured;
    }

    if (ceoCycle < MAX_CEO_CYCLES - 1) {
      ceo.log(`差し戻し: ${decision.feedback}`);
      currentInstruction = `${instruction}\n\n[CEOの改善要求]: ${decision.feedback}`;
    } else {
      const structured = await formatOutput(instruction, aggregated, onLog);
      onLog({ role: "system", message: "=== 処理完了 (最大サイクル到達) ===" });
      return structured;
    }
  }

  return {
    questionType: "情報整理",
    title: "処理エラー",
    summary: "処理を完了できませんでした。",
    keyPoints: ["処理が完了しませんでした", "もう一度お試しください", "問題が続く場合はサポートへ"],
    sections: [{ title: "エラー", type: "text", content: "エラー: 処理を完了できませんでした" }],
  };
}
