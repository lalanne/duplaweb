import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROCESS_STAGES, stageLabel } from "@/lib/processes";
import { createProcess, updateProcessStage, deleteProcess } from "./actions";

interface Company {
  id: string;
  display_name: string | null;
  email: string | null;
}

interface ProcessRow {
  id: string;
  company_id: string;
  name: string;
  role_name: string;
  description: string | null;
  stage: string;
  created_at: string;
}

export default async function AdminProcesosPage() {
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
  if (me?.role !== "admin") {
    redirect("/panel");
  }

  const [{ data: companies }, { data: processes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email")
      .eq("role", "company"),
    supabase
      .from("processes")
      .select("id, company_id, name, role_name, description, stage, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const comps = (companies ?? []) as Company[];
  const procs = (processes ?? []) as ProcessRow[];
  const companyById = new Map(comps.map((c) => [c.id, c]));

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Procesos</h1>
        <p className="mt-2 text-slate-600">
          Crea procesos de búsqueda para tus empresas y mantén actualizada su
          etapa. Las empresas verán el avance en una línea de tiempo.
        </p>

        {/* Crear proceso */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Nuevo proceso</h2>
          {comps.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Necesitas al menos una empresa registrada para crear un proceso.
            </p>
          ) : (
            <form action={createProcess} className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Empresa / cliente
                </span>
                <select
                  name="company_id"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1E63E9]"
                >
                  <option value="" disabled>
                    Selecciona una empresa…
                  </option>
                  {comps.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.display_name ?? c.email ?? "Empresa"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Nombre del proceso
                  </span>
                  <input
                    name="name"
                    required
                    placeholder="Búsqueda Analista 2026"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E63E9]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Cargo buscado
                  </span>
                  <input
                    name="role_name"
                    required
                    placeholder="Analista de Marketing"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E63E9]"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Descripción del cargo
                </span>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Breve descripción del rol que la empresa busca cubrir."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E63E9]"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-[#1E63E9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a55c7]"
              >
                Crear proceso
              </button>
            </form>
          )}
        </div>

        {/* Lista de procesos */}
        <h2 className="mt-12 text-xl font-bold">
          Procesos activos ({procs.length})
        </h2>
        <div className="mt-4 space-y-5">
          {procs.length === 0 && (
            <p className="text-sm text-slate-500">Aún no has creado procesos.</p>
          )}
          {procs.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {companyById.get(p.company_id)?.display_name ?? "Empresa"}
                  </p>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="text-sm text-slate-600">{p.role_name}</p>
                </div>
                <span className="rounded-full bg-[#1E63E9]/10 px-3 py-1 text-xs font-semibold text-[#1E63E9]">
                  {stageLabel(p.stage)}
                </span>
              </div>
              {p.description && (
                <p className="mt-2 text-sm text-slate-600">{p.description}</p>
              )}

              <form
                action={updateProcessStage}
                className="mt-4 flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="id" value={p.id} />
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Cambiar etapa
                  </span>
                  <select
                    name="stage"
                    defaultValue={p.stage}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#1E63E9]"
                  >
                    {PROCESS_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  name="note"
                  placeholder="Nota (opcional)"
                  className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-[#1E63E9]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#1E63E9] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1a55c7]"
                >
                  Actualizar
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <Link
                  href={`/panel/procesos/${p.id}`}
                  className="font-medium text-[#1E63E9] hover:underline"
                >
                  Ver línea de tiempo
                </Link>
                <form action={deleteProcess}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="font-medium text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
