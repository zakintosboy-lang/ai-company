import { NextRequest } from "next/server";
import { runSupervisor } from "@/agents/supervisor";

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
      const send = (type: string, data: string) => {
        const event = `data: ${JSON.stringify({ type, data })}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      try {
        const result = await runSupervisor(instruction.trim(), (msg) =>
          send("log", msg)
        );
        send("complete", result);
      } catch (err) {
        send("error", err instanceof Error ? err.message : String(err));
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
