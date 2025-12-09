import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabaseServer";

export type ProfileRole = "viewer" | "editor" | "admin" | "owner";

export type Profile = {
  id: string;
  role: ProfileRole;
  created_at: string;
};

export type CurrentProfileResult = {
  user: User | null;
  profile: Profile | null;
};

const hasCode = (error: unknown): error is { code?: string } =>
  typeof error === "object" && error !== null && "code" in error;

export async function getCurrentProfile(): Promise<CurrentProfileResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    const message = userError.message || "";
    const isMissing =
      userError.status === 403 ||
      (hasCode(userError) && userError.code === "user_not_found") ||
      message.includes("User from sub claim in JWT does not exist");

    if (isMissing) {
      // Clear invalid session cookies so the user can re-auth cleanly.
      await supabase.auth.signOut();
      return { user: null, profile: null };
    }

    console.error("Failed to get current user", userError);
  }

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load profile for user", profileError);
  }

  const validRoles: ProfileRole[] = ["viewer", "editor", "admin", "owner"];
  const safeProfile =
    profile && validRoles.includes(profile.role as ProfileRole)
      ? (profile as Profile)
      : null;

  return { user, profile: safeProfile };
}
