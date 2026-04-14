import type { StructuredOutput, CanvaSlide, LogCallback, OutputSection, QuestionType, TableData, HighlightVariant } from "./types";

/**
 * Formatter: 平文の回答を高速に構造化 JSON に変換する。
 * LLM を挟まずローカル整形することで、成果物表示までの待ち時間を短縮する。
 */
export async function formatOutput(
  instruction: string,
  rawOutput: string,
  onLog?: LogCallback
): Promise<StructuredOutput> {
  onLog?.({ role: "system", message: "成果物を高速フォーマット中..." });

  const normalized = normalizeText(rawOutput);
  const questionType = detectQuestionType(instruction, normalized);
  const sections = buildSections(normalized);
  const title = buildTitle(instruction, sections, questionType);
  const summary = buildSummary(normalized, sections);
  const keyPoints = buildKeyPoints(normalized, sections, summary);

  const structured: StructuredOutput = {
    questionType,
    title,
    summary,
    keyPoints,
    sections: sections.length > 0 ? sections : [{ title: "回答", type: "text", icon: "📋", content: normalized }],
    rawText: rawOutput,
  };

  structured.canvaData = buildCanvaData(structured);

  onLog?.({ role: "system", message: `フォーマット完了 [${structured.questionType}]: ${structured.title}` });
  return structured;
}

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectQuestionType(instruction: string, rawOutput: string): QuestionType {
  const haystack = `${instruction}\n${rawOutput}`.toLowerCase();

  if (includesAny(haystack, ["比較", "違い", "vs", "比較表"])) return "比較";
  if (includesAny(haystack, ["手順", "やり方", "方法", "進め方", "使い方", "導入方法"])) return "ガイド";
  if (includesAny(haystack, ["提案", "おすすめ", "施策", "改善案", "実行計画"])) return "提案";
  if (includesAny(haystack, ["企画", "事業案", "新規案", "コンセプト", "機能案"])) return "企画";
  return "情報整理";
}

function buildTitle(instruction: string, sections: OutputSection[], questionType: QuestionType) {
  const firstHeading = sections.find((section) => section.title && section.title !== "回答");
  if (firstHeading) return clamp(firstHeading.title, 32);

  const cleanedInstruction = instruction
    .replace(/\s+/g, " ")
    .replace(/[。.!?].*$/, "")
    .trim();

  if (cleanedInstruction) return clamp(cleanedInstruction, 32);
  return `${questionType}レポート`;
}

function buildSummary(rawOutput: string, sections: OutputSection[]) {
  const preferred = sections.find((section) =>
    ["要約", "概要", "サマリー", "結論", "おすすめ", "提案サマリー"].some((word) => section.title.includes(word))
  );

  const source = preferred?.content
    ?? preferred?.items?.join(" ")
    ?? rawOutput;

  const sentences = splitSentences(source).slice(0, 3);
  const summary = sentences.join(" ");
  return clamp(summary || rawOutput, 220);
}

function buildKeyPoints(rawOutput: string, sections: OutputSection[], summary: string) {
  const points: string[] = [];

  for (const section of sections) {
    if (points.length >= 3) break;

    if (section.type === "highlight" && section.content) {
      points.push(toPoint(section.content));
    }

    for (const item of section.items ?? []) {
      if (points.length >= 3) break;
      points.push(toPoint(item));
    }

    if (points.length >= 3) break;

    if (section.content) {
      points.push(toPoint(firstMeaningfulSentence(section.content)));
    }
  }

  if (points.length < 3) {
    splitSentences(rawOutput).forEach((sentence) => {
      if (points.length < 3) points.push(toPoint(sentence));
    });
  }

  if (points.length < 3) {
    points.push(toPoint(summary));
  }

  return unique(points).slice(0, 3);
}

function buildSections(rawOutput: string): OutputSection[] {
  const headingSections = splitByHeadings(rawOutput);
  if (headingSections.length > 0) {
    return headingSections.map(({ title, body }) => parseSection(title, body)).filter(Boolean) as OutputSection[];
  }

  const blocks = rawOutput.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length === 0) return [];

  return blocks.map((block, index) => {
    const title = index === 0 ? "概要" : `セクション ${index}`;
    return parseSection(title, block);
  }).filter(Boolean) as OutputSection[];
}

function splitByHeadings(text: string) {
  const lines = text.split("\n");
  const sections: Array<{ title: string; body: string }> = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentTitle || currentBody.join("\n").trim() === "") return;
    sections.push({ title: currentTitle, body: currentBody.join("\n").trim() });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^\s{0,3}(#{1,4})\s+(.+?)\s*$/);
    if (headingMatch) {
      flush();
      currentTitle = cleanHeading(headingMatch[2]);
      currentBody = [];
      continue;
    }

    const plainHeading = line.match(/^\s*[【\[]?([^\]】\n]{2,28})[】\]]?\s*[:：]\s*$/);
    if (plainHeading) {
      flush();
      currentTitle = cleanHeading(plainHeading[1]);
      currentBody = [];
      continue;
    }

    if (!currentTitle && line.trim()) {
      currentTitle = "概要";
    }
    currentBody.push(line);
  }

  flush();
  return sections;
}

