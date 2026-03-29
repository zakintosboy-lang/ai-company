import Anthropic from "@anthropic-ai/sdk";
import { runWorker, WorkerResult } from "./worker";

const client = new Anthropic();

export async function runSupervisor(
  userInstruction: string,
  onLog?: (message: string) => void
): Promise<string> {
  const log = (msg: string) => {
    if (onLog) onLog(msg);
    else console.log(msg);
  };

  log(`[Supervisor] ユーザー指示を受信: "${userInstruction}"`);
  log("[Supervisor] タスクを分解中...");

  // Step 1: Supervisor breaks the instruction into tasks
  const planResponse = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `以下のユーザー指示を、ワーカーに割り当てる独立したタスクに分解してください。
各タスクは1行で記述し、番号付きリスト形式 (1. タスク内容) で返してください。タスクは最大3つまで。

ユーザー指示: ${userInstruction}`,
      },
    ],
    system:
      "あなたはタスクを管理するスーパーバイザーエージェントです。ユーザーの指示を受け取り、ワーカーに渡す具体的なタスクに分解します。",
  });

  const planText =
    planResponse.content[0].type === "text"
      ? planResponse.content[0].text
      : "";

  log(`[Supervisor] タスク分解結果:\n${planText}`);

  // Step 2: Parse tasks from the plan
  const tasks = planText
    .split("\n")
    .filter((line) => /^\d+\./.test(line.trim()))
    .map((line, index) => ({
      id: `task-${index + 1}`,
      instruction: line.replace(/^\d+\.\s*/, "").trim(),
    }));

  log(`[Supervisor] ${tasks.length}個のタスクをワーカーに割り当てます`);

  // Step 3: Dispatch tasks to workers (in parallel)
  const workerPromises = tasks.map((task) => runWorker(task, onLog));
  const results: WorkerResult[] = await Promise.all(workerPromises);

  log("[Supervisor] 全ワーカーの結果を集約中...");

  // Step 4: Aggregate results
  const aggregateResponse = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `ユーザーの指示: ${userInstruction}

ワーカーの処理結果:
${results.map((r) => `[${r.id}]\n${r.result}`).join("\n\n")}

上記の結果をまとめ、ユーザーへの最終回答を日本語で作成してください。`,
      },
    ],
    system:
      "あなたはスーパーバイザーエージェントです。ワーカーの結果を統合し、ユーザーへの最終的な回答をまとめます。",
  });

  const finalAnswer =
    aggregateResponse.content[0].type === "text"
      ? aggregateResponse.content[0].text
      : "";

  log("[Supervisor] === 最終回答 ===");
  log(finalAnswer);
  log("[Supervisor] === 処理完了 ===");

  return finalAnswer;
}
