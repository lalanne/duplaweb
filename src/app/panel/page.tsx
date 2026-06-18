import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../auth/actions";

export default async function PanelPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ingresar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const isCompany = profile?.role === "company";
  const isAdmin = profile?.role === "admin";
  const isCandidate = !isCompany && !isAdmin;
  const name = profile?.display_name ?? user.email;

  let hasResult = false;
  if (isCandidate) {
    const { count } = await supabase
      .from("test_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasResult = (count ?? 0) > 0;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Image
            src="/logo.png"
            alt="Dupla Consulting"
            width={1214}
            height={1366}
            priority
            className="h-12 w-auto"
          />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <span className="inline-block rounded-full bg-[#1E63E9]/10 px-3 py-1 text-xs font-semibold text-[#1E63E9]">
          {isAdmin ? "Administrador" : isCompany ? "Empresa" : "Candidato"}
        </span>
        <h1 className="mt-4 text-3xl font-bold">Hola, {name} 👋</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          {isAdmin
            ? "Gestiona candidatos y empresas, y decide qué candidatos hacer visibles para cada empresa."
            : isCompany
              ? "Desde aquí podrás revisar los candidatos que el equipo de Dupla te asigne. Estamos preparando más funciones."
              : "Desde aquí podrás completar tus evaluaciones de empleabilidad y postular a oportunidades. Estamos preparando estas funciones."}
        </p>

        {isAdmin ? (
          <div className="mt-10 grid gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Matchmaking</h2>
              <p className="mt-1 text-sm text-slate-600">
                Revisa todos los candidatos y empresas, y asigna candidatos a
                las empresas para hacerlos visibles.
              </p>
              <Link
                href="/panel/admin"
                className="mt-4 inline-block rounded-full bg-[#1E63E9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7]"
              >
                Abrir matchmaking
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Procesos</h2>
              <p className="mt-1 text-sm text-slate-600">
                Crea procesos de búsqueda para tus empresas y actualiza su etapa
                para que vean el avance.
              </p>
              <Link
                href="/panel/admin/procesos"
                className="mt-4 inline-block rounded-full bg-[#1E63E9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7]"
              >
                Gestionar procesos
              </Link>
            </div>
          </div>
        ) : isCompany ? (
          <div className="mt-10 grid gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Candidatos asignados</h2>
              <p className="mt-1 text-sm text-slate-600">
                Revisa los candidatos que el equipo de Dupla ha asignado a tu
                empresa y compara sus resultados.
              </p>
              <Link
                href="/panel/candidatos"
                className="mt-4 inline-block rounded-full bg-[#1E63E9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7]"
              >
                Ver candidatos
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Mis procesos</h2>
              <p className="mt-1 text-sm text-slate-600">
                Sigue el avance de los procesos de búsqueda que Dupla gestiona
                para tu empresa.
              </p>
              <Link
                href="/panel/procesos"
                className="mt-4 inline-block rounded-full bg-[#1E63E9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7]"
              >
                Ver mis procesos
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Mi perfil</h2>
            <p className="mt-1 text-sm text-slate-600">
              Completa tus datos de contacto, experiencia y sube tu CV. Las
              empresas verán esta información junto a tus resultados.
            </p>
            <Link
              href="/panel/perfil"
              className="mt-4 inline-block rounded-full bg-[#1E63E9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7]"
            >
              Editar mi perfil
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">
              Evaluación de Personalidad (Big Five)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Un cuestionario breve (20 preguntas, ~4 min) que mide tus cinco
              grandes rasgos de personalidad, incluida la Responsabilidad, el
              rasgo más asociado al desempeño laboral.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/panel/test"
                className="rounded-full bg-[#1E63E9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a55c7]"
              >
                {hasResult ? "Volver a realizar" : "Comenzar evaluación"}
              </Link>
              {hasResult && (
                <Link
                  href="/panel/test/resultado"
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                >
                  Ver mis resultados
                </Link>
              )}
            </div>
          </div>
          </div>
        )}
      </main>
    </div>
  );
}
