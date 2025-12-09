"use client";

import { useState } from "react";
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
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-white shadow-xl backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Admin Control</p>
        <h3 className="text-lg font-bold text-white">Transfer Admin (Presidency)</h3>
        <p className="text-sm text-white/70">
          Enter a user ID or email. Ensures exactly one admin. The current admin is demoted to editor; owner stays owner.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/70"
          placeholder="User ID or email of the new admin"
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
        />
        <button
          type="button"
          onClick={handleTransfer}
          disabled={pending}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Transferring…" : "Transfer"}
        </button>
      </div>
    </div>
  );
}
