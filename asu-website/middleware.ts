import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // First, handle OAuth callback codes explicitly so the session is set before any other checks.
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.searchParams.delete("code");
    redirectUrl.searchParams.delete("state");
    return NextResponse.redirect(redirectUrl, { headers: res.headers });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && req.nextUrl.pathname.startsWith("/admin")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/adminlogin";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
