"use client";

import { useState } from "react";
import { toast } from "react-toastify";

type Props = {
    label: string;
    color?: string;
    confirmMessage: string;
    toastMessage?: string;
    style?: React.CSSProperties;
    formId: string;
};

export default function ConfirmSubmit({
    label,
    color = "#ffd75e",
    confirmMessage,
    toastMessage,
    style,
    formId,
}: Props) {
    const [open, setOpen] = useState(false);

    const submitForm = () => {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (form) {
            if (toastMessage) toast.info(toastMessage);
            form.requestSubmit();
            setOpen(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                style={{
                    background: color,
                    color: "#111",
                    border: "none",
                    borderRadius: 12,
                    padding: "9px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
                    ...style,
                }}
            >
                {label}
            </button>

            {open && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            background: "linear-gradient(145deg, #1c0d0d, #2c1313)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 14,
                            padding: "18px",
                            width: "min(420px, 100%)",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                            color: "white",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <strong style={{ fontSize: "1rem" }}>Confirm</strong>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                style={{
                                    background: "transparent",
                                    color: "#ccc",
                                    border: "none",
                                    fontSize: 16,
                                    cursor: "pointer",
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <p style={{ margin: 0, opacity: 0.9 }}>{confirmMessage}</p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                style={{
                                    background: "rgba(255,255,255,0.12)",
                                    color: "white",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitForm}
                                style={{
                                    background: color,
                                    color: "#111",
                                    border: "none",
                                    borderRadius: 10,
                                    padding: "8px 14px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
                                }}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
