import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayDimensions, type FactorScores } from "@/lib/tests/mini-ipip";

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

  // 1. All results, newest first.
  const { data: rows } = await supabase
    .from("test_results")
    .select(
      "user_id, extraversion, agreeableness, conscientiousness, neuroticism, openness, created_at",
    )
    .order("created_at", { ascending: false });

  // 2. Keep only the latest result per candidate.
  const seen = new Set<string>();
  const latest = ((rows ?? []) as ResultRow[]).filter((r) => {
    if (seen.has(r.user_id)) return false;
    seen.add(r.user_id);
    return true;
  });

  // 3. Look up the candidates' names + emails.
  const ids = latest.map((r) => r.user_id);
  const { data: profs } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", ids)
    : { data: [] };

  const profileById = new Map(
    (profs ?? []).map((p) => [p.id, p as { display_name: string | null; email: string | null }]),
  );

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Candidatos evaluados</h1>
        <p className="mt-2 text-slate-600">
          {latest.length === 0
            ? "Aún no hay candidatos con evaluaciones completadas."
            : `${latest.length} candidato(s) han completado su evaluación de personalidad.`}
        </p>

        <div className="mt-8 space-y-5">
          {latest.map((c) => {
            const p = profileById.get(c.user_id);
            const dims = displayDimensions(c);
            const fecha = new Date(c.created_at).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            return (
              <div
                key={c.user_id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {p?.display_name ?? "Candidato"}
                    </h2>
                    {p?.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="text-sm text-[#1E63E9] hover:underline"
                      >
                        {p.email}
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{fecha}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {dims.map((dim) => (
                    <div key={dim.label}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-slate-600">{dim.label}</span>
                        <span className="font-semibold text-[#1E63E9]">
                          {dim.value.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#1E63E9]"
                          style={{ width: `${dim.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
