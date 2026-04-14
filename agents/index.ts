import type { AgentRole, LivePreview, LogCallback, PreviewCallback, StateCallback, StructuredOutput, Task } from "./types";
import { AGENT_CONFIGS, WORKER_IDS } from "./config";
import { Agent } from "./agent";
import { decomposeTasks, aggregateResults } from "./manager";
import { executeTask } from "./worker";
import { reviewWork } from "./reviewer";
import { analyzeStrategy, makeFinalDecision } from "./ceo";
import { conductResearch } from "./researcher";
import { editContent } from "./editor";
import { generateDesignSpec } from "./designer";
import { formatOutput } from "./formatter";
import type { ResearchResult } from "./researcher";

const MAX_REVIEW_CYCLES = 2;
const MAX_CEO_CYCLES = 1;
const RESEARCH_ANGLES = [
  "最新ニュース・更新情報",
  "競合比較・選択肢比較",
  "出典確認・信頼性評価",
] as const;

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
  onState: StateCallback,
  onPreview?: PreviewCallback
): Promise<StructuredOutput> {
  // エージェントインスタンスを生成
  const agentMap: Record<string, Agent> = {};
  for (const config of AGENT_CONFIGS) {
    agentMap[config.id] = new Agent(config, onLog, onState);
  }

  const ceo        = agentMap["ceo"];
  const manager    = agentMap["manager"];
  const reviewer    = agentMap["reviewer"];
  const researchers = ["researcher-1", "researcher-2", "researcher-3"].map((id) => agentMap[id]);
  const editor      = agentMap["editor"];
  const designer    = agentMap["designer"];

  onLog({ role: "system", message: "=== AI Company 起動 — 7フェーズ開始 ===" });

  // ── Phase 1: CEO 戦略設計 ─────────────────────────────────────
  onLog({ role: "system", message: "【Phase 1】CEO が戦略を設計します" });
  const strategy = await analyzeStrategy(ceo, instruction);
  ceo.setWaiting();

  // ── Phase 2: Manager 構造設計 ─────────────────────────────────
  onLog({ role: "system", message: "【Phase 2】進行役がタスクを分解します" });
  const tasks = await decomposeTasks(manager, instruction);
  const previewDrafts = new Map<string, string>();
  onPreview?.(
    buildLivePreview({
      instruction,
      progressLabel: "下書き枠を準備中",
      summary: "担当ごとの成果物プレビューを準備しました。リサーチ完了後に本文が入り始めます。",
      tasks,
      drafts: previewDrafts,
    })
  );
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
  const researchResults = await Promise.all(
    researchers.map((researcher, index) =>
      conductResearch(
        researcher,
        instruction,
        strategy.requirements.join(", "),
        RESEARCH_ANGLES[index] ?? "最新情報の整理"
      )
    )
  );
  researchers.forEach((researcher, index) => {
    researcher.setDone(`リサーチ完了: ${RESEARCH_ANGLES[index] ?? "最新情報の整理"}`);
  });
  const researchResult = mergeResearchResults(researchResults);
  onPreview?.(
    buildLivePreview({
      instruction,
      progressLabel: "調査メモを反映",
      summary: "Researcher の材料がそろいました。これから各 Worker のドラフトが順番に育っていきます。",
      tasks,
      drafts: previewDrafts,
      researchResult,
    })
  );

  // リサーチ結果をコンテキストとしてWorkerに渡す（トークン超過防止のため要約のみ）
  const researchContext = `
【リサーチ担当からの情報】（最新情報ベース）
${researchResult.summary.slice(0, 2000)}
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
            previewDrafts.set(task.id, workerOutput.output);
            onPreview?.(
              buildLivePreview({
                instruction,
                progressLabel: `${previewDrafts.size}/${tasks.length} ブロック反映`,
                summary: `${worker.config.name} の成果物をプレビューに追加しました。`,
                tasks,
                drafts: previewDrafts,
                researchResult,
              })
            );
            return { task, output: workerOutput.output };
          }
          feedback = reviewResult.feedback;
        }

        worker.log(`最終実行 [${task.id}]: レビューサイクル上限到達`);
        const finalOutput = await executeTask(worker, enrichedTask, feedback);
        worker.setDone("完了");
        previewDrafts.set(task.id, finalOutput.output);
        onPreview?.(
          buildLivePreview({
            instruction,
            progressLabel: `${previewDrafts.size}/${tasks.length} ブロック反映`,
            summary: `${worker.config.name} の最終ドラフトをプレビューに追加しました。`,
            tasks,
            drafts: previewDrafts,
            researchResult,
          })
        );
        return { task, output: finalOutput.output };
      })
    );

    reviewer.setDone("全タスクの審査完了");

    // Manager 集約
    const aggregated = await aggregateResults(manager, ceoCycleInstruction, results);
    onPreview?.(
      buildLivePreview({
        instruction,
        progressLabel: "統合ドラフト作成",
        summary: "各 Worker の成果物をまとめ、納品直前のドラフトとして表示しています。",
        tasks,
        drafts: previewDrafts,
        researchResult,
        aggregate: aggregated,
      })
    );
    manager.setDone("集約完了");

    // まずは集約結果をそのまま最終判断へ回し、必要なときだけ編集を挟む
    let candidateAnswer = aggregated;
    let decision = await makeFinalDecision(ceo, ceoCycleInstruction, candidateAnswer);

    if (!decision.approved) {
      onLog({ role: "system", message: "【Editor】CEOの指摘を反映して整えます" });
      candidateAnswer = await editContent(
        editor,
        aggregated,
        `${ceoCycleInstruction}\n\n[CEOの改善要求]: ${decision.feedback}`
      );
      onPreview?.(
        buildLivePreview({
          instruction,
          progressLabel: "編集で磨き込み中",
          summary: "CEO の指摘を反映して、統合ドラフトをさらに整えています。",
          tasks,
          drafts: previewDrafts,
          researchResult,
          aggregate: candidateAnswer,
        })
      );
      decision = await makeFinalDecision(ceo, ceoCycleInstruction, candidateAnswer);
    }

    if (decision.approved) {
      const finalText = decision.finalAnswer?.trim() ? decision.finalAnswer : candidateAnswer;
      // Formatter 構造化
      const structured = await formatOutput(instruction, finalText, onLog);
      structured.sections.unshift({
        title: "最新情報ステータス",
        type: "highlight",
        icon: researchResult.usedKnowledgeFallback ? "⚠" : "✅",
        highlight: researchResult.usedKnowledgeFallback ? "warning" : "success",
        content: researchResult.usedKnowledgeFallback
          ? `${researchResult.searchedAt} 時点でウェブ検索を試みましたが、一部は知識ベース補完で整理しています。重要な意思決定には日付と一次情報を再確認してください。`
          : `${researchResult.searchedAt} 時点のウェブ検索結果をもとに整理しています。最新動向ベースのレポートとして参照できます。`,
      });
      if (researchResult.sources.trim()) {
        structured.sections.push({
          title: "出典・確認ポイント",
          type: "text",
          icon: "🔍",
          content: researchResult.sources,
        });
      }
      structured.keyPoints = [
        researchResult.usedKnowledgeFallback
          ? `最新情報は ${researchResult.searchedAt} 時点で一部補完あり`
          : `最新情報は ${researchResult.searchedAt} 時点で確認済み`,
        ...structured.keyPoints,
      ].slice(0, 3);

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
      const structured = await formatOutput(instruction, candidateAnswer, onLog);
      structured.sections.unshift({
        title: "最新情報ステータス",
        type: "highlight",
        icon: researchResult.usedKnowledgeFallback ? "⚠" : "✅",
        highlight: researchResult.usedKnowledgeFallback ? "warning" : "success",
        content: researchResult.usedKnowledgeFallback
          ? `${researchResult.searchedAt} 時点でウェブ検索を試みましたが、一部は知識ベース補完で整理しています。重要な意思決定には日付と一次情報を再確認してください。`
          : `${researchResult.searchedAt} 時点のウェブ検索結果をもとに整理しています。最新動向ベースのレポートとして参照できます。`,
      });
      if (researchResult.sources.trim()) {
        structured.sections.push({
          title: "出典・確認ポイント",
          type: "text",
          icon: "🔍",
          content: researchResult.sources,
        });
      }
      structured.keyPoints = [
        researchResult.usedKnowledgeFallback
          ? `最新情報は ${researchResult.searchedAt} 時点で一部補完あり`
          : `最新情報は ${researchResult.searchedAt} 時点で確認済み`,
        ...structured.keyPoints,
      ].slice(0, 3);
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

function mergeResearchResults(results: ResearchResult[]): ResearchResult {
  const searchedAt = results[0]?.searchedAt ?? new Date().toISOString().slice(0, 10);
  const usedKnowledgeFallback = results.some((result) => result.usedKnowledgeFallback);

  return {
    summary: results.map((result) => `【${result.angle}】\n${result.summary}`).join("\n\n"),
    trends: results.flatMap((result) => result.trends),
    sources: results.map((result) => `【${result.angle}】\n${result.sources || "出典整理なし"}`).join("\n\n"),
    rawText: results
      .map((result) => `### ${result.angle}\n${result.rawText}`)
      .join("\n\n---\n\n"),
    searchedAt,
    usedKnowledgeFallback,
    angle: "統合リサーチ",
  };
}

