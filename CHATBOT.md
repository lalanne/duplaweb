# Chatbot plan — Dupla AI assistant

A client-facing LLM chatbot for duplaconsulting.cl.

Status: **Phases 1–2a built and live** — the streaming chat widget answers
questions on the site (engine + `/api/chat` + widget). Persistence, lead
capture/booking/hand-off, and the admin leads view are still pending.

For how the built integration works, see
[CHATBOT_ARCHITECTURE.md](./CHATBOT_ARCHITECTURE.md).

## Goal

A chat assistant on the public site that answers questions about Dupla (services,
recruitment, the new AI/Claude courses) in Spanish, captures leads, helps book a
call, and hands off to a human when needed.

## Decisions (confirmed)

- **Channel:** web chat widget on the site. (Built channel-agnostically so
  WhatsApp / Telegram can be added later as thin adapters — see "Future
  channels".)
- **Scope at launch:** (1) answer questions about Dupla, (2) capture leads,
  (3) book a meeting/call, (4) hand off to a human.
- **Model:** Claude **Haiku 4.5** (`claude-haiku-4-5`) — cheapest, fast, fine for
  FAQ-style chat. Swappable later (Sonnet 4.6 / Opus 4.8) via one constant.

## Architecture

Everything runs on the existing stack (Next.js 16 on Vercel + Supabase). A
channel-agnostic **chat engine** does the Claude call + knowledge + persistence;
the web widget is the first adapter in front of it.

```
Web widget (client)  ─►  /api/chat (route handler)  ─►  chat engine
                                                          ├─ Claude (Anthropic SDK, streaming)
                                                          ├─ Dupla knowledge (system prompt, cached)
                                                          ├─ tools: capture_lead / request_meeting / handoff
                                                          └─ Supabase (conversations, messages, leads)
```

### Pieces

- **Widget** — a `"use client"` floating chat button + panel, reused brand styling
  (`#1E63E9`). Streams the reply token-by-token. Anonymous visitors get a
  client-generated conversation id (cookie/localStorage).
- **Route handler** — `src/app/api/chat/route.ts` (Node runtime). Receives the
  message + conversation id, loads history from Supabase, calls Claude with
  streaming, runs any tool calls, persists, and streams text back to the widget.
- **Chat engine** — `src/lib/chat/` : builds the system prompt, calls the
  Anthropic SDK (`@anthropic-ai/sdk`), runs the tool loop. Channel-agnostic so a
  future WhatsApp/Telegram webhook can call the same function.
- **Knowledge** — Dupla's services, AI-courses info, FAQ, and tone live in one
  system-prompt string (`src/lib/chat/knowledge.ts`), reusing the content already
  in `src/app/page.tsx`. Prompt-cache it (note: Haiku's min cacheable prefix is
  4096 tokens — if the knowledge is smaller, caching is a no-op, which is fine).

### Claude integration specifics

- SDK: `@anthropic-ai/sdk` (new dependency). Model constant `claude-haiku-4-5`.
- **Streaming** for the widget (`client.messages.stream`), `max_tokens` ~1024
  (chat replies are short).
- **No extended thinking / effort** — not needed for FAQ chat, and the `effort`
  param errors on Haiku 4.5.
- **Tool use** for the three actions (server-executed):
  - `capture_lead(name, contact, interest)` → insert into `leads` + email Dupla.
  - `request_meeting(name, contact, preferred_time, topic)` → insert a lead with
    a meeting flag + email Dupla.
  - `handoff(reason, summary)` → flag the conversation for a human + email Dupla.
- API key in a Vercel env var (`ANTHROPIC_API_KEY`); never shipped to the client.

### Notifications

Leads, booking requests, and hand-offs are emailed to **javiera@duplaconsulting.cl**
(for now — a single recipient; can grow into Telegram/WhatsApp/Slack later). Send
via a transactional email provider (e.g. Resend) using a Vercel env var for the
API key; the sender domain `duplaconsulting.cl` needs SPF/DKIM, which already exist
for M365 — add the provider's records alongside. The admin leads page is the
durable record; email is the instant ping.

## Data model (new Supabase tables)

```
chat_conversations (id, visitor_id, channel 'web', status, created_at, updated_at)
chat_messages      (id, conversation_id, role 'user'|'assistant', content, created_at)
leads              (id, conversation_id, name, contact, interest, kind 'lead'|'meeting',
                    notes, created_at)
```

RLS: these are written by the **server** (service role / server-side insert), not
the browser directly — visitors don't read each other's chats. Admins (Dupla)
can read `leads` and conversations from the panel. (Exact policies decided at
implementation; mirror the existing admin-read pattern.)

Optional later: a `/panel/admin/leads` page so admins see captured leads and
flagged hand-offs.

## Security & ops

- Rate-limit `/api/chat` per visitor/IP to control cost and abuse.
- Cap conversation length sent to Claude (last N turns) so token cost stays bounded.
- Validate/trim tool inputs server-side before writing to Supabase.
- Log token usage per conversation for cost visibility.

## Phased plan

1. **Engine + knowledge** — Anthropic SDK wired up, Dupla system prompt, a plain
   `/api/chat` that answers questions (no tools, no persistence yet). Prove the
   brain works.
2. **Widget + persistence** — floating chat UI with streaming; store
   conversations/messages in Supabase.
3. **Tools** — `capture_lead`, `request_meeting`, `handoff`, each emailing
   javiera@duplaconsulting.cl (via a transactional email provider, e.g. Resend).
4. **Admin leads view** — `/panel/admin/leads` for the team to see leads + hand-offs.
5. **Polish** — rate limiting, token-usage logging, conversation length caps,
   prompt-cache tuning.

## Future channels (deferred)

Because the engine is channel-agnostic, adding a channel is a new adapter that
calls the same engine:
- **WhatsApp** — Meta Cloud API (or Twilio) webhook → `/api/whatsapp`. Needs a Meta
  Business account, a phone number, verification, and template messages for
  proactive sends; per-conversation cost. Highest reach in Chile.
- **Telegram** — Bot API webhook → `/api/telegram`. Free, instant; good as a pilot.

## Verification

- Chat answers Dupla questions correctly in Spanish (services, recruitment, AI
  courses) without hallucinating offerings.
- A lead conversation creates a `leads` row; a booking request creates a meeting
  lead; a hand-off flags the conversation and notifies the team.
- Streaming works in the widget; the API key never appears in client bundles.
- Token usage per conversation is logged; rate limiting blocks abuse.

## Open items to confirm before building

- **Booking:** simple "request a call" (we contact them) vs. real calendar
  scheduling (e.g. Google Calendar / Calendly integration)?
- **Knowledge source:** inline the current site copy now; revisit RAG only if the
  knowledge base grows large.
