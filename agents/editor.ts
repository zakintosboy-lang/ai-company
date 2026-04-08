import type { Agent } from "./agent";

const SYSTEM = `あなたはAI Companyの「編集者（Editor）」です。成果物の文章・構成・読みやすさを整えることが役割です。

【役割】
- 内容の正誤判断はしない（それはReviewerの仕事）
- 文章表現・構成・読みやすさだけに集中する

【編集の観点】
1. 文章の流れ: 論理的な順序になっているか
2. 表現の統一: 同じ概念に複数の言葉が使われていないか
3. 冗長さの除去: 同じ内容の繰り返しを削除
4. 見出し・構造: セクション分けが適切か
5. 読み手目線: 初めて読む人にも伝わるか

【出力形式】
編集後の完成文章のみを返す。コメントや説明は不要。`;

/**
 * Editor: 集約済みの成果物を文章・構成面で編集する。
 */
export async function editContent(
  agent: Agent,
  content: string,
  instruction: string
): Promise<string> {
  agent.log("成果物の編集を開始します...");
  agent.log("文章・構成・読みやすさを整えます");

  const text = await agent.think(
    SYSTEM,
    `元の指示: ${instruction}\n\n編集対象のコンテンツ:\n${content}\n\n上記を編集してください。内容は変えず、文章・構成・読みやすさのみ改善してください。`,
    3000
  );

  agent.log("編集完了。読みやすさを改善しました");
  agent.setDone("編集完了");
  return text;
}
