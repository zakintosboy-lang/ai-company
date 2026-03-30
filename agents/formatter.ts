import Anthropic from "@anthropic-ai/sdk";
import type { StructuredOutput, LogCallback } from "./types";

const client = new Anthropic();

const SYSTEM = `あなたは回答内容を構造化するフォーマッターです。
与えられた指示と回答を分析し、読みやすい構造化データとして JSON で返します。

【質問タイプの定義】
- 企画: アプリ・サービス・事業・プロジェクトの企画・立案
- 情報整理: 情報の調査・説明・要約・まとめ
- 比較: 複数の選択肢・製品・技術・手法の比較
- 提案: 改善案・戦略・施策・計画の提案
- ガイド: 手順・方法・チュートリアル・使い方の説明

【セクションタイプの定義】
- "text"      : 段落テキスト (content フィールドに文章。改行は \\n で表現)
- "list"      : 箇条書き (items 配列に各項目)
- "steps"     : 番号付き手順 (items 配列に各ステップ)
- "table"     : 比較表 (tableData: { headers: string[], rows: string[][] })
- "highlight" : 重要ボックス (content + highlight: "info"|"warning"|"success"|"important")

【質問タイプ別の推奨セクション構成】
企画    → [プロジェクト概要(highlight:info), 課題・背景(text), コンセプト(text), 主要機能(list), 収益・実現方法(text), 開発・実行手順(steps), リスク・注意点(highlight:warning)]
情報整理 → [要点まとめ(highlight:info), 概要(text), 詳細(list or text), 補足・関連情報(text)]
比較    → [比較の目的(text), 比較表(table), 各オプションの特徴(list), 結論・推奨(highlight:important)]
提案    → [提案サマリー(highlight:info), 背景・課題(text), 提案内容(list), 期待効果(list), 実施ステップ(steps), 注意事項(highlight:warning)]
ガイド  → [結論・要点(highlight:important), 前提条件・準備(list), 手順(steps), よくある問題(list), まとめ(text)]

【重要なルール】
- content や items の値にはマークダウン記法（**bold** など）を使わない
- items の各要素は 1〜3 文程度の完結した文章にする
- table の rows は header の列数と一致させる
- summary は回答全体の要点を 2〜3 文でまとめた文章にする
- JSON のみを返す（コードブロックや説明文は不要）`;

/**
 * Formatter: 平文の回答を構造化 JSON に変換する。
 * 質問タイプを自動判定し、タイプ別の最適レイアウトを選択する。
 */
export async function formatOutput(
  instruction: string,
  rawOutput: string,
  onLog?: LogCallback
): Promise<StructuredOutput> {
  onLog?.({ role: "system", message: "成果物を構造化フォーマット中..." });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `指示:\n${instruction}\n\n---\n\n回答:\n${rawOutput}\n\n---\n\n上記を分析し、JSON を返してください。`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // マークダウンコードブロック除去
    const cleaned = text
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```$/m, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as StructuredOutput;
      parsed.rawText = rawOutput;
      onLog?.({ role: "system", message: `構造化完了 [${parsed.questionType}]: ${parsed.title}` });
      return parsed;
    }
  } catch {
    onLog?.({ role: "system", message: "構造化に失敗しました。フォールバック表示を使用します" });
  }

  // フォールバック
  return {
    questionType: "情報整理",
    title: instruction.slice(0, 60),
    summary: rawOutput.slice(0, 200) + (rawOutput.length > 200 ? "…" : ""),
    sections: [{ title: "回答", type: "text", content: rawOutput }],
    rawText: rawOutput,
  };
}
