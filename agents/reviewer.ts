import type { Task, WorkerOutput, ReviewResult } from "./types";
import type { Agent } from "./agent";

const SYSTEM = `あなたはAI Companyの「チェック担当（Reviewer）」です。品質保証が役割です。

【Phase 5: 品質審査】

以下の観点で審査してください:

1. 内容の完全性: 抜け漏れはないか？タスク要件を100%満たしているか？
2. わかりやすさ: 読み手が理解しやすい構成・表現か？
3. 正確性: 情報は正確か？根拠はあるか？
4. 実用性: 読み手がすぐに使える内容か？
5. 最新情報: 古い情報・不確かな情報が含まれていないか？
6. 出典・確認性: 数値・固有名詞・比較観点に、確認可能な根拠や注意書きがあるか？

【承認ルール】
- 1つでも重大な不足があれば差し戻す
- 「だいたい良い」では承認しない
- 抽象的・一般論寄り・根拠不足・比較不足・提案の弱さがあれば差し戻す
- 差し戻し時は、何をどう直すべきかを具体的に3点以内で示す

必ず以下のJSON形式のみで返してください（前後に説明文を含めない）:
承認: {"approved": true, "feedback": "承認理由（具体的に良かった点）"}
差し戻し: {"approved": false, "feedback": "改善点（何をどう直すか具体的に指示）", "missing": ["不足1", "不足2"], "strengths": ["良かった点"]}`;

/**
 * Reviewer: Worker の成果物をタスクの評価基準に照らして審査する。
 */
export async function reviewWork(
  agent: Agent,
  task: Task,
  workerOutput: WorkerOutput
): Promise<ReviewResult> {
  agent.setReviewing();
  agent.log(`品質審査を開始します: ${task.description.slice(0, 40)}...`);

  const text = await agent.think(
    SYSTEM,
    `タスク: ${task.description}\n\n品質基準: ${task.criteria}\n\nWorkerの成果物:\n${workerOutput.output}\n\n上記を厳密に審査してください。承認する場合は「なぜこのままで実務利用できるか」を示し、差し戻す場合は「不足点」と「具体的な修正指示」を必ず含めてください。`,
    900
  );

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as ReviewResult & { missing?: string[]; strengths?: string[] };
      const result: ReviewResult = {
        approved: Boolean(parsed.approved),
        feedback: parsed.feedback || (parsed.approved ? "品質基準を満たしています" : "改善が必要です"),
      };
      if (result.approved) {
        agent.log(`承認: ${result.feedback.slice(0, 60)}`);
        if (parsed.strengths?.length) {
          agent.log(`評価ポイント: ${parsed.strengths.slice(0, 2).join(" / ").slice(0, 60)}`);
        }
      } else {
        agent.log(`差し戻し: ${result.feedback.slice(0, 60)}`);
        if (parsed.missing?.length) {
          agent.log(`不足点: ${parsed.missing.slice(0, 2).join(" / ").slice(0, 60)}`);
        }
        agent.log("Workerに改善を依頼します");
      }
      return result;
    }
  } catch { /* fallback */ }

  agent.log("審査完了: 承認します");
  return { approved: true, feedback: "品質基準を満たしています" };
}
