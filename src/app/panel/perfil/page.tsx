import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PerfilForm } from "./perfil-form";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/ingresar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "role, display_name, email, phone, contact_email, birth_date, location, headline, summary, linkedin_url, years_experience, education_level, desired_role, cv_path",
    )
    .eq("id", user.id)
    .single();

  if (profile?.role === "company") {
    redirect("/panel");
  }

  // Short-lived link to the candidate's current CV, if they've uploaded one.
  let cvUrl: string | null = null;
  if (profile?.cv_path) {
    const { data } = await supabase.storage
      .from("cvs")
      .createSignedUrl(profile.cv_path, 300);
    cvUrl = data?.signedUrl ?? null;
  }

  return (
    <PerfilForm
      profile={profile ?? {}}
      loginEmail={user.email ?? ""}
      cvUrl={cvUrl}
    />
  );
}
