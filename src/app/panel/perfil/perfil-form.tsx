"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

type Profile = {
  display_name?: string | null;
  phone?: string | null;
  contact_email?: string | null;
  birth_date?: string | null;
  location?: string | null;
  headline?: string | null;
  summary?: string | null;
  linkedin_url?: string | null;
  years_experience?: number | null;
  education_level?: string | null;
  desired_role?: string | null;
  cv_path?: string | null;
};

const EDUCATION_LEVELS = [
  "Educación media",
  "Técnico profesional",
  "Universitaria (pregrado)",
  "Postgrado / Magíster",
  "Doctorado",
];

export function PerfilForm({
  profile,
  loginEmail,
  cvUrl,
}: {
  profile: Profile;
  loginEmail: string;
  cvUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {},
  );

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Image
            src="/logo.png"
            alt="Dupla Consulting"
            width={1214}
            height={1366}
            priority
            className="h-12 w-auto"
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Mi perfil</h1>
        <p className="mt-2 text-slate-600">
          Completa tu información. Las empresas la verán junto a tus resultados
          para decidir si les interesa tu perfil.
        </p>

        <form action={formAction} className="mt-8 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Datos de contacto</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nombre completo"
                name="display_name"
                defaultValue={profile.display_name ?? ""}
                placeholder="Juan Pérez"
                autoComplete="name"
                required
              />
              <Field
                label="Teléfono de contacto"
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                placeholder="+56 9 1234 5678"
                autoComplete="tel"
              />
              <Field
                label="Correo de contacto"
                name="contact_email"
                type="email"
                defaultValue={profile.contact_email ?? loginEmail}
                placeholder="tucorreo@ejemplo.cl"
                autoComplete="email"
              />
              <Field
                label="Fecha de nacimiento"
                name="birth_date"
                type="date"
                defaultValue={profile.birth_date ?? ""}
              />
              <Field
                label="Ubicación (comuna / región)"
                name="location"
                defaultValue={profile.location ?? ""}
                placeholder="Providencia, RM"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Perfil profesional</h2>
            <div className="mt-4 space-y-4">
              <Field
                label="Titular"
                name="headline"
                defaultValue={profile.headline ?? ""}
                placeholder="Ingeniero Comercial"
              />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Sobre mí
                </span>
                <textarea
                  name="summary"
                  defaultValue={profile.summary ?? ""}
                  rows={4}
                  placeholder="Cuéntale a las empresas sobre tu experiencia, fortalezas e intereses."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E63E9] focus:ring-2 focus:ring-[#1E63E9]/20"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Años de experiencia"
                  name="years_experience"
                  type="number"
                  min={0}
                  max={80}
                  defaultValue={profile.years_experience ?? ""}
                  placeholder="3"
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Nivel educacional
                  </span>
                  <select
                    name="education_level"
                    defaultValue={profile.education_level ?? ""}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1E63E9] focus:ring-2 focus:ring-[#1E63E9]/20"
                  >
                    <option value="">Selecciona…</option>
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Cargo deseado"
                  name="desired_role"
                  defaultValue={profile.desired_role ?? ""}
                  placeholder="Analista de Marketing"
                />
                <Field
                  label="LinkedIn / portafolio"
                  name="linkedin_url"
                  type="url"
                  defaultValue={profile.linkedin_url ?? ""}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Currículum (CV)</h2>
            {cvUrl && (
              <p className="mt-2 text-sm text-slate-600">
                CV actual:{" "}
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#1E63E9] hover:underline"
                >
                  ver archivo
                </a>
              </p>
            )}
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                {cvUrl ? "Reemplazar CV" : "Subir CV"} (PDF, DOC o DOCX, máx. 5
                MB)
              </span>
              <input
                type="file"
                name="cv"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#1E63E9]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1E63E9] hover:file:bg-[#1E63E9]/20"
              />
            </label>
          </section>

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          {state.message && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[#1E63E9] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7] disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar perfil"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E63E9] focus:ring-2 focus:ring-[#1E63E9]/20"
      />
    </label>
  );
}
