"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const ROLES = ["candidate", "company", "admin"] as const;

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const role = String(formData.get("role") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { error: "Selecciona un tipo de cuenta." };
  }
  if (!displayName) {
    return {
      error:
        role === "company"
          ? "Ingresa el nombre de la empresa."
          : "Ingresa tu nombre completo.",
    };
  }
  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, display_name: displayName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is disabled, a session is created and we go straight in.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/panel");
  }

  // Otherwise the user must confirm via the email they were sent.
  return {
    message:
      "Te enviamos un correo para confirmar tu cuenta. Revísalo para continuar.",
  };
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  revalidatePath("/", "layout");
  redirect("/panel");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
