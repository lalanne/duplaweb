"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; message?: string };

const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB
const CV_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/ingresar");
  }

  const displayName = text(formData, "display_name");
  if (!displayName) {
    return { error: "Ingresa tu nombre completo." };
  }

  const contactEmail = text(formData, "contact_email");
  if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    return { error: "El correo de contacto no es válido." };
  }

  const birthDateRaw = text(formData, "birth_date");
  if (birthDateRaw && Number.isNaN(Date.parse(birthDateRaw))) {
    return { error: "La fecha de nacimiento no es válida." };
  }

  const yearsRaw = text(formData, "years_experience");
  let yearsExperience: number | null = null;
  if (yearsRaw) {
    const n = Number(yearsRaw);
    if (!Number.isInteger(n) || n < 0 || n > 80) {
      return { error: "Los años de experiencia no son válidos." };
    }
    yearsExperience = n;
  }

  // Optional CV upload. Only touch storage / cv_path when a new file is sent.
  let cvPath: string | undefined;
  const cv = formData.get("cv");
  if (cv instanceof File && cv.size > 0) {
    const ext = CV_EXTENSIONS[cv.type];
    if (!ext) {
      return { error: "El CV debe ser un archivo PDF, DOC o DOCX." };
    }
    if (cv.size > MAX_CV_BYTES) {
      return { error: "El CV no puede superar los 5 MB." };
    }
    const path = `${user.id}/cv.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, cv, { upsert: true, contentType: cv.type });
    if (uploadError) {
      return { error: "No se pudo subir el CV. Inténtalo de nuevo." };
    }
    cvPath = path;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      phone: text(formData, "phone") || null,
      contact_email: contactEmail || null,
      birth_date: birthDateRaw || null,
      location: text(formData, "location") || null,
      headline: text(formData, "headline") || null,
      summary: text(formData, "summary") || null,
      linkedin_url: text(formData, "linkedin_url") || null,
      years_experience: yearsExperience,
      education_level: text(formData, "education_level") || null,
      desired_role: text(formData, "desired_role") || null,
      ...(cvPath ? { cv_path: cvPath } : {}),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "No se pudo guardar el perfil. Inténtalo de nuevo." };
  }

  revalidatePath("/panel/perfil");
  return { message: "Perfil guardado correctamente." };
}
