"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROCESS_STAGE_KEYS } from "@/lib/processes";

async function requireAdmin() {
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
  if (profile?.role !== "admin") {
    redirect("/panel");
  }
  return { supabase, user };
}

export async function createProcess(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const companyId = String(formData.get("company_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const roleName = String(formData.get("role_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!companyId || !name || !roleName) return;

  const { data: proc } = await supabase
    .from("processes")
    .insert({
      company_id: companyId,
      name,
      role_name: roleName,
      description: description || null,
      stage: PROCESS_STAGE_KEYS[0],
      created_by: user.id,
    })
    .select("id")
    .single();

  // Log the opening event so the timeline starts populated.
  if (proc) {
    await supabase.from("process_events").insert({
      process_id: proc.id,
      stage: PROCESS_STAGE_KEYS[0],
      created_by: user.id,
    });
  }

  revalidatePath("/panel/admin/procesos");
}

export async function updateProcessStage(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!id || !PROCESS_STAGE_KEYS.includes(stage as never)) return;

  await supabase
    .from("processes")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("process_events").insert({
    process_id: id,
    stage,
    note: note || null,
    created_by: user.id,
  });

  revalidatePath("/panel/admin/procesos");
  revalidatePath(`/panel/procesos/${id}`);
}

export async function deleteProcess(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("processes").delete().eq("id", id);
  revalidatePath("/panel/admin/procesos");
}

const CANDIDATE_STATUSES = ["en_evaluacion", "presentado", "descartado"];

export async function attachCandidate(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const processId = String(formData.get("process_id") ?? "");
  const candidateId = String(formData.get("candidate_id") ?? "");
  if (!processId || !candidateId) return;

  await supabase.from("process_candidates").upsert(
    {
      process_id: processId,
      candidate_id: candidateId,
      status: "en_evaluacion",
      created_by: user.id,
    },
    { onConflict: "process_id,candidate_id", ignoreDuplicates: true },
  );
  revalidatePath(`/panel/procesos/${processId}`);
}

export async function setCandidateStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const processId = String(formData.get("process_id") ?? "");
  if (!id || !CANDIDATE_STATUSES.includes(status)) return;

  await supabase.from("process_candidates").update({ status }).eq("id", id);
  revalidatePath(`/panel/procesos/${processId}`);
}

export async function removeProcessCandidate(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const processId = String(formData.get("process_id") ?? "");
  if (!id) return;
  await supabase.from("process_candidates").delete().eq("id", id);
  revalidatePath(`/panel/procesos/${processId}`);
}
