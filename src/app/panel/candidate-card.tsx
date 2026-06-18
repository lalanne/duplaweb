import { displayDimensions, type FactorScores } from "@/lib/tests/mini-ipip";

// Column list for selecting a full candidate profile (shared across pages).
export const CANDIDATE_FIELDS =
  "id, display_name, email, phone, contact_email, birth_date, location, headline, summary, linkedin_url, years_experience, education_level, desired_role, cv_path";

export interface CandidateProfile {
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
export function ageFrom(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function CandidateCard({
  profile: p,
  result,
  cvUrl,
  footer,
}: {
  profile: CandidateProfile;
  result?: FactorScores | null;
  cvUrl?: string | null;
  footer?: React.ReactNode;
}) {
  const mail = p.contact_email ?? p.email;
  const dims = result ? displayDimensions(result) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">{p.display_name ?? "Candidato"}</h2>
        {p.headline && <p className="text-sm text-slate-600">{p.headline}</p>}
        {mail && (
          <a
            href={`mailto:${mail}`}
            className="text-sm text-[#1E63E9] hover:underline"
          >
            {mail}
          </a>
        )}
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {p.phone && <Detail label="Teléfono">{p.phone}</Detail>}
        {p.location && <Detail label="Ubicación">{p.location}</Detail>}
        {p.birth_date && (
          <Detail label="Edad">{ageFrom(p.birth_date)} años</Detail>
        )}
        {p.years_experience != null && (
          <Detail label="Experiencia">{p.years_experience} año(s)</Detail>
        )}
        {p.education_level && (
          <Detail label="Educación">{p.education_level}</Detail>
        )}
        {p.desired_role && (
          <Detail label="Cargo deseado">{p.desired_role}</Detail>
        )}
      </dl>

      {p.summary && <p className="mt-3 text-sm text-slate-600">{p.summary}</p>}

      {(p.linkedin_url || cvUrl) && (
        <div className="mt-3 flex flex-wrap gap-3">
          {p.linkedin_url && (
            <a
              href={p.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#1E63E9] hover:underline"
            >
              Ver perfil de LinkedIn ↗
            </a>
          )}
          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#1E63E9] px-4 py-1.5 text-sm font-semibold text-[#1E63E9] transition-colors hover:bg-[#1E63E9]/5"
            >
              Ver CV
            </a>
          )}
        </div>
      )}

      {dims ? (
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
      ) : (
        <p className="mt-4 text-xs text-slate-400">
          Aún no ha completado la evaluación de personalidad.
        </p>
      )}

      {footer}
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
