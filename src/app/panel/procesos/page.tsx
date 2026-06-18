import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stageLabel } from "@/lib/processes";

interface ProcessRow {
  id: string;
  name: string;
  role_name: string;
  stage: string;
  updated_at: string;
}

export default async function ProcesosPage() {
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
  if (profile?.role === "admin") {
    redirect("/panel/admin/procesos");
  }
  if (profile?.role !== "company") {
    redirect("/panel");
  }

  // RLS only returns this company's own processes.
  const { data: processes } = await supabase
    .from("processes")
    .select("id, name, role_name, stage, updated_at")
    .order("created_at", { ascending: false });
  const procs = (processes ?? []) as ProcessRow[];

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href="/panel" className="text-sm font-medium text-[#1E63E9]">
          ← Volver al panel
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Mis procesos</h1>
        <p className="mt-2 text-slate-600">
          {procs.length === 0
            ? "Aún no tienes procesos de búsqueda. El equipo de Dupla los creará cuando inicies un proceso."
            : "Estos son los procesos de búsqueda que Dupla está gestionando para tu empresa. Haz clic en uno para ver su avance."}
        </p>

        <div className="mt-8 space-y-4">
          {procs.map((p) => (
            <Link
              key={p.id}
              href={`/panel/procesos/${p.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-[#1E63E9]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="text-sm text-slate-600">{p.role_name}</p>
                </div>
                <span className="rounded-full bg-[#1E63E9]/10 px-3 py-1 text-xs font-semibold text-[#1E63E9]">
                  {stageLabel(p.stage)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
