"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { login, type AuthState } from "../auth/actions";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "../auth/google-button";

export default function IngresarPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    {},
  );

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/panel`,
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
          <h1 className="text-center text-2xl font-bold">Ingresar</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Accede a tu cuenta de Dupla Consulting.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Correo electrónico
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tucorreo@ejemplo.cl"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E63E9] focus:ring-2 focus:ring-[#1E63E9]/20"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Contraseña
              </span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Tu contraseña"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E63E9] focus:ring-2 focus:ring-[#1E63E9]/20"
              />
            </label>

            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[#1E63E9] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7] disabled:opacity-60"
            >
              {pending ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />o
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleButton onClick={signInWithGoogle} label="Continuar con Google" />
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-[#1E63E9]">
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}