function buildLivePreview({
  instruction,
  progressLabel,
  summary,
  tasks,
  drafts,
  researchResult,
  aggregate,
}: {
  instruction: string;
  progressLabel: string;
  summary: string;
  tasks: Task[];
  drafts: Map<string, string>;
  researchResult?: ResearchResult;
  aggregate?: string;
}): LivePreview {
  const blocks: LivePreview["blocks"] = [];

  if (researchResult?.summary?.trim()) {
    blocks.push({
      id: "research-summary",
      title: "リサーチメモ",
      role: "researcher",
      status: "merged",
      content: shrinkPreviewText(researchResult.summary, 360),
    });
  }

  for (const task of tasks) {
    const draft = drafts.get(task.id);
    blocks.push({
      id: task.id,
      title: taskPreviewTitle(task),
      role: "worker",
      status: draft ? "approved" : "pending",
      content: draft
        ? shrinkPreviewText(draft, 520)
        : "この担当の成果物を生成中です。完成したブロックからここに順番に表示されます。",
    });
  }

  if (aggregate?.trim()) {
    blocks.push({
      id: "aggregate-draft",
      title: "統合ドラフト",
      role: "manager",
      status: "merged",
      content: shrinkPreviewText(aggregate, 900),
    });
  }

  return {
    title: shrinkTitle(instruction),
    summary,
    progressLabel,
    updatedAt: new Date().toISOString(),
    blocks,
  };
}

function taskPreviewTitle(task: Task) {
  const firstLine = task.description
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return task.id;

  return firstLine
    .replace(/^[-*・\d.\s]+/, "")
    .replace(/[。.!?].*$/, "")
    .trim()
    .slice(0, 36) || task.id;
}

function shrinkTitle(text: string, max = 36) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "AI チームのライブプレビュー";
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}

function shrinkPreviewText(text: string, max = 480) {
  const compact = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trim()}…`;
}
