"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ProfileRole } from "@/lib/getCurrentProfile";

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
  const color = role === "owner" ? "error" : role === "admin" ? "warning" : role === "editor" ? "success" : "default";
  return <Chip size="small" color={color} label={role} sx={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }} />;
}

function ActionButton({
  label,
  disabled,
  onClick,
  tone = "default",
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <Button
      type="button"
      size="small"
      variant="outlined"
      disabled={disabled}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        textTransform: "none",
        fontWeight: 700,
        color: tone === "danger" ? "rgba(254, 202, 202, 1)" : "#fff",
        borderColor: tone === "danger" ? "rgba(239, 68, 68, 0.55)" : "rgba(255,255,255,0.26)",
        "&:hover": {
          borderColor: tone === "danger" ? "rgba(239, 68, 68, 0.78)" : "rgba(255,255,255,0.42)",
          backgroundColor: tone === "danger" ? "rgba(127, 29, 29, 0.26)" : "rgba(255,255,255,0.08)",
        },
      }}
    >
      {label}
    </Button>
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
    const actionPending = pendingId === row.id || isPending;

    if (row.role === "owner") {
      return <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.62)" }}>Owner (locked)</Typography>;
    }

    if (isOwner) {
      const options: { label: string; target: ProfileRole }[] = [
        { label: "Make Admin (president)", target: "admin" },
        { label: "Approve as officer (editor)", target: "editor" },
        { label: "Move to pending (viewer)", target: "viewer" },
      ];

      return (
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
          {options.map((option) => (
            <ActionButton
              key={option.target}
              label={option.label}
              disabled={option.target === row.role || actionPending}
              onClick={() => handleUpdate(row.id, option.target)}
            />
          ))}
          <ActionButton
            label="Deny / Remove"
            tone="danger"
            disabled={actionPending || row.id === currentUserId}
            onClick={() => handleRemove(row.id)}
          />
        </Stack>
      );
    }

    if (isAdmin) {
      if (row.role === "admin") {
        return <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.62)" }}>Cannot modify admin</Typography>;
      }

      if (row.role === "editor") {
        return (
          <ActionButton
            label="Demote to viewer"
            disabled={actionPending}
            onClick={() => handleUpdate(row.id, "viewer")}
          />
        );
      }

      if (row.role === "viewer") {
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
            <ActionButton
              label="Promote to editor"
              disabled={actionPending}
              onClick={() => handleUpdate(row.id, "editor")}
            />
            <ActionButton
              label="Deny / Remove"
              tone="danger"
              disabled={actionPending || row.id === currentUserId}
              onClick={() => handleRemove(row.id)}
            />
          </Stack>
        );
      }
    }

    return <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.62)" }}>No actions</Typography>;
  };

  const rowTone: Record<ProfileRole, string> = {
    owner: "rgba(185, 28, 28, 0.18)",
    admin: "rgba(245, 158, 11, 0.18)",
    editor: "rgba(16, 185, 129, 0.16)",
    viewer: "rgba(255,255,255,0.05)",
  };

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 3, borderColor: "rgba(255,255,255,0.16)", bgcolor: "rgba(255,255,255,0.07)" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ "& th": { borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" } }}>
            <TableCell>User</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {profiles.map((row) => (
            <TableRow key={row.id} hover sx={{ "& td": { borderColor: "rgba(255,255,255,0.1)" }, backgroundColor: rowTone[row.role] }}>
              <TableCell sx={{ minWidth: 280, verticalAlign: "top" }}>
                {row.email && (
                  <Typography variant="body2" sx={{ color: "#fff", fontWeight: 700 }}>
                    {row.email}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace", wordBreak: "break-all", display: "block" }}>
                  {row.id}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.62)", display: "block", mt: 0.4 }}>
                  Joined {formatDate(row.created_at)}
                </Typography>
                {row.id === currentUserId && (
                  <Chip
                    label="You"
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: "rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.92)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  />
                )}
              </TableCell>
              <TableCell sx={{ minWidth: 130, verticalAlign: "top" }}>
                <RolePill role={row.role} />
              </TableCell>
              <TableCell sx={{ minWidth: 170, color: "rgba(255,255,255,0.74)", verticalAlign: "top" }}>
                {formatDate(row.created_at)}
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 300, verticalAlign: "top" }}>
                {renderActions(row)}
              </TableCell>
            </TableRow>
          ))}
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 5, color: "rgba(255,255,255,0.72)" }}>
                No profiles found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
