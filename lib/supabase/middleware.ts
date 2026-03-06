import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLanding = pathname === "/";
  const isAuthRoute = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/signup/");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isOnboarding = pathname === "/onboarding";
  const isInvite = pathname.startsWith("/invite/");
  const isLegal = pathname.startsWith("/legal/");
  const isPublic = isLanding || isAuthRoute || isAuthCallback || isOnboarding || isInvite || isLegal;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  };

  if (!user && !isPublic) return redirectTo("/login");
  if (user && isAuthRoute) return redirectTo("/dashboard");

  if (user && !isOnboarding && !isInvite) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile && profile.role == null) return redirectTo("/onboarding");
  }

  return response;
}
