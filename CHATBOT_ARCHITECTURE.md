# Chatbot architecture — how the Dupla assistant connects to Claude

How the site's chat assistant works end to end, and how the Claude API is used.
Companion to [CHATBOT.md](./CHATBOT.md) (the product plan / phases).

## Big picture

```
Browser (chat widget)
   │  POST /api/chat  { messages: [...] }
   ▼
Next.js route handler  (runs on the server, Vercel)   ← ANTHROPIC_API_KEY lives here
   │  calls the engine
   ▼
Chat engine  →  Anthropic SDK  →  Claude API (api.anthropic.com)
   ▲                                   │ streams tokens back
   └───────────────────────────────────┘
   │  server streams text to the browser as it arrives
   ▼
Browser renders the reply appearing word-by-word
```

**Key idea:** the browser never talks to Claude directly. It talks to *our*
server (`/api/chat`), and the server talks to Claude. The API key and all logic
stay on the server.

## The pieces (files)

| File | Runs on | Responsibility |
| --- | --- | --- |
| `src/app/chat-widget.tsx` | Browser | Floating chat UI. Holds the conversation in React state; `fetch`es `/api/chat` and reads the streamed reply. Knows nothing about Claude or the API key. |
| `src/app/api/chat/route.ts` | Server | Backend endpoint. Validates/caps the incoming messages, calls the engine, and pipes Claude's output back to the browser as a streamed `Response`. |
| `src/lib/chat/engine.ts` | Server | The only file that uses the Anthropic SDK. Builds the request and streams the reply. Isolated so the provider/model can be swapped without touching anything else. |
| `src/lib/chat/knowledge.ts` | Server | The Spanish Dupla knowledge (services, AI courses, tone, rules) — becomes the **system prompt**. |

## How the Claude API is called

The whole Claude API is essentially **one endpoint** — `messages.stream` /
`messages.create`. In `engine.ts` (simplified):

```ts
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();            // reads ANTHROPIC_API_KEY from the env

const stream = client.messages.stream({
  model: "claude-haiku-4-5",               // which model (swap here for Sonnet/Opus)
  max_tokens: 1024,                        // cap on reply length
  system: [{                               // standing "who you are" instructions
    type: "text",
    text: SYSTEM_PROMPT,                   // Dupla knowledge
    cache_control: { type: "ephemeral" },  // prompt caching (see below)
  }],
  messages: history,                       // the conversation so far
});

for await (const event of stream) {        // tokens arrive as they're generated
  if (event.type === "content_block_delta" && event.delta.type === "text_delta")
    yield event.delta.text;                // hand each chunk up to the route
}
```

You send Claude three things and it replies:

- **`model`** — `claude-haiku-4-5` (cheap/fast). Changing this one string switches
  models.
- **`system`** — the standing instructions (Dupla's identity + knowledge), sent on
  every request.
- **`messages`** — the back-and-forth, an array of
  `{ role: "user" | "assistant", content }`.

The API is **stateless**: Claude does not remember previous calls, so the full
conversation is resent each turn. That's why the widget keeps the history and the
route caps it (`MAX_TURNS`, `MAX_LEN`) to bound token cost.

## Streaming

We use `messages.stream` (not a single blocking call). Claude returns the answer
token-by-token; the engine `yield`s each chunk → the route forwards it as a
`ReadableStream` → the widget appends it. That produces the "typing" effect and
avoids timeouts on longer replies.

## Authentication

`new Anthropic()` automatically reads the **`ANTHROPIC_API_KEY`** environment
variable (set in Vercel → Project → Settings → Environment Variables, and in
`.env.local` for local dev). The SDK sends it as an HTTP header to
`api.anthropic.com` on each request. The key is never shipped to the browser.

## Prompt caching

`cache_control: { type: "ephemeral" }` on the system prompt tells Claude to cache
the stable Dupla-knowledge prefix so repeat turns don't pay full price for it
(cached input is ~10% of the cost). It only activates above a minimum prompt size,
so for the current smallish prompt it may be a no-op — harmless either way.

## Why server-side (security)

If the browser called Claude directly, the API key would be visible in dev tools
and could be stolen. Routing through `/api/chat` instead means:

- the **key stays on the server**,
- we control **cost** (history caps now; rate limiting later),
- we can add **tools** (lead capture, booking) and **persistence** without the
  client knowing,
- and we can **swap providers** without touching the front end.

## Cost

Model is **Haiku 4.5** (~$1 / million input tokens, ~$5 / million output). A chat
turn is a few hundred tokens, so cost is fractions of a cent per message. Billing
is prepaid credits on the Anthropic account (console.anthropic.com → Billing).

## Where the next pieces plug in

The same flow extends cleanly (see CHATBOT.md for the phase plan):

- **Persistence** — the route writes each turn to Supabase (`chat_conversations`,
  `chat_messages`) via a server-side client.
- **Tools (lead capture / booking / hand-off)** — declared on the Claude request;
  when Claude calls one, the engine runs it server-side (write to Supabase + email
  javiera@duplaconsulting.cl) and feeds the result back into the same loop.
- **Other channels** — a WhatsApp/Telegram webhook would call the same
  `engine.ts`; only the transport in front changes.
