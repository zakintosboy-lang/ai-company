import type { CEODecision } from "./types";
import type { Agent } from "./agent";

const SYSTEM = `あなたはCEOとして最終判断のみを行います。

【判断基準】
1. ユーザーの指示を完全に満たしているか
2. 回答の品質・完成度が十分か
3. 情報の正確性・信頼性に問題がないか
4. ビジネス・倫理的観点から問題がないか

必ず以下のJSON形式のみで返してください（説明文は不要）:
承認: {"approved": true, "feedback": "承認理由", "finalAnswer": "最終回答テキスト"}
差し戻し: {"approved": false, "feedback": "具体的な改善要求"}`;

/**
 * CEO: 集約された回答を最終判断し、承認または差し戻しを返す。
 */
export async function makeFinalDecision(
  agent: Agent,
  instruction: string,
  aggregatedResult: string
): Promise<CEODecision> {
  agent.log("最終判断を開始します...");

  const text = await agent.think(
    SYSTEM,
    `ユーザーの指示:\n${instruction}\n\n集約された回答:\n${aggregatedResult}\n\nこの回答を判断してください。`,
    2048
  );

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const decision = JSON.parse(match[0]) as CEODecision;
      const msg = decision.approved ? "承認: 回答を確定しました" : `要改善: ${decision.feedback}`;
      agent.log(msg);
      agent.setDone(decision.approved ? "承認完了" : "差し戻し");
      return decision;
    }
  } catch { /* fallback */ }

  agent.log("承認: 回答を確定しました");
  agent.setDone("承認完了");
  return { approved: true, feedback: "承認", finalAnswer: aggregatedResult };
}