function parseSection(title: string, body: string): OutputSection | null {
  const cleanedBody = normalizeText(body);
  if (!cleanedBody) return null;

  const table = parseMarkdownTable(cleanedBody);
  if (table) {
    return { title, type: "table", icon: "📊", tableData: table };
  }

  const stepItems = parseOrderedList(cleanedBody);
  if (stepItems.length >= 2) {
    return { title, type: "steps", icon: "🚀", items: stepItems };
  }

  const listItems = parseBulletList(cleanedBody);
  if (listItems.length >= 2) {
    return { title, type: "list", icon: pickIcon(title, "list"), items: listItems };
  }

  if (shouldHighlight(title, cleanedBody)) {
    return {
      title,
      type: "highlight",
      icon: pickIcon(title, "highlight"),
      highlight: pickHighlightVariant(title, cleanedBody),
      content: clamp(cleanedBody, 320),
    };
  }

  return { title, type: "text", icon: pickIcon(title, "text"), content: cleanedBody };
}

function parseBulletList(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*・]\s+/.test(line))
    .map((line) => line.replace(/^[-*・]\s+/, "").trim())
    .filter(Boolean);
}

function parseOrderedList(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(\d+[\.\)]|Step\s*\d+|STEP\s*\d+)\s*/i.test(line))
    .map((line) => line.replace(/^(\d+[\.\)]|Step\s*\d+|STEP\s*\d+)\s*/i, "").trim())
    .filter(Boolean);
}

function parseMarkdownTable(text: string): TableData | null {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const tableLines = lines.filter((line) => line.includes("|"));
  if (tableLines.length < 2) return null;

  const rows = tableLines.map((line) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
  );

  if (rows.length < 2) return null;
  const [headers, maybeDivider, ...dataRows] = rows;
  const dividerLike = maybeDivider?.every((cell) => /^:?-{2,}:?$/.test(cell));
  const actualRows = dividerLike ? dataRows : [maybeDivider, ...dataRows].filter(Boolean) as string[][];
  if (!headers?.length || actualRows.length === 0) return null;

  const width = headers.length;
  return {
    headers: headers.slice(0, width),
    rows: actualRows.map((row) => normalizeRow(row, width)).slice(0, 8),
  };
}

function normalizeRow(row: string[], width: number) {
  const normalized = row.slice(0, width);
  while (normalized.length < width) normalized.push("");
  return normalized;
}

function shouldHighlight(title: string, body: string) {
  const haystack = `${title} ${body}`.toLowerCase();
  return (
    includesAny(haystack, ["要約", "まとめ", "結論", "おすすめ", "注意", "リスク", "重要", "ポイント"]) &&
    body.length <= 320
  );
}

function pickHighlightVariant(title: string, body: string): HighlightVariant {
  const haystack = `${title} ${body}`.toLowerCase();
  if (includesAny(haystack, ["注意", "リスク", "懸念", "課題"])) return "warning";
  if (includesAny(haystack, ["結論", "おすすめ", "最適", "推奨"])) return "important";
  if (includesAny(haystack, ["完了", "承認", "実行可能", "確認済み"])) return "success";
  return "info";
}

function pickIcon(title: string, type: OutputSection["type"]) {
  const haystack = title.toLowerCase();
  if (includesAny(haystack, ["比較", "一覧", "料金", "表"])) return "📊";
  if (includesAny(haystack, ["結論", "おすすめ", "提案", "方針"])) return "🎯";
  if (includesAny(haystack, ["手順", "実行", "計画", "ステップ"])) return "🚀";
  if (includesAny(haystack, ["注意", "リスク", "懸念"])) return "⚠";
  if (includesAny(haystack, ["分析", "背景", "概要", "調査"])) return "🔍";
  if (type === "highlight") return "📌";
  if (type === "steps") return "🚀";
  if (type === "table") return "📊";
  return "📋";
}

function cleanHeading(title: string) {
  return title
    .replace(/^[-*・#\s]+/, "")
    .replace(/[：:]$/, "")
    .trim();
}

function splitSentences(text: string) {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[。.!?！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function firstMeaningfulSentence(text: string) {
  return splitSentences(text)[0] ?? text.trim();
}

function toPoint(text: string) {
  return clamp(
    text
      .replace(/^[-*・\d.\s]+/, "")
      .replace(/\s+/g, " ")
      .trim(),
    30
  );
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function clamp(text: string, max: number) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function unique(items: string[]) {
  return items.filter((item, index) => item && items.indexOf(item) === index);
}

// ── Canva スライドデータ生成 ─────────────────────────────────
function buildCanvaData(data: StructuredOutput) {
  const TYPE_COLOR: Record<string, string> = {
    "企画":"#2563eb","情報整理":"#0369a1","比較":"#7c3aed","提案":"#059669","ガイド":"#d97706",
  };
  const accentColor = TYPE_COLOR[data.questionType] ?? "#4f46e5";

  const slides: CanvaSlide[] = [
    {
      slideIndex: 0,
      layout: "cover",
      heading: data.title,
      body: data.summary,
      accentColor,
    },
    {
      slideIndex: 1,
      layout: "summary",
      heading: "重要ポイント",
      body: data.keyPoints,
      accentColor,
    },
    ...data.sections.map((s, i): CanvaSlide => ({
      slideIndex: i + 2,
      layout: s.type === "table" ? "table"
             : s.type === "steps" ? "steps"
             : s.type === "list" ? "list"
             : s.type === "highlight" ? "highlight"
             : "list",
      heading: s.title,
      body: s.tableData ?? s.items ?? s.content ?? "",
      accentColor,
    })),
  ];

  return { documentTitle: data.title, documentType: data.questionType, slides };
}
