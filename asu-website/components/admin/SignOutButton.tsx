"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mui/material";
import { createSupabaseClient } from "@/lib/supabaseClient";

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
    <Button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      size="small"
      variant="outlined"
      sx={{
        borderRadius: 999,
        borderColor: "rgba(255,255,255,0.28)",
        color: "#fff",
        textTransform: "none",
        fontWeight: 700,
        px: 1.6,
        py: 0.75,
        "&:hover": {
          borderColor: "rgba(255,255,255,0.42)",
          backgroundColor: "rgba(255,255,255,0.08)",
        },
      }}
    >
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
