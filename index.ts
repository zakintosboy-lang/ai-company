import { runCompany } from "./agents/index.js";

async function main(): Promise<void> {
  const userInstruction =
    process.argv[2] ?? "日本の主要都市（東京・大阪・京都）の特徴と観光スポットを教えてください";

  console.log("=== AI Company 起動 ===");
  console.log("CEO · Manager · Worker · Reviewer アーキテクチャ\n");

  await runCompany(userInstruction, ({ role, message }) => {
    console.log(`[${role.toUpperCase()}] ${message}`);
  });
}

main().catch((err) => {
  console.error("[Error]", err);
  process.exit(1);
});
