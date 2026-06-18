import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayDimensions, type FactorScores } from "@/lib/tests/mini-ipip";

interface ResultRow extends FactorScores {
  user_id: string;
  created_at: string;
}

interface CandidateProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  contact_email: string | null;
  birth_date: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  linkedin_url: string | null;
  years_experience: number | null;
  education_level: string | null;
  desired_role: string | null;
  cv_path: string | null;
}

// Whole years between a birth date and today.
function ageFrom(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
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

  // 3. Look up the candidates' profile details.
  const ids = latest.map((r) => r.user_id);
  const { data: profs } = ids.length
    ? await supabase
        .from("profiles")
        .select(
          "id, display_name, email, phone, contact_email, birth_date, location, headline, summary, linkedin_url, years_experience, education_level, desired_role, cv_path",
        )
        .in("id", ids)
    : { data: [] };

  const profileById = new Map(
    (profs ?? []).map((p) => [p.id, p as CandidateProfile]),
  );

  // 4. Short-lived links to each candidate's CV, if uploaded.
  const cvPaths = (profs ?? [])
    .map((p) => (p as CandidateProfile).cv_path)
    .filter((path): path is string => Boolean(path));
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
                    {p?.headline && (
                      <p className="text-sm text-slate-600">{p.headline}</p>
                    )}
                    {(() => {
                      const mail = p?.contact_email ?? p?.email;
                      return mail ? (
                        <a
                          href={`mailto:${mail}`}
                          className="text-sm text-[#1E63E9] hover:underline"
                        >
                          {mail}
                        </a>
                      ) : null;
                    })()}
                  </div>
                  <span className="text-xs text-slate-400">{fecha}</span>
                </div>

                {p && (
                  <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {p.phone && <Detail label="Teléfono">{p.phone}</Detail>}
                    {p.location && (
                      <Detail label="Ubicación">{p.location}</Detail>
                    )}
                    {p.birth_date && (
                      <Detail label="Edad">{ageFrom(p.birth_date)} años</Detail>
                    )}
                    {p.years_experience != null && (
                      <Detail label="Experiencia">
                        {p.years_experience} año(s)
                      </Detail>
                    )}
                    {p.education_level && (
                      <Detail label="Educación">{p.education_level}</Detail>
                    )}
                    {p.desired_role && (
                      <Detail label="Cargo deseado">{p.desired_role}</Detail>
                    )}
                  </dl>
                )}

                {p?.summary && (
                  <p className="mt-3 text-sm text-slate-600">{p.summary}</p>
                )}

                {(p?.linkedin_url ||
                  (p?.cv_path && cvUrlByPath.has(p.cv_path))) && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {p?.linkedin_url && (
                      <a
                        href={p.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#1E63E9] hover:underline"
                      >
                        LinkedIn / portafolio ↗
                      </a>
                    )}
                    {p?.cv_path && cvUrlByPath.has(p.cv_path) && (
                      <a
                        href={cvUrlByPath.get(p.cv_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-[#1E63E9] px-4 py-1.5 text-sm font-semibold text-[#1E63E9] transition-colors hover:bg-[#1E63E9]/5"
                      >
                        Ver CV
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
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

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-2 border-b border-slate-100 py-1">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-[#16235C]">{children}</dd>
    </div>
  );
}
