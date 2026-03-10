"use client";

import { useState } from "react";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";

export default function AdminTransferPanel() {
  const [targetValue, setTargetValue] = useState("");
  const [pending, setPending] = useState(false);

  const handleTransfer = async () => {
    const raw = targetValue.trim();
    if (!raw) {
      toast.error("Enter a user ID or email.");
      return;
    }

    const payload = raw.includes("@")
      ? { action: "transfer_admin", targetEmail: raw }
      : { action: "transfer_admin", targetUserId: raw };

    const confirmation = window.prompt(
      `Transfer admin (presidency) to this user?\n\n${raw}\n\nThis will remove ALL existing admins and editors (deleting their access) and make this user the sole admin. Owner remains unchanged.\n\nType CONFIRM to proceed:`
    );
    if (confirmation !== "CONFIRM") {
      toast.info("Transfer canceled.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Transfer failed");
      toast.success("Admin transferred");
      setTargetValue("");
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        borderRadius: 3,
        borderColor: "rgba(245, 158, 11, 0.45)",
        bgcolor: "rgba(245, 158, 11, 0.12)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="overline" sx={{ letterSpacing: "0.1em", color: "rgba(253, 230, 138, 0.95)", fontWeight: 700 }}>
            Admin Control
          </Typography>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800 }}>
            Transfer Admin (Presidency)
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
            Enter a user ID or email. Ensures exactly one admin. The current admin is demoted to editor; owner stays owner.
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="User ID or email of the new admin"
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
            disabled={pending}
            variant="contained"
            sx={{
              minWidth: 140,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#f59e0b",
              color: "#111827",
              "&:hover": { bgcolor: "#fbbf24" },
            }}
          >
            {pending ? "Transferring..." : "Transfer"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
