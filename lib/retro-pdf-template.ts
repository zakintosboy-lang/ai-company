// レトロゲーム風PDFテンプレート（HTML生成）

export interface PdfData {
  title: string;
  subtitle?: string;
  concept?: string;
  info?: { label: string; value: string; icon: string }[];
  days?: DayPlan[];
  summary?: SummaryData;
}

export interface DayPlan {
  dayLabel: string;    // "DAY 01"
  commands: CommandItem[];
}

export interface CommandItem {
  category: "移動" | "宿泊" | "食事" | "観光" | string;
  time?: string;
  title: string;
  detail: string;
  cost?: string;
}

export interface SummaryData {
  totalCost: string;
  breakdown: { label: string; cost: string }[];
  hp: number;   // 満足度 0-100
  mp: number;   // 予算余力 0-100
  exp: number;  // 達成度 0-100
  notes?: string[];
  bonuses?: string[];
}

// ─── カラー定数 ──────────────────────────────────────────────
const C = {
  bg: "#0F172A",
  dark: "#1E293B",
  green: "#22C55E",
  blue: "#38BDF8",
  yellow: "#FACC15",
  red: "#EF4444",
  white: "#F8FAFC",
  muted: "#475569",
  border: "#334155",
};

// ─── 共通パーツ ───────────────────────────────────────────────

function hpBar(value: number, color: string, total = 14): string {
  const filled = Math.round((value / 100) * total);
  const cells = Array.from({ length: total }, (_, i) =>
    `<span style="display:inline-block;width:14px;height:10px;background:${i < filled ? color : C.border};margin:0 1px;border-radius:1px;"></span>`
  ).join("");
  return `<span style="font-family:monospace;">${cells}</span>`;
}

function dotLine(): string {
  return `<div style="border-top:2px dashed ${C.border};margin:10px 0;"></div>`;
}

function pageHeader(label: string, page: string): string {
  return `
    <div style="background:${C.dark};padding:10px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:0;">
      <span style="font-family:'Courier New',monospace;font-size:11px;color:${C.green};font-weight:700;letter-spacing:0.1em;">▶ ${label}</span>
      <span style="font-family:'Courier New',monospace;font-size:10px;color:${C.muted};">[ ${page} ]</span>
    </div>
    <div style="height:2px;background:linear-gradient(to right,${C.green},${C.blue},transparent);margin-bottom:20px;"></div>
  `;
}

function window_(title: string, content: string, borderColor = C.blue): string {
  return `
    <div style="border:2px solid ${borderColor};border-radius:4px;overflow:hidden;margin-bottom:16px;">
      <div style="background:${borderColor};padding:4px 12px;">
        <span style="font-family:'Courier New',monospace;font-size:9px;color:${C.bg};font-weight:700;letter-spacing:0.12em;">${title}</span>
      </div>
      <div style="background:${C.dark};padding:14px 16px;">
        ${content}
      </div>
    </div>
  `;
}

// ─── ページ生成 ───────────────────────────────────────────────

function coverPage(data: PdfData): string {
  return `
    <div class="page" style="background:${C.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;min-height:100vh;">
      <!-- HPバー装飾（上） -->
      <div style="position:absolute;top:24px;left:24px;right:24px;display:flex;gap:3px;">
        ${Array.from({ length: 20 }, (_, i) => {
          const pct = i / 19;
          const col = pct < 0.5 ? C.green : pct < 0.8 ? C.yellow : C.red;
          return `<div style="flex:1;height:8px;background:${col};border-radius:1px;"></div>`;
        }).join("")}
      </div>

      <!-- ドット装飾ライン -->
      <div style="font-family:monospace;font-size:14px;color:${C.muted};letter-spacing:8px;margin-bottom:32px;">
        ★ · ★ · ★ · ★ · ★
      </div>

      <!-- タイトルウィンドウ -->
      <div style="border:3px dashed ${C.green};border-radius:6px;padding:40px 48px;background:${C.dark};text-align:center;position:relative;">
        <!-- 四隅装飾 -->
        ${["top:0;left:0","top:0;right:0","bottom:0;left:0","bottom:0;right:0"].map(pos =>
          `<div style="position:absolute;${pos};width:12px;height:12px;background:${C.green};"></div>`
        ).join("")}

        <div style="font-family:'Courier New',monospace;font-size:28px;font-weight:900;color:${C.yellow};letter-spacing:0.06em;line-height:1.3;text-shadow:0 0 20px ${C.yellow}66;">
          ${data.title}
        </div>
        ${data.subtitle ? `
        <div style="font-family:'Courier New',monospace;font-size:12px;color:${C.blue};margin-top:16px;letter-spacing:0.1em;">
          ── ${data.subtitle} ──
        </div>` : ""}
      </div>

      <!-- PRESS START -->
      <div style="font-family:'Courier New',monospace;font-size:10px;color:${C.white};margin-top:32px;letter-spacing:0.15em;">
        ▼ PRESS  START  ▼
      </div>

      <!-- HPバー装飾（下） -->
      <div style="position:absolute;bottom:24px;left:24px;right:24px;display:flex;gap:3px;">
        ${Array.from({ length: 20 }, (_, i) => {
          const pct = i / 19;
          const col = pct < 0.5 ? C.green : pct < 0.8 ? C.yellow : C.red;
          return `<div style="flex:1;height:8px;background:${col};border-radius:1px;"></div>`;
        }).join("")}
      </div>
    </div>
  `;
}

