# Testing plan

Automated tests to lock in current behaviour and catch regressions as the app
evolves. Status: **plan only — not yet implemented.**

## Guiding principle

Almost every feature in this app is a **data-visibility rule** enforced by
Postgres RLS (`supabase/schema.sql`):

- A company sees a candidate **only** through a process the candidate belongs
  to, and only when their status is `en_evaluacion` or `presentado` (never
  `descartado`).
- A candidate sees only their own profile / results / CV.
- An admin sees everything.
- CV (storage) access follows the same gate.

So a regression here is not cosmetic — it's a **data leak between companies**.
The suite is therefore weighted toward proving these invariants. UI tests stay
thin: copy and layouts will change after product feedback, so we do **not** pin
tests to Spanish text or exact markup.

## Stack

- **Vitest** — unit tests for pure logic.
- **Supabase CLI (local, Docker)** — real Postgres + Auth + Storage as the test
  backend, so RLS is tested for real instead of mocked. Resettable and free.
- **Playwright** — end-to-end journeys against `next start` + local Supabase.

> Prerequisite: Docker available locally and in CI. Alternative if we want to
> avoid Docker: a dedicated cloud "staging" Supabase project (simpler infra,
> slower, harder to reset).

## Phases

Do **1 → 2 → 3 first** (durable core that survives UI changes). Hold **4 → 5**
until the UI settles after CEO feedback.

### 1. Migrations + seed (foundation)

- Convert `supabase/schema.sql` into proper migrations under
  `supabase/migrations/` so `supabase db reset` rebuilds the DB locally for
  tests — and so we stop pasting SQL into the dashboard by hand in prod.
  (Also removes the enum-ordering and orphaned-`auth.users` foot-guns.)
- Add a seed script creating known fixtures:
  - one candidate (with a completed `test_results` row + a CV in storage),
  - two companies (A and B),
  - one admin,
  - one process for company A, with the candidate attached.

### 2. Unit tests (Vitest)

Pure functions, fast and stable:

- `scoreMiniIpip`, `displayDimensions` — `src/lib/tests/mini-ipip.ts`
- `stageIndex`, `stageLabel` — `src/lib/processes.ts`
- `ageFrom` — `src/app/panel/candidate-card.tsx`

### 3. RLS / security suite (the core — must never go red)

Using `supabase-js` authenticated as each seeded role, assert:

- Company A **cannot** read company B's candidates (profiles, results, CV).
- A company sees a candidate with status `en_evaluacion` and `presentado`, but
  **not** `descartado`.
- A candidate cannot read another candidate's data.
- An admin can read all candidates, companies, processes, results.
- CV signed-URL access matches the same rules (admin + matched company only).
- `is_candidate_visible()` returns the expected boolean per role/relationship.

### 4. E2E smoke (Playwright) — after UI settles

One happy path per role, asserting on stable selectors (roles/test-ids), not
copy:

- **Candidate:** signup → fill profile (`/panel/perfil`) → take test
  (`/panel/test`) → see result.
- **Admin:** create process (`/panel/admin/procesos`) → open process → attach
  candidate → advance stage → mark `presentado`.
- **Company:** view processes (`/panel/procesos`) → open timeline → confirm
  evaluated/presented lists → open candidate detail (`/panel/candidatos/[id]`).

### 5. CI — after phase 4

GitHub Actions on PRs to `main`: start local Supabase, apply migrations + seed,
run unit + RLS + E2E.

## Explicitly out of scope (for now)

Snapshot/visual tests, exact-text assertions, and exhaustive form-validation
cases — all likely to churn after product feedback. Add once the UI is stable.

## Suggested scripts (to add in `package.json` when implementing)

- `test` — Vitest unit + RLS suites
- `test:e2e` — Playwright
- `db:reset` — `supabase db reset` (apply migrations + seed)
