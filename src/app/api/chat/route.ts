import { streamReply, type ChatMessage } from "@/lib/chat/engine";

export const runtime = "nodejs";

const MAX_TURNS = 20; // cap history sent to Claude to bound token cost
const MAX_LEN = 4000; // cap per-message length

function sanitize(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages)) return null;
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (
      !m ||
      typeof m !== "object" ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string"
    ) {
      return null;
    }
    out.push({ role: m.role, content: m.content.slice(0, MAX_LEN) });
  }
  // Conversation must be non-empty and end on a user turn.
  if (out.length === 0 || out[out.length - 1].role !== "user") return null;
  return out.slice(-MAX_TURNS);
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "El asistente no está configurado." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const messages = sanitize((body as { messages?: unknown })?.messages);
  if (!messages) {
    return Response.json({ error: "Mensajes inválidos." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamReply(messages)) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        // TEMP: surface the real error to diagnose setup issues. Revert to a
        // generic message once the chatbot is confirmed working.
        console.error("chat error:", err);
        const detail = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\n[Error: ${detail}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
