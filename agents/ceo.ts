import type { CEODecision } from "./types";
import type { Agent } from "./agent";

const STRATEGY_SYSTEM = `あなたはAI Companyの「CEO」です。戦略的思考と目的の明確化が役割です。
会話形式で、キャラクターとして自然に話してください。

【Phase 1: 戦略立案】
以下を分析して、会話として伝えてください:

1. 目的: ユーザーの真の意図は何か
2. 成果物イメージ: 最終的に何を届けるか
3. 必要要素: 達成に必要なものは何か

必ず以下のJSON形式のみで返してください（説明文は不要）:
{"purpose": "目的を一文で", "goal": "成果物イメージを一文で", "requirements": ["要素1", "要素2", "要素3"], "strategySummary": "チームへの一言メッセージ（50字以内）"}`;

const DECISION_SYSTEM = `あなたはAI Companyの「CEO」です。最終判断を行います。

【判断基準】
1. ユーザーの指示を完全に満たしているか
2. 回答の品質・完成度が十分か
3. 情報の正確性・信頼性に問題がないか
4. ビジネス・倫理的観点から問題がないか

必ず以下のJSON形式のみで返してください（説明文は不要）:
承認: {"approved": true, "feedback": "承認理由"}
差し戻し: {"approved": false, "feedback": "具体的な改善要求（何をどう直すか）"}`;

/**
 * CEO Phase 1: 指示を受け取り戦略を立案する。
 */
export async function analyzeStrategy(
  agent: Agent,
  instruction: string
): Promise<{ purpose: string; goal: string; requirements: string[]; strategySummary: string }> {
  agent.log("指示を受領しました。戦略を立案します...");

  const text = await agent.think(
    STRATEGY_SYSTEM,
    `ユーザーからの指示:\n"${instruction}"\n\nこの指示を分析し、戦略を立案してください。`,
    512
  );

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      agent.log(`目的: ${result.purpose}`);
      agent.log(`ゴール: ${result.goal}`);
      agent.log(result.strategySummary ?? "Managerにタスク分解を依頼します");
      return result;
    }
  } catch { /* fallback */ }

  agent.log("目的を理解しました。Managerにタスク分解を依頼します");
  return {
    purpose: instruction.slice(0, 60),
    goal: "高品質な成果物の提供",
    requirements: ["情報収集", "分析", "整理"],
    strategySummary: "チーム全員で最高の成果物を目指しましょう",
  };
}

/**
 * CEO: 集約された回答を最終判断し、承認または差し戻しを返す。
 */
export async function makeFinalDecision(
  agent: Agent,
  instruction: string,
  aggregatedResult: string
): Promise<CEODecision> {
  agent.log("最終判断を開始します...");

  const condensedResult = compactForDecision(aggregatedResult);

  const text = await agent.think(
    DECISION_SYSTEM,
    `ユーザーの指示:\n${instruction}\n\n集約された回答:\n${condensedResult}\n\nこの回答を判断してください。承認時は completed answer の再出力は不要です。`,
    768
  );

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const decision = JSON.parse(match[0]) as CEODecision;
      const msg = decision.approved
        ? "承認します。素晴らしい仕事でした"
        : `要改善です: ${decision.feedback}`;
      agent.log(msg);
      agent.setDone(decision.approved ? "承認完了" : "差し戻し");
      return decision;
    }
  } catch { /* fallback */ }

  agent.log("承認します。回答を確定しました");
  agent.setDone("承認完了");
  return { approved: true, feedback: "承認", finalAnswer: aggregatedResult };
}

function compactForDecision(text: string, maxChars = 7000) {
  if (text.length <= maxChars) return text;

  const head = text.slice(0, Math.floor(maxChars * 0.68));
  const tail = text.slice(-Math.floor(maxChars * 0.24));
  const omitted = Math.max(0, text.length - head.length - tail.length);

  return `${head}\n\n...[中略 ${omitted}文字]...\n\n${tail}`;
}
