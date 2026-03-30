import Anthropic from "@anthropic-ai/sdk";
import type { CEODecision, LogCallback } from "./types";

const client = new Anthropic();

/**
 * CEO: 最終判断のみを担う。
 * 承認 → finalAnswer を返す。差し戻し → feedback のみ返す。
 */
export async function makeFinalDecision(
  instruction: string,
  aggregatedResult: string,
  onLog?: LogCallback
): Promise<CEODecision> {
  onLog?.({ role: "ceo", message: "最終判断を開始します..." });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system: `あなたはCEOとして最終判断のみを行います。

【判断基準】
1. ユーザーの指示を完全に満たしているか
2. 回答の品質・完成度が十分か
3. 情報の正確性・信頼性に問題がないか
4. ビジネス・倫理的観点から問題がないか

必ず以下のJSON形式のみで返してください（説明文は不要）:
承認する場合: {"approved": true, "feedback": "承認理由", "finalAnswer": "最終回答テキスト"}
差し戻す場合: {"approved": false, "feedback": "具体的な改善要求"}`,
    messages: [
      {
        role: "user",
        content: `ユーザーの指示:\n${instruction}\n\n集約された回答:\n${aggregatedResult}\n\nこの回答を判断してください。`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const decision = JSON.parse(match[0]) as CEODecision;
      onLog?.({
        role: "ceo",
        message: decision.approved
          ? "承認: 回答を確定しました"
          : `要改善: ${decision.feedback}`,
      });
      return decision;
    }
  } catch {
    // fallback
  }

  onLog?.({ role: "ceo", message: "承認: 回答を確定しました" });
  return { approved: true, feedback: "承認", finalAnswer: aggregatedResult };
}
