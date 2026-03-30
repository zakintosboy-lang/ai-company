import type { LogCallback } from "./types";
import { decomposeTasks, aggregateResults } from "./manager";
import { executeTask } from "./worker";
import { reviewWork } from "./reviewer";
import { makeFinalDecision } from "./ceo";

const MAX_REVIEW_CYCLES = 2;
const MAX_CEO_CYCLES = 2;

/**
 * AI Company のメインオーケストレーター。
 *
 * 処理フロー:
 *   CEO → Manager (分解) → [Worker ↔ Reviewer] × N (並列) → Manager (集約) → CEO (最終判断)
 *   CEO が差し戻した場合は Manager から再実行 (最大 MAX_CEO_CYCLES 回)
 */
export async function runCompany(
  instruction: string,
  onLog?: LogCallback
): Promise<string> {
  onLog?.({ role: "system", message: "=== AI Company 起動 ===" });
  onLog?.({
    role: "ceo",
    message: `指示受領: "${instruction.slice(0, 60)}${instruction.length > 60 ? "..." : ""}"`,
  });
  onLog?.({ role: "ceo", message: "Managerにタスク分解を依頼します" });

  let currentInstruction = instruction;

  for (let ceoCycle = 0; ceoCycle < MAX_CEO_CYCLES; ceoCycle++) {
    if (ceoCycle > 0) {
      onLog?.({
        role: "manager",
        message: `CEOのフィードバックを受けて再実行します (${ceoCycle + 1}回目)`,
      });
    }

    // Manager: タスク分解
    const tasks = await decomposeTasks(currentInstruction, onLog);

    // Manager → Workers: 各タスクを並列で Worker ↔ Reviewer サイクルに投入
    onLog?.({ role: "manager", message: "Workerにタスクを割り当てます" });

    const results = await Promise.all(
      tasks.map(async (task) => {
        let feedback: string | null = null;

        for (let reviewCycle = 0; reviewCycle < MAX_REVIEW_CYCLES; reviewCycle++) {
          const workerOutput = await executeTask(task, feedback, onLog);
          const reviewResult = await reviewWork(task, workerOutput, onLog);

          if (reviewResult.approved) {
            return { task, output: workerOutput.output };
          }

          feedback = reviewResult.feedback;
        }

        // レビューサイクル上限到達 → 最終実行（レビューなし）
        onLog?.({
          role: "worker",
          message: `最終実行 [${task.id}]: レビューサイクル上限到達`,
        });
        const finalOutput = await executeTask(task, feedback, onLog);
        return { task, output: finalOutput.output };
      })
    );

    // Manager: 結果集約
    const aggregated = await aggregateResults(currentInstruction, results, onLog);

    // CEO: 最終判断
    const decision = await makeFinalDecision(currentInstruction, aggregated, onLog);

    if (decision.approved && decision.finalAnswer) {
      onLog?.({ role: "system", message: "=== 処理完了 ===" });
      return decision.finalAnswer;
    }

    // CEO 差し戻し → 次サイクルへ
    if (ceoCycle < MAX_CEO_CYCLES - 1) {
      onLog?.({
        role: "ceo",
        message: `差し戻し: ${decision.feedback}`,
      });
      currentInstruction = `${instruction}\n\n[CEOの改善要求]: ${decision.feedback}`;
    } else {
      // 最大サイクル到達 → 集約結果をそのまま返す
      onLog?.({ role: "system", message: "=== 処理完了 (最大サイクル到達) ===" });
      return aggregated;
    }
  }

  return "エラー: 処理を完了できませんでした";
}
