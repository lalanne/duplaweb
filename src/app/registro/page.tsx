"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import { signup, type AuthState } from "../auth/actions";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "../auth/google-button";

type Role = "candidate" | "company";

export default function RegistroPage() {
  const [role, setRole] = useState<Role>("candidate");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signup,
    {},
  );

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/panel&role=${role}`,
      },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-[#16235C]">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="Dupla Consulting"
            width={1214}
            height={1366}
            priority
            className="h-20 w-auto"
          />
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-bold">Crear cuenta</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Selecciona tu tipo de cuenta para comenzar.
          </p>

          {/* Role toggle */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setRole("candidate")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                role === "candidate"
                  ? "bg-white text-[#1E63E9] shadow-sm"
                  : "text-slate-500 hover:text-[#16235C]"
              }`}
            >
              Soy candidato
            </button>
            <button
              type="button"
              onClick={() => setRole("company")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                role === "company"
                  ? "bg-white text-[#1E63E9] shadow-sm"
                  : "text-slate-500 hover:text-[#16235C]"
              }`}
            >
              Soy empresa
            </button>
          </div>

          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="role" value={role} />

            <Field
              label={
                role === "company" ? "Nombre de la empresa" : "Nombre completo"
              }
              name="display_name"
              type="text"
              placeholder={
                role === "company" ? "Mi Empresa SpA" : "Juan Pérez"
              }
              autoComplete={role === "company" ? "organization" : "name"}
            />
            <Field
              label="Correo electrónico"
              name="email"
              type="email"
              placeholder="tucorreo@ejemplo.cl"
              autoComplete="email"
            />
            <Field
              label="Contraseña"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />

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
              {pending ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />o
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleButton onClick={signInWithGoogle} label="Continuar con Google" />
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/ingresar" className="font-semibold text-[#1E63E9]">
            Ingresar
          </Link>
        </p>
      </div>
    </main>
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
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E63E9] focus:ring-2 focus:ring-[#1E63E9]/20"
      />
    </label>
  );
}