function overviewPage(data: PdfData): string {
  const conceptContent = `
    <p style="font-family:'Noto Sans',sans-serif;font-size:12px;color:${C.white};line-height:1.9;margin:0;">
      ${data.concept ?? "コンセプトを入力してください。"}
    </p>
  `;

  const infoContent = (data.info ?? []).map(item => `
    <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid ${C.border};">
      <span style="font-size:16px;width:24px;text-align:center;">${item.icon}</span>
      <span style="font-family:'Courier New',monospace;font-size:9px;color:${C.muted};flex:1;letter-spacing:0.08em;">${item.label}</span>
      <span style="font-family:'Courier New',monospace;font-size:11px;color:${C.white};font-weight:700;">${item.value}</span>
    </div>
  `).join("");

  const statusBar = (label: string, value: number, color: string) => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="font-family:'Courier New',monospace;font-size:10px;color:${color};width:28px;font-weight:700;">${label}</span>
      ${hpBar(value, color)}
      <span style="font-family:'Courier New',monospace;font-size:10px;color:${C.yellow};min-width:36px;">${value}%</span>
    </div>
  `;

  return `
    <div class="page" style="background:${C.bg};padding:24px;">
      ${pageHeader("OVERVIEW", "P.01")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        ${window_("// CONCEPT", conceptContent, C.blue)}
        ${window_("// INFO", infoContent, C.yellow)}
      </div>
      <div style="background:${C.dark};border:1px solid ${C.border};border-radius:4px;padding:14px 16px;">
        ${statusBar("HP", 80, C.green)}
        ${statusBar("MP", 60, C.blue)}
      </div>
    </div>
  `;
}

function dayPage(day: DayPlan, pageNum: number): string {
  const categoryColor: Record<string, string> = {
    移動: C.blue,
    宿泊: C.yellow,
    食事: C.green,
    観光: "#C084FC",
  };

  const commandList = day.commands.map((cmd, i) => {
    const col = categoryColor[cmd.category] ?? C.white;
    const isFirst = i === 0;
    return `
      <div style="margin-bottom:12px;">
        <!-- コマンド行 -->
        <div style="background:${isFirst ? "#1e3a2f" : "transparent"};padding:6px 10px;display:flex;align-items:center;gap:10px;border-left:3px solid ${col};">
          <span style="font-family:'Courier New',monospace;font-size:11px;color:${col};font-weight:700;">${isFirst ? "▶" : "　"} ${cmd.category}</span>
          ${cmd.time ? `<span style="font-family:'Courier New',monospace;font-size:9px;color:${C.muted};">${cmd.time}</span>` : ""}
        </div>
        <!-- 詳細ボックス -->
        <div style="background:${C.dark};border:1px solid ${C.border};border-radius:0 0 4px 4px;padding:10px 14px;margin-top:2px;">
          <div style="font-family:'Courier New',monospace;font-size:11px;color:${C.white};font-weight:700;margin-bottom:4px;">${cmd.title}</div>
          <div style="font-family:'Noto Sans',sans-serif;font-size:10px;color:${C.muted};line-height:1.7;">${cmd.detail}</div>
          ${cmd.cost ? `<div style="font-family:'Courier New',monospace;font-size:11px;color:${C.yellow};margin-top:6px;">¥ ${cmd.cost}</div>` : ""}
        </div>
        ${dotLine()}
      </div>
    `;
  }).join("");

  return `
    <div class="page" style="background:${C.bg};padding:24px;">
      ${pageHeader(day.dayLabel, `P.0${pageNum}`)}
      ${window_("·· COMMAND ··", commandList, C.green)}
    </div>
  `;
}

function summaryPage(data: SummaryData): string {
  const breakdownRows = data.breakdown.map(b => `
    <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed ${C.border};">
      <span style="font-family:'Noto Sans',sans-serif;font-size:10px;color:${C.muted};">${b.label}</span>
      <span style="font-family:'Courier New',monospace;font-size:10px;color:${C.white};">¥ ${b.cost}</span>
    </div>
  `).join("");

  const gauge = (label: string, value: number, color: string, hint: string) => `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span style="font-family:'Courier New',monospace;font-size:10px;color:${color};font-weight:700;">${label}　<span style="color:${C.muted};font-size:9px;">${hint}</span></span>
        <span style="font-family:'Courier New',monospace;font-size:10px;color:${C.yellow};">${value}%</span>
      </div>
      ${hpBar(value, color, 16)}
    </div>
  `;

  const notesList = (data.notes ?? []).map(n =>
    `<div style="font-family:'Noto Sans',sans-serif;font-size:10px;color:${C.muted};padding:4px 0;">⚠ ${n}</div>`
  ).join("");

  const bonusList = (data.bonuses ?? []).map(b =>
    `<div style="font-family:'Courier New',monospace;font-size:10px;color:${C.green};padding:3px 0;">✨ ${b}</div>`
  ).join("");

  return `
    <div class="page" style="background:${C.bg};padding:24px;">
      ${pageHeader("FINAL STATUS", "FINAL")}

      <!-- ステータスゲージ -->
      ${window_("// ADVENTURE STATUS", `
        ${gauge("HP", data.hp, C.green, "= 満足度")}
        ${gauge("MP", data.mp, C.blue, "= 予算余力")}
        ${gauge("EXP", data.exp, C.yellow, "= 達成度")}
      `, C.yellow)}

      <!-- 総額 -->
      ${window_("// RESULT", `
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-family:'Courier New',monospace;font-size:9px;color:${C.muted};letter-spacing:0.1em;">TOTAL COST</div>
          <div style="font-family:'Courier New',monospace;font-size:26px;color:${C.yellow};font-weight:900;margin-top:4px;">¥ ${data.totalCost}</div>
        </div>
        ${breakdownRows}
      `, C.green)}

      <!-- ボーナス・注意点 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${window_("// BONUS", bonusList || '<span style="color:#475569;font-size:10px;">—</span>', C.green)}
        ${window_("// CAUTION", notesList || '<span style="color:#475569;font-size:10px;">—</span>', C.red)}
      </div>

      <!-- エンディング -->
      <div style="text-align:center;margin-top:24px;padding:12px 0;border-top:1px solid ${C.border};border-bottom:1px solid ${C.border};">
        <span style="font-family:'Courier New',monospace;font-size:10px;color:${C.muted};letter-spacing:0.15em;">
          &gt;&gt; THANK YOU FOR PLAYING &lt;&lt;
        </span>
      </div>
    </div>
  `;
}

// ─── メイン出力 ───────────────────────────────────────────────

export function buildRetroPdfHtml(data: PdfData): string {
  const pages: string[] = [coverPage(data), overviewPage(data)];

  (data.days ?? []).forEach((day, i) => {
    pages.push(dayPage(day, i + 2));
  });

  if (data.summary) {
    pages.push(summaryPage(data.summary));
  }

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Retro PDF</title>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Mono:wght@400;700&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet" />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; font-family: 'Noto Sans JP', sans-serif; }
        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          page-break-after: always;
          position: relative;
          overflow: hidden;
        }
        @media print {
          @page { size: A4; margin: 0; }
          body { background: #0F172A; }
          .page { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      ${pages.join("\n")}
    </body>
    </html>
  `;
}
