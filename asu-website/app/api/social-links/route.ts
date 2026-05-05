import { NextResponse } from "next/server";
import { DEFAULT_SOCIAL_LINKS, type SocialLink } from "@/lib/socialLinks";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function socialLinksResponse(links: SocialLink[]) {
  return NextResponse.json(
    { links },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("social_links")
    .select("id,label,url,icon_url,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load social links", error);
    return socialLinksResponse(DEFAULT_SOCIAL_LINKS);
  }

  return socialLinksResponse((data as SocialLink[] | null) ?? []);
}
