"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProfileRole } from "@/lib/getCurrentProfile";
import { cn } from "@/lib/utils";

type ProfileRow = {
  id: string;
  role: ProfileRole;
  created_at: string;
  email?: string;
};

type RoleTableProps = {
  profiles: ProfileRow[];
  viewerRole: ProfileRole;
  currentUserId: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RolePill({ role }: { role: ProfileRole }) {
  const styles: Record<ProfileRole, string> = {
    viewer: "bg-white/10 text-white border-white/20",
    editor: "bg-emerald-500/15 text-emerald-100 border-emerald-400/60",
    admin: "bg-amber-500/15 text-amber-50 border-amber-400/60",
    owner: "bg-red-600/15 text-red-50 border-red-500/60",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide", styles[role])}>
      {role}
    </span>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {label}
    </button>
  );
}

export default function RoleTable({ profiles, viewerRole, currentUserId }: RoleTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = async (userId: string, targetRole: ProfileRole) => {
    setPendingId(userId);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: targetRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update role");
      }

      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setPendingId(userId);
    try {
      const confirmed = window.confirm("Are you sure you want to deny/remove this user? This deletes their profile and auth account.");
      if (!confirmed) {
        setPendingId(null);
        return;
      }

      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove user");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setPendingId(null);
    }
  };

  const isOwner = viewerRole === "owner";
  const isAdmin = viewerRole === "admin";

  const renderActions = (row: ProfileRow) => {
    if (row.role === "owner") {
      return <span className="text-xs text-white/60">Owner (locked)</span>;
    }

    if (isOwner) {
      const options: { label: string; target: ProfileRole }[] = [
        { label: "Make Admin (president)", target: "admin" },
        { label: "Approve as officer (editor)", target: "editor" },
        { label: "Move to pending (viewer)", target: "viewer" },
      ];
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <ActionButton
              key={option.target}
              label={option.label}
              disabled={option.target === row.role || pendingId === row.id || isPending}
              onClick={() => handleUpdate(row.id, option.target)}
            />
          ))}
          <ActionButton
            label="Deny / Remove"
            disabled={pendingId === row.id || isPending || row.id === currentUserId}
            onClick={() => handleRemove(row.id)}
          />
        </div>
      );
    }

    if (isAdmin) {
      if (row.role === "admin") {
        return <span className="text-xs text-white/60">Cannot modify admin</span>;
      }
      if (row.role === "viewer") {
        return (
          <ActionButton
            label="Promote to editor"
            disabled={pendingId === row.id || isPending}
            onClick={() => handleUpdate(row.id, "editor")}
          />
        );
      }
      if (row.role === "editor") {
        return (
          <ActionButton
            label="Demote to viewer"
            disabled={pendingId === row.id || isPending}
            onClick={() => handleUpdate(row.id, "viewer")}
          />
        );
      }
      if (row.role === "viewer") {
        return (
          <div className="flex flex-wrap gap-2">
            <ActionButton
              label="Approve as officer (editor)"
              disabled={pendingId === row.id || isPending}
              onClick={() => handleUpdate(row.id, "editor")}
            />
            <ActionButton
              label="Deny / Remove"
              disabled={pendingId === row.id || isPending || row.id === currentUserId}
              onClick={() => handleRemove(row.id)}
            />
          </div>
        );
      }
    }

    return <span className="text-xs text-white/60">No actions</span>;
  };

  const rowTone: Record<ProfileRole, string> = {
    owner: "bg-red-600/10",
    admin: "bg-amber-500/10",
    editor: "bg-emerald-600/10",
    viewer: "bg-white/5",
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/5">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/70">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/70">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/70">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/70">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {profiles.map((row) => (
            <tr key={row.id} className={cn("transition hover:bg-white/10", rowTone[row.role])}>
              <td className="px-4 py-3 align-top">
                {row.email && <div className="text-sm font-semibold text-white">{row.email}</div>}
                <div className="font-mono text-[11px] text-white/70 break-all">{row.id}</div>
                <div className="text-[11px] text-white/60">Joined {formatDate(row.created_at)}</div>
                {row.id === currentUserId && (
                  <div className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                    You
                  </div>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                <RolePill role={row.role} />
              </td>
              <td className="px-4 py-3 align-top text-sm text-white/70">{formatDate(row.created_at)}</td>
              <td className="px-4 py-3 align-top text-right">{renderActions(row)}</td>
            </tr>
          ))}
          {profiles.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-white/70">
                No profiles found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
