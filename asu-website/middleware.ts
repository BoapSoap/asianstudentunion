import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // First, handle OAuth callback codes explicitly so the session is set before any other checks.
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.searchParams.delete("code");
    redirectUrl.searchParams.delete("state");

    // If the callback landed on the site root, send users to /admin after session exchange.
    if (redirectUrl.pathname === "/") {
      redirectUrl.pathname = "/admin";
    }

    return NextResponse.redirect(redirectUrl, { headers: res.headers });
  }

  if (isAdminRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/adminlogin";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  // Run on all routes so we can catch Supabase OAuth callbacks even if they land on "/".
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
