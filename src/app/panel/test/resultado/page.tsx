import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayDimensions, type FactorScores } from "@/lib/tests/mini-ipip";

export default async function ResultadoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/ingresar");
  }

  const { data: result } = await supabase
    .from("test_results")
    .select("extraversion, agreeableness, conscientiousness, neuroticism, openness, created_at")
    .eq("user_id", user.id)
    .eq("test_key", "mini_ipip")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12 text-[#16235C]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-slate-600">Aún no has realizado la evaluación.</p>
          <Link
            href="/panel/test"
            className="mt-6 inline-block rounded-full bg-[#1E63E9] px-6 py-3 text-sm font-semibold text-white"
          >
            Realizar evaluación
          </Link>
        </div>
      </div>
    );
  }

  const dimensions = displayDimensions(result as FactorScores);
  const fecha = new Date(result.created_at).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Tus resultados</h1>
        <p className="mt-2 text-slate-600">
          Evaluación de personalidad (Big Five) · {fecha}
        </p>

        <div className="mt-10 space-y-6">
          {dimensions.map((dim) => (
            <div key={dim.label}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{dim.label}</h2>
                <span className="text-sm font-semibold text-[#1E63E9]">
                  {dim.value.toFixed(1)} / 5
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#1E63E9]"
                  style={{ width: `${dim.percent}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">{dim.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <p>
            Este es un cuestionario de autoevaluación basado en el modelo de los
            Cinco Grandes (Big Five). Ofrece una referencia sobre tus rasgos de
            personalidad y no constituye un diagnóstico clínico.
          </p>
        </div>

        <Link
          href="/panel/test"
          className="mt-8 inline-block rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white"
        >
          Volver a realizar la evaluación
        </Link>
      </div>
    </div>
  );
}
