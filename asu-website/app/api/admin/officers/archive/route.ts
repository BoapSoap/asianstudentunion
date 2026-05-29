import { NextResponse } from "next/server";
import { compactChanges, logAdminActivity } from "@/lib/adminActivity";
import { requireAdminAccess } from "@/lib/adminAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ArchiveBody = {
  termLabel?: string;
  understood?: boolean;
};

function normalizeTermLabel(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})\s*-\s*(\d{4})(?:\s+Core)?$/i);
  if (!match) return null;

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) return null;

  return `${startYear}-${endYear} Core`;
}

export async function POST(request: Request) {
  const access = await requireAdminAccess();
  if ("error" in access) return access.error;

  let body: ArchiveBody;
  try {
    body = (await request.json()) as ArchiveBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.understood) {
    return NextResponse.json({ error: "Confirmation is required" }, { status: 400 });
  }

  const termLabel =
    typeof body.termLabel === "string" ? normalizeTermLabel(body.termLabel) : null;
  if (!termLabel) {
    return NextResponse.json(
      { error: "Use a school year like 2025-2026" },
      { status: 400 }
    );
  }

  const { data: currentOfficers, error: fetchError } = await supabaseAdmin
    .from("officers")
    .select("id,name")
    .eq("is_current", true);

  if (fetchError) {
    console.error("Failed to load current officers for archive", fetchError);
    return NextResponse.json({ error: "Failed to load current officers" }, { status: 500 });
  }

  const officerIds = (currentOfficers ?? []).map((officer) => officer.id);
  if (officerIds.length === 0) {
    return NextResponse.json({ error: "There are no current officers to archive" }, { status: 400 });
  }

  const { count: existingTermCount, error: existingTermError } = await supabaseAdmin
    .from("officers")
    .select("id", { count: "exact", head: true })
    .eq("is_current", false)
    .eq("term_label", termLabel);

  if (existingTermError) {
    console.error("Failed to check archived officer term", existingTermError);
    return NextResponse.json({ error: "Failed to check archive year" }, { status: 500 });
  }

  if ((existingTermCount ?? 0) > 0) {
    return NextResponse.json(
      { error: `${termLabel} already exists in the archive` },
      { status: 409 }
    );
  }

  const archivedAt = new Date().toISOString();
  const { error: archiveError } = await supabaseAdmin
    .from("officers")
    .update({
      is_current: false,
      term_label: termLabel,
      archived_at: archivedAt,
    })
    .in("id", officerIds);

  if (archiveError) {
    console.error("Failed to archive current officers", archiveError);
    return NextResponse.json({ error: "Failed to archive current core" }, { status: 500 });
  }

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: "archive",
    entityType: "officer_core",
    entityId: termLabel,
    summary: `archived ${officerIds.length} officers as ${termLabel}`,
    details: {
      changes: compactChanges(
        [
          `Archived ${officerIds.length} current officer cards`,
          `Current officer section was cleared`,
        ],
        `Archived ${termLabel}`
      ),
    },
  });

  return NextResponse.json({
    success: true,
    termLabel,
    archived: officerIds.length,
  });
}
