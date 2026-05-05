import { NextResponse } from "next/server";
import { compactChanges, logAdminActivity } from "@/lib/adminActivity";
import { requireEditorAccess } from "@/lib/adminAccess";
import { getDomainRenewalNoticeState } from "@/lib/domainRenewalNotice";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NoticeBody = {
  action?: string;
  noticeKey?: string;
};

export async function POST(request: Request) {
  const access = await requireEditorAccess();
  if ("error" in access) {
    return access.error;
  }

  let body: NoticeBody;
  try {
    body = (await request.json()) as NoticeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action !== "acknowledge_domain_renewal") {
    return NextResponse.json({ error: "Unsupported notice action" }, { status: 400 });
  }

  const notice = getDomainRenewalNoticeState();
  if (body.noticeKey !== notice.noticeKey) {
    return NextResponse.json({ error: "Invalid notice key" }, { status: 400 });
  }

  const acknowledgedAt = new Date().toISOString();
  const { error } = await supabaseAdmin.from("admin_notice_acknowledgements").upsert(
    {
      notice_key: notice.noticeKey,
      acknowledged_by: access.userId,
      acknowledged_by_email: access.email,
      acknowledged_at: acknowledgedAt,
    },
    { onConflict: "notice_key" }
  );

  if (error) {
    console.error("Failed to acknowledge admin notice", error);
    return NextResponse.json({ error: "Failed to acknowledge notice" }, { status: 500 });
  }

  await logAdminActivity({
    actorUserId: access.userId,
    actorEmail: access.email,
    actorRole: access.role,
    action: "acknowledge_notice",
    entityType: "admin_notice",
    entityId: notice.noticeKey,
    summary: `acknowledged ${notice.noticeKey}`,
    details: {
      changes: compactChanges(
        [`Domain renewal warning acknowledged for ${notice.renewalDateLabel}`],
        "Acknowledged admin notice"
      ),
      notice_key: notice.noticeKey,
      renewal_date: notice.renewalDateLabel,
    },
  });

  return NextResponse.json({ success: true, acknowledgedAt });
}
