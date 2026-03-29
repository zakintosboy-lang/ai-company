import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface WorkerTask {
  id: string;
  instruction: string;
}

export interface WorkerResult {
  id: string;
  result: string;
}

export async function runWorker(
  task: WorkerTask,
  onLog?: (message: string) => void
): Promise<WorkerResult> {
  const log = (msg: string) => {
    if (onLog) onLog(msg);
    else console.log(msg);
  };

  log(`[Worker] タスク受信 (id: ${task.id}): "${task.instruction}"`);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: task.instruction,
      },
    ],
    system:
      "あなたは与えられたタスクを丁寧に処理するワーカーエージェントです。簡潔かつ正確に結果を返してください。",
  });

  const result =
    response.content[0].type === "text" ? response.content[0].text : "";

  log(`[Worker] タスク完了 (id: ${task.id}): "${result.slice(0, 60)}..."`);

  return { id: task.id, result };
}
