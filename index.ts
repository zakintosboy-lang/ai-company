import { runCompany } from "./agents/index.js";
import type { AgentLog, AgentStateUpdate } from "./agents/types.js";

async function main(): Promise<void> {
  const userInstruction =
    process.argv[2] ?? "日本の主要都市（東京・大阪・京都）の特徴と観光スポットを教えてください";

  console.log("=== AI Company 起動 ===");
  console.log("CEO · Manager · Worker × 3 · Reviewer\n");

  await runCompany(
    userInstruction,
    ({ role, message }: AgentLog) => {
      console.log(`[${role.toUpperCase().padEnd(8)}] ${message}`);
    },
    ({ agentId, status, lastMessage }: AgentStateUpdate) => {
      if (lastMessage) {
        console.log(`  >> ${agentId} [${status}]: ${lastMessage}`);
      }
    }
  );
}

main().catch((err) => {
  console.error("[Error]", err);
  process.exit(1);
});
