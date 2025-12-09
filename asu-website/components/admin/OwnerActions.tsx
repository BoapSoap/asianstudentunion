"use client";

import { useState } from "react";
import { toast } from "react-toastify";

type PendingState = "idle" | "resetting" | "transferring";

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-white/20 bg-white/5 p-4 text-sm text-white/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Reset officers for new term</p>
            <p className="text-xs text-white/60">
              Deletes all profiles and auth users except owners. Use at the end of the year to start fresh.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={pending !== "idle"}
            className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white/50 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === "resetting" ? "Resetting…" : "Reset officers"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-white/20 bg-white/5 p-4 text-sm text-white/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px]">
            <p className="text-sm font-semibold text-white">Transfer admin to new president</p>
            <p className="text-xs text-white/60">
              Moves the sole admin role to another user ID. The previous admin becomes an editor. Owners stay owners.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <input
              className="w-full min-w-[220px] rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/70"
              placeholder="Target user ID or email"
              value={targetAdminValue}
              onChange={(e) => setTargetAdminValue(e.target.value)}
            />
            <button
              type="button"
              onClick={handleTransfer}
              disabled={pending !== "idle"}
              className="rounded-lg border border-white/30 bg-amber-400 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black transition hover:scale-[1.01] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === "transferring" ? "Transferring…" : "Transfer admin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
