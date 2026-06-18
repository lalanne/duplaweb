import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Companies no longer browse a flat candidate pool — candidates are now seen
// inside the processes they belong to. Route accordingly.
export default async function CandidatosPage() {
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
    redirect("/panel/admin");
  }
  if (profile?.role === "company") {
    redirect("/panel/procesos");
  }
  redirect("/panel");
}
