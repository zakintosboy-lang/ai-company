import type { StructuredOutput, DesignSpec, LogCallback } from "./types";
import type { Agent } from "./agent";

const SYSTEM = `あなたはAI Companyの「デザイン担当（Designer）」です。Canvaで再現できるデザイン仕様書の作成が役割です。

【Phase 6: デザイン設計】

以下を具体的に指示してください:

1. レイアウト構成: ページ数・各ページの役割・要素の配置
2. カラーパレット: メインカラー・サブカラー・アクセント（必ずHEX値で指定）
3. フォント指定: 見出し・本文・アクセント（Canvaで使えるフォント名）
4. 余白・配置: 要素間のスペース・上下左右のマージン
5. デザインコンセプト: 全体の雰囲気・トーン

Canvaで即座に再現できる具体的な仕様にしてください。

必ず以下のJSON形式のみで返してください（コードブロック不要）:
{
  "concept": "デザインコンセプト（30字以内）",
  "colors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "background": "#HEX",
    "text": "#HEX"
  },
  "fonts": {
    "heading": "フォント名（Canva対応）",
    "body": "フォント名（Canva対応）",
    "accent": "フォント名（Canva対応）"
  },
  "layout": [
    {
      "page": 1,
      "name": "ページ名",
      "elements": ["要素1（位置・サイズも記載）", "要素2"]
    }
  ],
  "canvaInstructions": "Canva作成手順（改行区切りで3〜5ステップ）"
}`;

/**
 * Designer: Phase 6 - 成果物のデザイン仕様を Agent クラス経由で生成する。
 */
export async function generateDesignSpec(
  agent: Agent,
  structured: StructuredOutput
): Promise<DesignSpec | null> {
  agent.log("デザイン仕様書を作成します...");
  agent.log(`テーマ「${structured.title}」のレイアウトを設計中`);

  const summary = `
タイトル: ${structured.title}
タイプ: ${structured.questionType}
サマリー: ${structured.summary}
セクション数: ${structured.sections.length}
キーポイント: ${structured.keyPoints.join(" / ")}
`.trim();

  const rawText = await agent.think(
    SYSTEM,
    `以下の成果物に合うCanvaデザイン仕様書を作成してください:\n\n${summary}`,
    1024
  );

  try {
    const cleaned = rawText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const spec = JSON.parse(match[0]) as DesignSpec;
      agent.log(`デザイン完成: ${spec.concept}`);
      agent.log(`メインカラー: ${spec.colors.primary} / フォント: ${spec.fonts.heading}`);
      agent.setDone("デザイン仕様書 完成");
      return spec;
    }
  } catch {
    agent.log("デザイン仕様のパースに失敗しました");
  }

  agent.setDone("完了");
  return null;
}

/**
 * 後方互換用（onLog のみで呼ぶ旧 API）— index.ts で Agent 経由に統一済み
 */
export async function generateDesignSpecLegacy(
  _structured: StructuredOutput,
  onLog?: LogCallback
): Promise<DesignSpec | null> {
  onLog?.({ role: "system", message: "デザイン: Agent経由に移行しました" });
  return null;
}
