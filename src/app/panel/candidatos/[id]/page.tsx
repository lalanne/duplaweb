import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FactorScores } from "@/lib/tests/mini-ipip";
import {
  CandidateCard,
  CANDIDATE_FIELDS,
  type CandidateProfile,
} from "../../candidate-card";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  const isAdmin = me?.role === "admin";
  const backHref = isAdmin ? "/panel/admin" : "/panel/procesos";

  // RLS only returns the profile to an admin or to a company the candidate is
  // visible to (i.e. attached to one of that company's processes).
  const { data: profile } = await supabase
    .from("profiles")
    .select(`${CANDIDATE_FIELDS}, role`)
    .eq("id", id)
    .single();
  if (!profile || profile.role !== "candidate") {
    redirect(backHref);
  }

  const { data: resultRows } = await supabase
    .from("test_results")
    .select(
      "extraversion, agreeableness, conscientiousness, neuroticism, openness",
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(1);
  const result = (resultRows?.[0] as FactorScores | undefined) ?? null;

  let cvUrl: string | null = null;
  if (profile.cv_path) {
    const { data } = await supabase.storage
      .from("cvs")
      .createSignedUrl(profile.cv_path, 300);
    cvUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <Link href={backHref} className="text-sm font-medium text-[#1E63E9]">
          ← Volver
        </Link>
        <h1 className="mb-6 mt-4 text-2xl font-bold">Ficha del candidato</h1>
        <CandidateCard
          profile={profile as CandidateProfile}
          result={result}
          cvUrl={cvUrl}
        />
      </div>
    </div>
  );
}
