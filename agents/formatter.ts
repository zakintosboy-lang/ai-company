import Anthropic from "@anthropic-ai/sdk";
import type { StructuredOutput, CanvaSlide, LogCallback } from "./types";

const client = new Anthropic();

const SYSTEM = `あなたは回答内容を「資料品質」に構造化するフォーマッターです。
与えられた指示と回答を分析し、資料として読める構造化データを JSON で返します。

【質問タイプの定義】
- 企画: アプリ・サービス・事業・プロジェクトの企画・立案
- 情報整理: 情報の調査・説明・要約・まとめ
- 比較: 複数の選択肢・製品・技術・手法の比較
- 提案: 改善案・戦略・施策・計画の提案
- ガイド: 手順・方法・チュートリアル・使い方の説明

【セクションタイプの定義】
- "text"      : 段落テキスト (content フィールドに文章。改行は \\n で表現)
- "list"      : 箇条書き (items 配列に各項目。各項目は完結した 1〜2 文)
- "steps"     : 番号付き手順 (items 配列に各ステップ)
- "table"     : 比較表 (tableData: { headers: string[], rows: string[][] })
- "highlight" : 重要ボックス (content + highlight: "info"|"warning"|"success"|"important")

【セクションアイコンの選択肢】
"📌" 重要情報  "⚠" 注意・リスク  "💡" アイデア・ヒント  "✅" 完了・承認
"📊" データ・比較  "🔍" 分析・詳細  "🚀" 実行・推進  "🎯" 目的・目標
"📋" 手順・概要  "⚙️" 設定・技術

【質問タイプ別の推奨セクション構成】
企画    → [概要(highlight:info,📌), 課題・背景(text,🔍), 主要機能(list,💡), 収益・実現方法(text,📊), 開発手順(steps,🚀), リスク(highlight:warning,⚠)]
情報整理 → [要点まとめ(highlight:info,📌), 概要(text,📋), 詳細(list,🔍), 補足(text,💡)]
比較    → [比較の目的(text,🎯), 比較表(table,📊), 各特徴(list,🔍), 結論(highlight:important,📌)]
提案    → [提案サマリー(highlight:info,🎯), 背景・課題(text,🔍), 提案内容(list,💡), 実施ステップ(steps,🚀), 注意事項(highlight:warning,⚠)]
ガイド  → [要点(highlight:important,📌), 前提・準備(list,⚙️), 手順(steps,📋), よくある問題(list,⚠), まとめ(highlight:success,✅)]

【JSON スキーマ】
{
  "questionType": "企画"|"情報整理"|"比較"|"提案"|"ガイド",
  "title": "資料タイトル（25字以内・具体的）",
  "summary": "回答全体の要点を 2〜3 文でまとめた文章",
  "keyPoints": ["重要ポイント1（30字以内）", "重要ポイント2（30字以内）", "重要ポイント3（30字以内）"],
  "sections": [
    {
      "title": "セクション名",
      "type": "text"|"list"|"steps"|"table"|"highlight",
      "icon": "上記アイコンから1つ",
      "content": "textまたはhighlightの場合のみ",
      "items": ["list/stepsの場合のみ"],
      "tableData": { "headers": [], "rows": [] },
      "highlight": "info"|"warning"|"success"|"important"
    }
  ]
}

【重要ルール】
- keyPoints は必ず 3 つ。体言止めまたは短文で記述
- content・items にマークダウン記法（**など）を使わない
- table の rows は headers と列数を必ず一致させる
- JSON のみを返す（コードブロック・説明文は不要）`;

/**
 * Formatter: 平文の回答を資料品質の構造化 JSON に変換する。
 */
export async function formatOutput(
  instruction: string,
  rawOutput: string,
  onLog?: LogCallback
): Promise<StructuredOutput> {
  onLog?.({ role: "system", message: "成果物を資料フォーマットに変換中..." });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `指示:\n${instruction}\n\n---\n\n回答:\n${rawOutput}\n\n---\n\n上記を資料品質の JSON に変換してください。`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (match) {
      const parsed = JSON.parse(match[0]) as StructuredOutput;

      // keyPoints のガード（必ず 3 つ）
      if (!Array.isArray(parsed.keyPoints) || parsed.keyPoints.length === 0) {
        parsed.keyPoints = extractFallbackKeyPoints(parsed);
      }
      parsed.keyPoints = parsed.keyPoints.slice(0, 3);

      // Canva 用スライドデータを生成
      parsed.canvaData = buildCanvaData(parsed);
      parsed.rawText = rawOutput;

      onLog?.({ role: "system", message: `フォーマット完了 [${parsed.questionType}]: ${parsed.title}` });
      return parsed;
    }
  } catch {
    onLog?.({ role: "system", message: "フォーマットに失敗しました。フォールバック表示を使用します" });
  }

  // フォールバック
  return {
    questionType: "情報整理",
    title: instruction.slice(0, 60),
    summary: rawOutput.slice(0, 200) + (rawOutput.length > 200 ? "…" : ""),
    keyPoints: ["回答を確認してください", "詳細は本文をご覧ください", "不明点はお問い合わせください"],
    sections: [{ title: "回答", type: "text", icon: "📋", content: rawOutput }],
    rawText: rawOutput,
  };
}

// ── Canva スライドデータ生成 ─────────────────────────────────
function buildCanvaData(data: StructuredOutput) {
  const TYPE_COLOR: Record<string, string> = {
    "企画":"#2563eb","情報整理":"#0369a1","比較":"#7c3aed","提案":"#059669","ガイド":"#d97706",
  };
  const accentColor = TYPE_COLOR[data.questionType] ?? "#4f46e5";

  const slides: CanvaSlide[] = [
    // スライド 1: カバー
    {
      slideIndex: 0,
      layout: "cover",
      heading: data.title,
      body: data.summary,
      accentColor,
    },
    // スライド 2: サマリー（キーポイント）
    {
      slideIndex: 1,
      layout: "summary",
      heading: "重要ポイント",
      body: data.keyPoints,
      accentColor,
    },
    // スライド 3〜: 各セクション
    ...data.sections.map((s, i): CanvaSlide => ({
      slideIndex: i + 2,
      layout: s.type === "table" ? "table"
             : s.type === "steps" ? "steps"
             : s.type === "list"  ? "list"
             : s.type === "highlight" ? "highlight"
             : "list",
      heading: s.title,
      body: s.tableData ?? s.items ?? s.content ?? "",
      accentColor,
    })),
  ];

  return { documentTitle: data.title, documentType: data.questionType, slides };
}

// ── フォールバック用 keyPoints 抽出 ──────────────────────────
function extractFallbackKeyPoints(data: StructuredOutput): string[] {
  const points: string[] = [];
  for (const s of data.sections) {
    if (points.length >= 3) break;
    if (s.type === "highlight" && s.content) {
      points.push(s.content.slice(0, 30));
    } else if (s.items?.[0]) {
      points.push(s.items[0].slice(0, 30));
    }
  }
  while (points.length < 3) points.push(data.summary.slice(0, 30));
  return points;
}
