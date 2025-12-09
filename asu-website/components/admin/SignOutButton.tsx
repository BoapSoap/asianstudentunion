"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export default function SignOutButton() {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/adminlogin");
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={cn(
        "rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition",
        "hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
        loading && "cursor-not-allowed opacity-60"
      )}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
