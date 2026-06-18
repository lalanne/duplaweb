"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitMiniIpip, type TestState } from "./actions";
import { MINI_IPIP_ITEMS, LIKERT_OPTIONS } from "@/lib/tests/mini-ipip";

export default function TestPage() {
  const [state, formAction, pending] = useActionState<TestState, FormData>(
    submitMiniIpip,
    {},
  );

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          Evaluación de Personalidad (Big Five)
        </h1>
        <p className="mt-3 text-slate-600">
          Indica qué tan de acuerdo estás con cada afirmación. No hay respuestas
          correctas ni incorrectas; responde con sinceridad pensando en cómo
          eres habitualmente. Son 20 preguntas y toma unos 4 minutos.
        </p>

        <form action={formAction} className="mt-10 space-y-5">
          {MINI_IPIP_ITEMS.map((item, index) => (
            <fieldset
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <legend className="sr-only">{item.text}</legend>
              <p className="font-medium">
                {index + 1}. {item.text}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {LIKERT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition-colors hover:border-[#1E63E9] has-[:checked]:border-[#1E63E9] has-[:checked]:bg-[#1E63E9]/5 has-[:checked]:font-semibold has-[:checked]:text-[#1E63E9] sm:flex-col sm:items-center sm:text-center"
                  >
                    <input
                      type="radio"
                      name={item.id}
                      value={opt.value}
                      required
                      className="accent-[#1E63E9] sm:mb-1"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

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
            {pending ? "Calculando resultados…" : "Ver mis resultados"}
          </button>
        </form>
      </div>
    </div>
  );
}
