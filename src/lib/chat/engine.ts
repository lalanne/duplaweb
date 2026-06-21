import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./knowledge";

// Channel-agnostic chat engine. The web widget (and, later, WhatsApp/Telegram
// adapters) all call streamReply — only the transport differs.

export const CHAT_MODEL = "claude-haiku-4-5";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const client = new Anthropic();

// Streams Claude's reply as text deltas. Caller decides how to deliver them.
export async function* streamReply(
  history: ChatMessage[],
): AsyncGenerator<string> {
  const stream = client.messages.stream({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Cache the stable knowledge prefix (no-op below Haiku's 4096-token
        // minimum, which is fine).
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
