import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FactorScores } from "@/lib/tests/mini-ipip";
import { CandidateCard, type CandidateProfile } from "../candidate-card";

const CANDIDATE_FIELDS =
  "id, display_name, email, phone, contact_email, birth_date, location, headline, summary, linkedin_url, years_experience, education_level, desired_role, cv_path";

interface ResultRow extends FactorScores {
  user_id: string;
  created_at: string;
}

export default async function CandidatosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/ingresar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "company") {
    redirect("/panel");
  }

  // RLS only returns candidates an admin has matched to this company.
  const { data: candidates } = await supabase
    .from("profiles")
    .select(CANDIDATE_FIELDS)
    .eq("role", "candidate");
  const cands = (candidates ?? []) as CandidateProfile[];

  // Latest test result per candidate (also gated to matched candidates by RLS).
  const ids = cands.map((c) => c.id);
  const { data: resultRows } = ids.length
    ? await supabase
        .from("test_results")
        .select(
          "user_id, extraversion, agreeableness, conscientiousness, neuroticism, openness, created_at",
        )
        .in("user_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] };

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

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Candidatos</h1>
        <p className="mt-2 text-slate-600">
          {cands.length === 0
            ? "Aún no tienes candidatos asignados. El equipo de Dupla te asignará candidatos según tus necesidades."
            : `${cands.length} candidato(s) asignado(s) a tu empresa.`}
        </p>

        <div className="mt-8 space-y-5">
          {cands.map((c) => (
            <CandidateCard
              key={c.id}
              profile={c}
              result={latestResult.get(c.id) ?? null}
              cvUrl={c.cv_path ? cvUrlByPath.get(c.cv_path) : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
