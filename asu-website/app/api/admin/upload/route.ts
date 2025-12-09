import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ProfileRole } from "@/lib/getCurrentProfile";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "asu-storage";
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const EDIT_ROLES: ProfileRole[] = ["editor", "admin", "owner"];

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load actor profile", profileError);
    return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
  }

  const role = profile?.role as ProfileRole | undefined;
  if (!role || !EDIT_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = (formData.get("folder") as string | null)?.trim() || "uploads";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = file.name.split(".").pop();
  const safeExt = ext ? `.${ext}` : "";
  const filePath = `${folder}/${randomUUID()}${safeExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type || "application/octet-stream", upsert: true });

  if (uploadError) {
    console.error("Upload failed", uploadError);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
  const publicUrl = publicUrlData.publicUrl;

  return NextResponse.json({ success: true, publicUrl, path: filePath, bucket: BUCKET });
}
