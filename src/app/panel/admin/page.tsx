import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FactorScores } from "@/lib/tests/mini-ipip";
import {
  CandidateCard,
  CANDIDATE_FIELDS,
  type CandidateProfile,
} from "../candidate-card";

interface ResultRow extends FactorScores {
  user_id: string;
  created_at: string;
}

interface Company {
  id: string;
  display_name: string | null;
  email: string | null;
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

  // Admins can read every candidate, company and result (RLS grants it).
  const [{ data: candidates }, { data: companies }, { data: resultRows }] =
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
    ]);

  const cands = (candidates ?? []) as CandidateProfile[];
  const comps = (companies ?? []) as Company[];

  const latestResult = new Map<string, ResultRow>();
  for (const r of (resultRows ?? []) as ResultRow[]) {
    if (!latestResult.has(r.user_id)) latestResult.set(r.user_id, r);
  }

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

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Candidatos y empresas</h1>
        <p className="mt-2 text-slate-600">
          Revisa el directorio completo. Para asignar candidatos a una empresa,
          agrégalos a un{" "}
          <Link
            href="/panel/admin/procesos"
            className="font-medium text-[#1E63E9] hover:underline"
          >
            proceso
          </Link>
          .
        </p>

        <h2 className="mt-10 text-xl font-bold">Empresas ({comps.length})</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {comps.length === 0 && (
            <p className="text-sm text-slate-500">
              Aún no hay empresas registradas.
            </p>
          )}
          {comps.map((c) => (
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
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold">
          Candidatos ({cands.length})
        </h2>
        <div className="mt-4 space-y-5">
          {cands.length === 0 && (
            <p className="text-sm text-slate-500">
              Aún no hay candidatos registrados.
            </p>
          )}
          {cands.map((cand) => (
            <CandidateCard
              key={cand.id}
              profile={cand}
              result={latestResult.get(cand.id) ?? null}
              cvUrl={cand.cv_path ? cvUrlByPath.get(cand.cv_path) : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
