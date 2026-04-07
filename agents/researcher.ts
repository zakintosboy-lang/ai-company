import type { Agent } from "./agent";

const SYSTEM = `あなたはAI Companyの「リサーチ担当（Researcher）」です。最新情報の収集と分析が役割です。

【Phase 3: リサーチ】

以下を必ず実行してください:

1. 最新情報の収集
   - 知識の範囲内で最新のトレンド・動向を整理する
   - 2024〜2025年の最新状況を優先的に言及する
   - 「最新情報ベースで回答」と明記する

2. 複数視点での比較
   - 賛否・メリットデメリット・複数の選択肢を対比する
   - 業界・領域ごとの違いを示す

3. 信頼性の確認
   - 不確かな情報は「〜とされている」「〜の可能性がある」と明記する
   - 根拠・出典の種類（公式発表・業界調査・専門家見解など）を示す

出力形式:
## 最新情報まとめ
## トレンド
## 根拠・信頼性

※ 必ず冒頭に「最新情報ベースで回答」と記載すること`;

export interface ResearchResult {
  summary: string;
  trends: string[];
  sources: string;
  rawText: string;
}

/**
 * Researcher: Phase 3 - 最新情報のリサーチを実行する。
 */
export async function conductResearch(
  agent: Agent,
  instruction: string,
  context?: string
): Promise<ResearchResult> {
  agent.log("リサーチを開始します。最新情報を収集・整理します...");

  const userContent = context
    ? `調査テーマ: ${instruction}\n\nコンテキスト:\n${context}\n\n上記について最新情報をリサーチしてください。`
    : `調査テーマ: ${instruction}\n\n最新情報・トレンド・複数視点での比較を含めてリサーチしてください。`;

  const rawText = await agent.think(SYSTEM, userContent, 2048);

  agent.log("最新情報ベースで回答を整理しました");
  agent.log(`トレンド分析完了: ${rawText.slice(0, 50)}...`);

  // シンプルなパース
  const trendsMatch = rawText.match(/##\s*トレンド\n([\s\S]*?)(?=##|$)/);
  const summaryMatch = rawText.match(/##\s*最新情報まとめ\n([\s\S]*?)(?=##|$)/);
  const sourcesMatch = rawText.match(/##\s*根拠[^\n]*\n([\s\S]*?)(?=##|$)/);

  return {
    summary: summaryMatch?.[1]?.trim() ?? rawText.slice(0, 300),
    trends: (trendsMatch?.[1] ?? "").split("\n").filter(l => l.trim().startsWith("-")).map(l => l.replace(/^-\s*/, "")).filter(Boolean),
    sources: sourcesMatch?.[1]?.trim() ?? "",
    rawText,
  };
}
