import { runCompany } from "./agents/index.js";
import type { AgentLog, AgentStateUpdate, StructuredOutput } from "./agents/types.js";

async function main(): Promise<void> {
  const userInstruction =
    process.argv[2] ?? "日本の主要都市（東京・大阪・京都）の特徴と観光スポットを教えてください";

  console.log("=== AI Company 起動 ===");
  console.log("CEO · Manager · Worker × 3 · Reviewer\n");

  const result = await runCompany(
    userInstruction,
    ({ role, message }: AgentLog) => {
      console.log(`[${role.toUpperCase().padEnd(8)}] ${message}`);
    },
    ({ agentId, status, lastMessage }: AgentStateUpdate) => {
      if (lastMessage) console.log(`  >> ${agentId} [${status}]: ${lastMessage}`);
    }
  );

  printStructured(result);
}

function printStructured(data: StructuredOutput): void {
  const divider = "=".repeat(60);
  console.log(`\n${divider}`);
  console.log(`[${data.questionType}] ${data.title}`);
  console.log(divider);
  console.log(`サマリー: ${data.summary}`);
  console.log(divider);

  for (const section of data.sections) {
    console.log(`\n【${section.title}】`);
    switch (section.type) {
      case "text":
      case "highlight":
        console.log(section.content);
        break;
      case "list":
        section.items?.forEach((item) => console.log(`  • ${item}`));
        break;
      case "steps":
        section.items?.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
        break;
      case "table":
        if (section.tableData) {
          console.log(section.tableData.headers.join(" | "));
          console.log("-".repeat(40));
          section.tableData.rows.forEach((row) => console.log(row.join(" | ")));
        }
        break;
    }
  }
  console.log(`\n${divider}`);
}

main().catch((err) => {
  console.error("[Error]", err);
  process.exit(1);
});
