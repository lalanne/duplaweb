import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROCESS_STAGES, stageIndex } from "@/lib/processes";
import {
  attachCandidate,
  setCandidateStatus,
  removeProcessCandidate,
} from "../../admin/procesos/actions";

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

interface ProcessCandidate {
  id: string;
  candidate_id: string;
  status: string;
}

interface MiniProfile {
  id: string;
  display_name: string | null;
  headline: string | null;
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

  // All events per stage, oldest first, so the full note history stays visible.
  const eventsByStage = new Map<string, EventRow[]>();
  for (const e of events) {
    const list = eventsByStage.get(e.stage) ?? [];
    list.push(e);
    eventsByStage.set(e.stage, list);
  }

  // Candidates in this process. RLS hides "descartado" from companies.
  const { data: pcRows } = await supabase
    .from("process_candidates")
    .select("id, candidate_id, status")
    .eq("process_id", id);
  const pcs = (pcRows ?? []) as ProcessCandidate[];

  const candidateIds = pcs.map((p) => p.candidate_id);
  const { data: candProfiles } = candidateIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, headline")
        .in("id", candidateIds)
    : { data: [] };
  const profileById = new Map(
    (candProfiles ?? []).map((p) => [p.id, p as MiniProfile]),
  );

  const enEvaluacion = pcs.filter((p) => p.status === "en_evaluacion");
  const presentados = pcs.filter((p) => p.status === "presentado");

  // Admin-only: candidates with a completed test that aren't attached yet.
  let attachable: { id: string; display_name: string | null }[] = [];
  let descartados: ProcessCandidate[] = [];
  if (isAdmin) {
    descartados = pcs.filter((p) => p.status === "descartado");
    const [{ data: allCands }, { data: tested }] = await Promise.all([
      supabase.from("profiles").select("id, display_name").eq("role", "candidate"),
      supabase.from("test_results").select("user_id"),
    ]);
    const withTest = new Set((tested ?? []).map((t) => t.user_id));
    const attached = new Set(pcs.map((p) => p.candidate_id));
    attachable = (allCands ?? []).filter(
      (c) => withTest.has(c.id) && !attached.has(c.id),
    );
  }

  const currentIndex = stageIndex(proc.stage);
  const backHref = isAdmin ? "/panel/admin/procesos" : "/panel/procesos";

  // Everyone who was evaluated stays in the evaluation stage, so the company
  // sees the full shortlist and which of them advanced to "Presentado".
  const evaluados = [...enEvaluacion, ...presentados];

  // Clickable candidate chips for the timeline. When `markPresented` is set,
  // candidates already presented get a tag so the narrowing is clear.
  const chips = (list: ProcessCandidate[], markPresented = false) =>
    list.length === 0 ? (
      <p className="mt-2 text-xs text-slate-400">Sin candidatos por ahora.</p>
    ) : (
      <ul className="mt-2 flex flex-wrap gap-2">
        {list.map((pc) => {
          const prof = profileById.get(pc.candidate_id);
          return (
            <li key={pc.id}>
              <Link
                href={`/panel/candidatos/${pc.candidate_id}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-sm font-medium text-[#1E63E9] transition-colors hover:border-[#1E63E9] hover:bg-[#1E63E9]/5"
              >
                {prof?.display_name ?? "Candidato"}
                {prof?.headline ? (
                  <span className="text-xs text-slate-400">· {prof.headline}</span>
                ) : null}
                {markPresented && pc.status === "presentado" ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Presentado
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    );

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
            const stageEvents = eventsByStage.get(stage.key) ?? [];
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
                <div className={`w-full pb-8 ${current ? "" : "opacity-90"}`}>
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
                  {stageEvents.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {stageEvents.map((event, i) => (
                        <li key={i} className="text-xs text-slate-400">
                          {fmt(event.created_at)}
                          {event.note ? ` · ${event.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Candidate lists attached to the relevant stages. */}
                  {stage.key === "evaluacion" && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Candidatos evaluados
                        {evaluados.length > 0
                          ? ` (${presentados.length} de ${evaluados.length} presentados)`
                          : ""}
                      </p>
                      {chips(evaluados, true)}
                    </div>
                  )}
                  {stage.key === "presentacion" && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Presentados
                      </p>
                      {chips(presentados)}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Admin candidate management */}
        {isAdmin && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Gestionar candidatos</h2>
            <p className="mt-1 text-sm text-slate-600">
              Agrega candidatos con evaluación completada, preséntalos a la
              empresa o descártalos.
            </p>

            {attachable.length > 0 && (
              <form
                action={attachCandidate}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="process_id" value={proc.id} />
                <select
                  name="candidate_id"
                  required
                  defaultValue=""
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#1E63E9]"
                >
                  <option value="" disabled>
                    Agregar candidato…
                  </option>
                  {attachable.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.display_name ?? "Candidato"}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-[#1E63E9] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1a55c7]"
                >
                  Agregar
                </button>
              </form>
            )}

            <div className="mt-5 space-y-2">
              {pcs.length === 0 && (
                <p className="text-sm text-slate-500">
                  Aún no hay candidatos en este proceso.
                </p>
              )}
              {[...enEvaluacion, ...presentados, ...descartados].map((pc) => {
                const prof = profileById.get(pc.candidate_id);
                const label =
                  pc.status === "presentado"
                    ? "Presentado"
                    : pc.status === "descartado"
                      ? "Descartado"
                      : "En evaluación";
                return (
                  <div
                    key={pc.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <Link
                      href={`/panel/candidatos/${pc.candidate_id}`}
                      className="text-sm font-medium text-[#1E63E9] hover:underline"
                    >
                      {prof?.display_name ?? "Candidato"}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">{label}</span>
                      {pc.status !== "presentado" && (
                        <StatusButton
                          pcId={pc.id}
                          processId={proc.id}
                          status="presentado"
                          text="Presentar"
                        />
                      )}
                      {pc.status !== "en_evaluacion" && (
                        <StatusButton
                          pcId={pc.id}
                          processId={proc.id}
                          status="en_evaluacion"
                          text="A evaluación"
                        />
                      )}
                      {pc.status !== "descartado" && (
                        <StatusButton
                          pcId={pc.id}
                          processId={proc.id}
                          status="descartado"
                          text="Descartar"
                        />
                      )}
                      <form action={removeProcessCandidate}>
                        <input type="hidden" name="id" value={pc.id} />
                        <input
                          type="hidden"
                          name="process_id"
                          value={proc.id}
                        />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusButton({
  pcId,
  processId,
  status,
  text,
}: {
  pcId: string;
  processId: string;
  status: string;
  text: string;
}) {
  return (
    <form action={setCandidateStatus}>
      <input type="hidden" name="id" value={pcId} />
      <input type="hidden" name="process_id" value={processId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[#16235C] hover:bg-slate-200"
      >
        {text}
      </button>
    </form>
  );
}
