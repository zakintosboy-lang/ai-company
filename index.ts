import { runSupervisor } from "./agents/supervisor.js";

async function main(): Promise<void> {
  // ユーザーからの指示例
  const userInstruction =
    process.argv[2] ?? "日本の主要都市（東京・大阪・京都）の特徴と観光スポットを教えてください";

  console.log("=== AI Company 起動 ===");
  console.log("Supervisor → Worker アーキテクチャ\n");

  await runSupervisor(userInstruction);
}

main().catch((err) => {
  console.error("[Error]", err);
  process.exit(1);
});
