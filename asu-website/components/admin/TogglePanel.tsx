"use client";

import { useState } from "react";

export default function TogglePanel({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div
            style={{
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: 12,
                background: "linear-gradient(145deg, rgba(0,0,0,0.25), rgba(255,255,255,0.04))",
                boxShadow: "0 10px 28px rgba(0,0,0,0.3)",
            }}
        >
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                style={{
                    background: "rgba(255,215,0,0.22)",
                    color: "var(--accent-color)",
                    border: "1px solid rgba(255,215,0,0.35)",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                }}
            >
                {open ? "Close Edit" : label}
            </button>
            {open && (
                <div
                    style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 12,
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
