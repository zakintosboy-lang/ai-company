import { NextRequest } from "next/server";
import { runCompany } from "@/agents/index";
import type { AgentLog } from "@/agents/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { instruction } = await request.json();

  if (!instruction?.trim()) {
    return new Response(JSON.stringify({ error: "instruction is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        const line = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      try {
        const result = await runCompany(
          instruction.trim(),
          (log: AgentLog) => send({ type: "log", role: log.role, message: log.message })
        );
        send({ type: "complete", data: result });
      } catch (err) {
        send({ type: "error", data: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
