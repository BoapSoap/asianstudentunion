import type { ProfileRole } from "@/lib/getCurrentProfile";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type AdminActivityLogRecord = {
  id: string;
  actor_email: string;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  details: { changes?: string[]; [key: string]: unknown } | null;
  created_at: string;
};

export type AdminActivityInput = {
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: ProfileRole | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  details?: Record<string, unknown> | null;
};

export async function logAdminActivity(input: AdminActivityInput) {
  const actorEmail = input.actorEmail?.trim() || "unknown@system.local";

  const { error } = await supabaseAdmin.from("admin_activity_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    actor_email: actorEmail,
    actor_role: input.actorRole ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    summary: input.summary,
    details: input.details ?? {},
  });

  if (error) {
    console.error("Failed to write admin activity log", error);
  }
}

export function diffFieldChanges(
  fields: Array<{
    label: string;
    before: unknown;
    after: unknown;
    format?: (value: unknown) => string;
  }>
) {
  return fields
    .map((field) => {
      const before = formatDetailValue(field.before, field.format);
      const after = formatDetailValue(field.after, field.format);
      if (before === after) {
        return null;
      }
      return `${field.label}: ${before} -> ${after}`;
    })
    .filter((value): value is string => Boolean(value));
}

export function compactChanges(changes: string[], fallback: string) {
  return changes.length > 0 ? changes : [fallback];
}

export function formatDetailValue(value: unknown, formatter?: (value: unknown) => string) {
  if (formatter) {
    return formatter(value);
  }

  if (value === null || value === undefined || value === "") {
    return "none";
  }

  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "none";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "none";
  }

  return JSON.stringify(value);
}

export function truncateText(value: string | null | undefined, maxLength = 120) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return "none";
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}...`;
}
