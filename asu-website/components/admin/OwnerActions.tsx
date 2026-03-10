"use client";

import { useState } from "react";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";

type PendingState = "idle" | "resetting" | "transferring";

function surfaceSx(color: "white" | "amber") {
  if (color === "amber") {
    return {
      borderColor: "rgba(245, 158, 11, 0.45)",
      bgcolor: "rgba(245, 158, 11, 0.12)",
    };
  }

  return {
    borderColor: "rgba(255,255,255,0.24)",
    bgcolor: "rgba(255,255,255,0.08)",
  };
}

export default function OwnerActions() {
  const [pending, setPending] = useState<PendingState>("idle");
  const [targetAdminValue, setTargetAdminValue] = useState("");

  const callAction = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/admin/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Reset officers for the new term?\n\nThis deletes all profiles and auth users except owners. This cannot be undone."
    );
    if (!confirmed) return;
    setPending("resetting");
    try {
      await callAction({ action: "reset_officers" });
      toast.success("Officers reset. Only owners remain.");
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setPending("idle");
    }
  };

  const handleTransfer = async () => {
    const raw = targetAdminValue.trim();
    if (!raw) {
      toast.error("Provide a target user ID or email");
      return;
    }
    const isEmail = raw.includes("@");
    const payload = { action: "transfer_admin", ...(isEmail ? { targetEmail: raw } : { targetUserId: raw }) };
    const confirmTarget = isEmail ? `Email: ${raw}` : `User ID: ${raw}`;
    const confirmation = window.prompt(
      `Transfer admin role to this user?\n\n${confirmTarget}\n\nThis will remove ALL existing admins and editors (deleting their access) and make this user the sole admin. Owner remains unchanged.\n\nType CONFIRM to proceed:`
    );
    if (confirmation !== "CONFIRM") {
      toast.info("Transfer canceled.");
      return;
    }
    setPending("transferring");
    try {
      await callAction(payload);
      toast.success("Admin transferred");
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setPending("idle");
    }
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2.5, ...surfaceSx("white") }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700 }}>
              Reset officers for new term
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.68)" }}>
              Deletes all profiles and auth users except owners. Use at the end of the year to start fresh.
            </Typography>
          </Stack>
          <Button
            type="button"
            onClick={handleReset}
            disabled={pending !== "idle"}
            variant="outlined"
            sx={{
              alignSelf: { xs: "flex-start", md: "center" },
              borderColor: "rgba(255,255,255,0.35)",
              color: "#fff",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              "&:hover": { borderColor: "rgba(255,255,255,0.55)", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            {pending === "resetting" ? "Resetting..." : "Reset officers"}
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 2.5, ...surfaceSx("amber") }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
          <Stack spacing={0.5} sx={{ maxWidth: 700 }}>
            <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700 }}>
              Transfer admin to new president
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Moves the sole admin role to another user ID. The previous admin becomes an editor. Owners stay owners.
            </Typography>
          </Stack>

          <Stack spacing={1.2} sx={{ width: { xs: "100%", md: 320 } }}>
            <TextField
              size="small"
              placeholder="Target user ID or email"
              value={targetAdminValue}
              onChange={(e) => setTargetAdminValue(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.05)",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "rgba(253, 230, 138, 0.9)" },
                },
              }}
            />
            <Button
              type="button"
              onClick={handleTransfer}
              disabled={pending !== "idle"}
              variant="contained"
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: "#f59e0b",
                color: "#111827",
                "&:hover": { bgcolor: "#fbbf24" },
              }}
            >
              {pending === "transferring" ? "Transferring..." : "Transfer admin"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
