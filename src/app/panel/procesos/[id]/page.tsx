import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROCESS_STAGES, stageIndex } from "@/lib/processes";

interface ProcessRow {
  id: string;
  company_id: string;
  name: string;
  role_name: string;
  description: string | null;
  stage: string;
  created_at: string;
}

interface EventRow {
  stage: string;
  note: string | null;
  created_at: string;
}

function fmt(date: string): string {
  return new Date(date).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProcesoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  const isAdmin = me?.role === "admin";

  // RLS ensures only the owning company or an admin can read this process.
  const { data: process } = await supabase
    .from("processes")
    .select("id, company_id, name, role_name, description, stage, created_at")
    .eq("id", id)
    .single();
  if (!process) {
    redirect(isAdmin ? "/panel/admin/procesos" : "/panel/procesos");
  }
  const proc = process as ProcessRow;

  const { data: eventRows } = await supabase
    .from("process_events")
    .select("stage, note, created_at")
    .eq("process_id", id)
    .order("created_at", { ascending: true });
  const events = (eventRows ?? []) as EventRow[];

  // Latest event per stage (for timestamp + note on the timeline).
  const eventByStage = new Map<string, EventRow>();
  for (const e of events) eventByStage.set(e.stage, e);

  const currentIndex = stageIndex(proc.stage);
  const backHref = isAdmin ? "/panel/admin/procesos" : "/panel/procesos";

  return (
    <div className="min-h-screen bg-slate-50 text-[#16235C]">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <Link href={backHref} className="text-sm font-medium text-[#1E63E9]">
          ← Volver a procesos
        </Link>

        <h1 className="mt-4 text-3xl font-bold">{proc.name}</h1>
        <p className="mt-1 text-slate-600">
          Cargo buscado: <span className="font-medium">{proc.role_name}</span>
        </p>
        {proc.description && (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            {proc.description}
          </p>
        )}

        <h2 className="mt-10 text-lg font-semibold">Estado del proceso</h2>
        <ol className="mt-6">
          {PROCESS_STAGES.map((stage, index) => {
            const done = index < currentIndex;
            const current = index === currentIndex;
            const event = eventByStage.get(stage.key);
            const isLast = index === PROCESS_STAGES.length - 1;
            return (
              <li key={stage.key} className="flex gap-4">
                {/* Dot + connector */}
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs ${
                      done
                        ? "border-[#1E63E9] bg-[#1E63E9] text-white"
                        : current
                          ? "border-[#1E63E9] bg-white text-[#1E63E9]"
                          : "border-slate-300 bg-white text-slate-300"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  {!isLast && (
                    <span
                      className={`w-0.5 flex-1 ${
                        index < currentIndex ? "bg-[#1E63E9]" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
                {/* Content */}
                <div className={`pb-8 ${current ? "" : "opacity-90"}`}>
                  <p
                    className={`font-semibold ${
                      done || current ? "text-[#16235C]" : "text-slate-400"
                    }`}
                  >
                    {stage.label}
                    {current && (
                      <span className="ml-2 rounded-full bg-[#1E63E9]/10 px-2 py-0.5 text-xs font-semibold text-[#1E63E9]">
                        Etapa actual
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{stage.description}</p>
                  {event && (
                    <p className="mt-1 text-xs text-slate-400">
                      {fmt(event.created_at)}
                      {event.note ? ` · ${event.note}` : ""}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
