import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FactorScores } from "@/lib/tests/mini-ipip";
import { CandidateCard, type CandidateProfile } from "../candidate-card";
import { createMatch, removeMatch } from "./actions";

const CANDIDATE_FIELDS =
  "id, display_name, email, phone, contact_email, birth_date, location, headline, summary, linkedin_url, years_experience, education_level, desired_role, cv_path";

interface ResultRow extends FactorScores {
  user_id: string;
  created_at: string;
}

interface Company {
  id: string;
  display_name: string | null;
  email: string | null;
}

interface MatchRow {
  id: string;
  candidate_id: string;
  company_id: string;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/ingresar");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    redirect("/panel");
  }

  // Everything an admin can see (RLS grants admins full read access).
  const [{ data: candidates }, { data: companies }, { data: resultRows }, { data: matchRows }] =
    await Promise.all([
      supabase.from("profiles").select(CANDIDATE_FIELDS).eq("role", "candidate"),
      supabase
        .from("profiles")
        .select("id, display_name, email")
        .eq("role", "company"),
      supabase
        .from("test_results")
        .select(
          "user_id, extraversion, agreeableness, conscientiousness, neuroticism, openness, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("matches").select("id, candidate_id, company_id"),
    ]);

  const cands = (candidates ?? []) as CandidateProfile[];
  const comps = (companies ?? []) as Company[];
  const matches = (matchRows ?? []) as MatchRow[];

  // Latest result per candidate.
  const latestResult = new Map<string, ResultRow>();
  for (const r of (resultRows ?? []) as ResultRow[]) {
    if (!latestResult.has(r.user_id)) latestResult.set(r.user_id, r);
  }

  // Signed CV links.
  const cvPaths = cands
    .map((c) => c.cv_path)
    .filter((p): p is string => Boolean(p));
  const cvUrlByPath = new Map<string, string>();
  if (cvPaths.length) {
    const { data: signed } = await supabase.storage
      .from("cvs")
      .createSignedUrls(cvPaths, 300);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) cvUrlByPath.set(s.path, s.signedUrl);
    }
  }

  const companyById = new Map(comps.map((c) => [c.id, c]));
  const matchesByCandidate = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const list = matchesByCandidate.get(m.candidate_id) ?? [];
    list.push(m);
    matchesByCandidate.set(m.candidate_id, list);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Matchmaking</h1>
        <p className="mt-2 text-slate-600">
          Revisa candidatos y empresas, y asigna a cada empresa los candidatos
          que quieras hacer visibles para ella.
        </p>

        {/* Empresas */}
        <h2 className="mt-10 text-xl font-bold">Empresas ({comps.length})</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {comps.length === 0 && (
            <p className="text-sm text-slate-500">Aún no hay empresas registradas.</p>
          )}
          {comps.map((c) => {
            const count = matches.filter((m) => m.company_id === c.id).length;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <p className="font-semibold">{c.display_name ?? "Empresa"}</p>
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-sm text-[#1E63E9] hover:underline"
                  >
                    {c.email}
                  </a>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {count} candidato(s) asignado(s)
                </p>
              </div>
            );
          })}
        </div>

        {/* Candidatos */}
        <h2 className="mt-12 text-xl font-bold">
          Candidatos ({cands.length})
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Asigna cada candidato a una o más empresas.
        </p>
        <div className="mt-4 space-y-5">
          {cands.length === 0 && (
            <p className="text-sm text-slate-500">Aún no hay candidatos registrados.</p>
          )}
          {cands.map((cand) => {
            const candMatches = matchesByCandidate.get(cand.id) ?? [];
            const matchedCompanyIds = new Set(
              candMatches.map((m) => m.company_id),
            );
            const available = comps.filter((c) => !matchedCompanyIds.has(c.id));
            return (
              <CandidateCard
                key={cand.id}
                profile={cand}
                result={latestResult.get(cand.id) ?? null}
                cvUrl={cand.cv_path ? cvUrlByPath.get(cand.cv_path) : null}
                footer={
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-sm font-semibold">Empresas asignadas</p>
                    {candMatches.length === 0 ? (
                      <p className="mt-1 text-sm text-slate-500">
                        Sin asignaciones todavía.
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {candMatches.map((m) => (
                          <li key={m.id}>
                            <form action={removeMatch}>
                              <input type="hidden" name="id" value={m.id} />
                              <button
                                type="submit"
                                title="Quitar asignación"
                                className="flex items-center gap-1 rounded-full bg-[#1E63E9]/10 px-3 py-1 text-xs font-medium text-[#1E63E9] hover:bg-[#1E63E9]/20"
                              >
                                {companyById.get(m.company_id)?.display_name ??
                                  "Empresa"}
                                <span aria-hidden>✕</span>
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}

                    {available.length > 0 && (
                      <form
                        action={createMatch}
                        className="mt-3 flex flex-wrap items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="candidate_id"
                          value={cand.id}
                        />
                        <select
                          name="company_id"
                          required
                          defaultValue=""
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#1E63E9]"
                        >
                          <option value="" disabled>
                            Asignar a empresa…
                          </option>
                          {available.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.display_name ?? c.email ?? "Empresa"}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-full bg-[#1E63E9] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1a55c7]"
                        >
                          Asignar
                        </button>
                      </form>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
