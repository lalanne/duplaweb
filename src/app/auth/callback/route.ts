import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Completes an OAuth sign-in (e.g. Google): exchanges the returned code for a
// session. If a role was chosen on the signup page, it is applied here.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/panel";
  const role = searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Coming from /registro with a chosen account type → set it once.
      if (role === "candidate" || role === "company") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({ role }).eq("id", user.id);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/ingresar?error=oauth`);
}
