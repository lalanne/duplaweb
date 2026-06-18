"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function createMatch(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const candidateId = String(formData.get("candidate_id") ?? "");
  const companyId = String(formData.get("company_id") ?? "");
  if (!candidateId || !companyId) return;

  // Ignore duplicates (the table has a unique constraint).
  await supabase.from("matches").upsert(
    { candidate_id: candidateId, company_id: companyId, created_by: user.id },
    { onConflict: "candidate_id,company_id", ignoreDuplicates: true },
  );
  revalidatePath("/panel/admin");
}

export async function removeMatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("matches").delete().eq("id", id);
  revalidatePath("/panel/admin");
}
