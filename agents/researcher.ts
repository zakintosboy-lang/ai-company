import OpenAI from "openai";
import type { Agent } from "./agent";

const SYSTEM = `あなたはAI Companyの「リサーチ担当（Researcher）」です。ウェブ検索で収集した最新情報を分析・整理することが役割です。

【Phase 3: リサーチ】

提供された最新のウェブ検索結果をもとに、以下を実行してください:

1. 最新情報の整理
   - 検索結果から最も重要な情報を抽出する
   - 情報源・発表日を明記する
   - 「ウェブ検索結果ベースで回答」と冒頭に明記する

2. 複数視点での比較
   - 賛否・メリットデメリット・複数の選択肢を対比する
   - 数値・スペック・価格などの具体的なデータを含める

3. 信頼性の確認
   - 不確かな情報は「〜とされている」「〜の可能性がある」と明記する
   - 情報の鮮度（いつ時点の情報か）を示す

出力形式:
## 最新情報まとめ
## トレンド
## 根拠・信頼性

※ 必ず冒頭に「ウェブ検索結果ベースで回答」と記載すること`;

export interface ResearchResult {
  summary: string;
  trends: string[];
  sources: string;
  rawText: string;
}

/**
 * OpenAI Responses API でウェブ検索を実行し、最新情報を取得する。
 */
async function webSearch(query: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: query,
  });

  // テキスト出力を結合して返す
  return response.output
    .filter((item): item is OpenAI.Responses.ResponseOutputMessage =>
      item.type === "message"
    )
    .flatMap(item =>
      item.content
        .filter((c): c is OpenAI.Responses.ResponseOutputText => c.type === "output_text")
        .map(c => c.text)
    )
    .join("\n");
}

/**
 * Researcher: Phase 3 - ウェブ検索で最新情報を収集・分析する。
 */
export async function conductResearch(
  agent: Agent,
  instruction: string,
  context?: string
): Promise<ResearchResult> {
  agent.log("ウェブ検索で最新情報を収集しています...");

  // ウェブ検索クエリを構築
  const searchQuery = context
    ? `${instruction} ${context} 最新情報 2025`
    : `${instruction} 最新情報 2025`;

  let searchResult: string;
  try {
    searchResult = await webSearch(searchQuery);
    agent.log("ウェブ検索完了。情報を整理しています...");
  } catch (err) {
    agent.log("ウェブ検索に失敗しました。知識ベースで回答します...");
    console.error("[Researcher] web search failed:", err);
    searchResult = `検索失敗のため、知識ベースで回答します。テーマ: ${instruction}`;
  }

  // 検索結果をもとにLLMで整理・分析
  const userContent = context
    ? `調査テーマ: ${instruction}\n\nコンテキスト:\n${context}\n\nウェブ検索結果:\n${searchResult}\n\n上記の検索結果をもとに最新情報を整理してください。`
    : `調査テーマ: ${instruction}\n\nウェブ検索結果:\n${searchResult}\n\n上記の検索結果をもとに最新情報・トレンド・比較を整理してください。`;

  const rawText = await agent.think(SYSTEM, userContent, 2048);

  agent.log("ウェブ検索結果ベースで回答を整理しました");
  agent.log(`トレンド分析完了: ${rawText.slice(0, 50)}...`);

  // パース
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
