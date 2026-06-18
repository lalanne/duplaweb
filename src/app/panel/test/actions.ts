"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MINI_IPIP_ITEMS, scoreMiniIpip } from "@/lib/tests/mini-ipip";

export type TestState = { error?: string };

export async function submitMiniIpip(
  _prev: TestState,
  formData: FormData,
): Promise<TestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/ingresar");
  }

  const answers: Record<string, number> = {};
  for (const item of MINI_IPIP_ITEMS) {
    const value = Number(formData.get(item.id));
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return { error: "Por favor responde todas las preguntas." };
    }
    answers[item.id] = value;
  }

  const scores = scoreMiniIpip(answers);

  const { error } = await supabase.from("test_results").insert({
    user_id: user.id,
    test_key: "mini_ipip",
    ...scores,
    answers,
  });

  if (error) {
    return { error: "No se pudo guardar el resultado. Inténtalo de nuevo." };
  }

  redirect("/panel/test/resultado");
}
