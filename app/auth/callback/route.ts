import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Base URL de l'app (évite les redirections vers vercel.app quand un domaine custom est configuré). */
function getAppBaseUrl(request: Request): string {
  const canonical = process.env.NEXT_PUBLIC_APP_URL;
  if (canonical) return canonical.replace(/\/$/, "");
  const { origin } = new URL(request.url);
  return origin;
}

export async function GET(request: Request) {
  const baseUrl = getAppBaseUrl(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}
