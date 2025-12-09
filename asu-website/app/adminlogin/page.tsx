"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export default function AdminLoginPage() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      // If we have a session, send the user to /admin; otherwise just show the login card.
      if (sessionError && sessionError.message && sessionError.message !== "Auth session missing!") {
        const msg = sessionError.message || "";
        const errorCode =
          typeof sessionError === "object" && sessionError && "code" in sessionError
            ? (sessionError as { code?: string }).code
            : undefined;
        const isMissing =
          sessionError.status === 403 ||
          errorCode === "user_not_found" ||
          msg.includes("User from sub claim in JWT does not exist");

        if (isMissing) {
          await supabase.auth.signOut();
        } else {
          console.error("Failed to check auth session", sessionError);
          setError("Unable to verify your session. Please try again.");
        }
      }

      if (data?.session?.user) {
        setSessionUser(data.session.user.email ?? data.session.user.id);
      }
      setCheckingSession(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    const origin = siteUrl || `${location.protocol}//${location.host}`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/admin`,
        // Force account chooser so you can pick a different Google account.
        queryParams: { prompt: "select_account" },
      },
    });
    if (signInError) {
      console.error("Google sign-in failed", signInError);
      setError(signInError.message);
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setSigningIn(false);
    setError(null);
    await supabase.auth.signOut();
    setCheckingSession(false);
    setSessionUser(null);
    router.refresh();
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0f0a0a] via-[#1b0e0e] to-[#120606] py-20 px-4 flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-red-700/30 blur-3xl" />
        <div className="absolute right-0 top-10 h-52 w-52 rounded-full bg-yellow-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 px-8 py-10 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/80">
          ASU Officer Login
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-white/70">
          Sign in with your ASU Google account to access the admin dashboard.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {sessionUser ? (
            <>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                Signed in as {sessionUser}
              </div>
              <button
                type="button"
                onClick={() => router.replace("/admin")}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-3 text-base font-semibold text-black transition",
                  "hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                )}
              >
                Continue to Admin
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-semibold text-white/70 underline decoration-dotted underline-offset-4 hover:text-white"
              >
                Not you? Sign out and switch account
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSignIn}
                disabled={signingIn || checkingSession}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-3 text-base font-semibold text-black transition",
                  "hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200",
                  (signingIn || checkingSession) && "cursor-not-allowed opacity-70"
                )}
              >
                {signingIn ? "Redirecting to Google…" : "Sign in with Google"}
              </button>
              {checkingSession && (
                <p className="text-xs text-white/60">Checking your session…</p>
              )}
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 text-xs font-semibold text-white/70 underline decoration-dotted underline-offset-4 hover:text-white"
              >
                Not you? Sign out and switch account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
