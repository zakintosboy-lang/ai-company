import type { LogCallback, StateCallback, StructuredOutput } from "./types";
import { AGENT_CONFIGS, WORKER_IDS } from "./config";
import { Agent } from "./agent";
import { decomposeTasks, aggregateResults } from "./manager";
import { executeTask } from "./worker";
import { reviewWork } from "./reviewer";
import { analyzeStrategy, makeFinalDecision } from "./ceo";
import { conductResearch } from "./researcher";
import { generateDesignSpec } from "./designer";
import { formatOutput } from "./formatter";

const MAX_REVIEW_CYCLES = 2;
const MAX_CEO_CYCLES = 2;

/**
 * AI Company オーケストレーター — 6フェーズ構成
 *
 * Phase 1: CEO（戦略設計）
 * Phase 2: Manager（構造設計・タスク分解）
 * Phase 3: Researcher（リサーチ・最新情報収集）
 * Phase 4: Worker × N（コンテンツ生成・制作）
 * Phase 5: Reviewer（レビュー・品質保証）
 * Phase 6: Designer（デザイン仕様書生成）
 */
export async function runCompany(
  instruction: string,
  onLog: LogCallback,
  onState: StateCallback
): Promise<StructuredOutput> {
  // エージェントインスタンスを生成
  const agentMap: Record<string, Agent> = {};
  for (const config of AGENT_CONFIGS) {
    agentMap[config.id] = new Agent(config, onLog, onState);
  }

  const ceo        = agentMap["ceo"];
  const manager    = agentMap["manager"];
  const reviewer   = agentMap["reviewer"];
  const researcher = agentMap["researcher"];
  const designer   = agentMap["designer"];

  onLog({ role: "system", message: "=== AI Company 起動 — 6フェーズ開始 ===" });

  // ── Phase 1: CEO 戦略設計 ─────────────────────────────────────
  onLog({ role: "system", message: "【Phase 1】CEO が戦略を設計します" });
  const strategy = await analyzeStrategy(ceo, instruction);
  ceo.setWaiting();

  // ── Phase 2: Manager 構造設計 ─────────────────────────────────
  onLog({ role: "system", message: "【Phase 2】進行役がタスクを分解します" });
  const tasks = await decomposeTasks(manager, instruction);
  manager.setWaiting("Researcherの調査待ち...");

  // 未使用 Worker を待機
  const activeWorkerIds = new Set(tasks.map(t => t.workerId));
  for (const wid of WORKER_IDS) {
    if (!activeWorkerIds.has(wid)) {
      agentMap[wid].setWaiting("タスク待機中");
      agentMap[wid].log("今回の実行では担当タスクなし");
    }
  }

  // ── Phase 3: Researcher リサーチ ─────────────────────────────
  onLog({ role: "system", message: "【Phase 3】リサーチ担当が最新情報を収集します" });
  const researchResult = await conductResearch(
    researcher,
    instruction,
    strategy.requirements.join(", ")
  );
  researcher.setDone("リサーチ完了");

  // リサーチ結果をコンテキストとしてWorkerに渡す
  const researchContext = `
【リサーチ担当からの情報】（最新情報ベース）
${researchResult.rawText}
`.trim();

  manager.log("リサーチ結果を確認しました。実行担当に制作を依頼します");
  manager.setWaiting("実行担当の完了待ち...");

  // ── Phase 4: Worker 制作 / Phase 5: Reviewer レビュー ─────────
  onLog({ role: "system", message: "【Phase 4】実行担当がコンテンツを生成します" });

  let ceoCycleInstruction = instruction;

  for (let ceoCycle = 0; ceoCycle < MAX_CEO_CYCLES; ceoCycle++) {
    if (ceoCycle > 0) {
      manager.log(`CEOのフィードバックを受けて再実行します（${ceoCycle + 1}回目）`);
      for (const wid of WORKER_IDS) agentMap[wid].reset();
      reviewer.reset();
    }

    const results = await Promise.all(
      tasks.map(async (task) => {
        const worker = agentMap[task.workerId];
        let feedback: string | null = null;

        // リサーチ結果をタスク説明に付加
        const enrichedTask = {
          ...task,
          description: `${task.description}\n\n${researchContext}`,
        };

        for (let rev = 0; rev < MAX_REVIEW_CYCLES; rev++) {
          const workerOutput = await executeTask(worker, enrichedTask, feedback);
          worker.setWaiting("チェック担当の審査待ち...");

          onLog({ role: "system", message: `【Phase 5】チェック担当が審査します: ${task.id}` });
          const reviewResult = await reviewWork(reviewer, enrichedTask, workerOutput);

          if (reviewResult.approved) {
            worker.setDone("承認済み");
            return { task, output: workerOutput.output };
          }
          feedback = reviewResult.feedback;
        }

        worker.log(`最終実行 [${task.id}]: レビューサイクル上限到達`);
        const finalOutput = await executeTask(worker, enrichedTask, feedback);
        worker.setDone("完了");
        return { task, output: finalOutput.output };
      })
    );

    reviewer.setDone("全タスクの審査完了");

    // Manager 集約
    const aggregated = await aggregateResults(manager, ceoCycleInstruction, results);
    manager.setDone("集約完了");

    // CEO 最終判断
    const decision = await makeFinalDecision(ceo, ceoCycleInstruction, aggregated);

    if (decision.approved && decision.finalAnswer) {
      // Formatter 構造化
      const structured = await formatOutput(instruction, decision.finalAnswer, onLog);

      // ── Phase 6: Designer デザイン仕様書 ───────────────────
      onLog({ role: "system", message: "【Phase 6】デザイン担当がデザイン仕様書を作成します" });
      const designSpec = await generateDesignSpec(designer, structured);
      if (designSpec) structured.designSpec = designSpec;

      onLog({ role: "system", message: "=== 全6フェーズ完了 ===" });
      return structured;
    }

    if (ceoCycle < MAX_CEO_CYCLES - 1) {
      ceo.log(`差し戻しフィードバック: ${decision.feedback}`);
      ceoCycleInstruction = `${instruction}\n\n[CEOの改善要求]: ${decision.feedback}`;
    } else {
      const structured = await formatOutput(instruction, aggregated, onLog);
      const designSpec = await generateDesignSpec(designer, structured);
      if (designSpec) structured.designSpec = designSpec;
      onLog({ role: "system", message: "=== 処理完了（最大サイクル到達） ===" });
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
