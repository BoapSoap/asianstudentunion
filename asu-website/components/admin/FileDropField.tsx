"use client";

import { useEffect, useRef, useState, DragEvent } from "react";

type Props = {
    label: string;
    name: string;
    accept?: string | string[];
    helperText?: string;
    initialPreview?: string;
    onSelect?: (payload: { file?: File | null; remoteUrl?: string | null }) => void;
};

export default function FileDropField({ label, name, accept = "image/*", helperText, initialPreview, onSelect }: Props) {
    const [fileName, setFileName] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [active, setActive] = useState(false);
    const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!initialPreview) {
            setPreview(null);
            setFileName(null);
            setRemoteUrl(null);
            return;
        }
        setPreview(initialPreview);
        const baseName = initialPreview.split("/").pop() ?? "image";
        setFileName(baseName.split("?")[0] || baseName);
        setRemoteUrl(initialPreview);
    }, [initialPreview]);

    const syncInputFiles = (files: FileList | File[]) => {
        const input = inputRef.current;
        if (!input) return;

        const filesArray = Array.isArray(files) ? files : Array.from(files);
        if (typeof DataTransfer !== "undefined") {
            try {
                const dt = new DataTransfer();
                filesArray.forEach((file) => dt.items.add(file));
                input.files = dt.files;
                return;
            } catch {
                // Fallback for browsers without a DataTransfer constructor (e.g. older Safari)
            }
        }

        if (!Array.isArray(files)) {
            try {
                input.files = files;
                return;
            } catch {
                // As a last resort, leave the input untouched if the browser blocks programmatic assignment
            }
        }
    };

    const extractUrlFromDrop = (dataTransfer: DataTransfer) => {
        const uriList = dataTransfer.getData("text/uri-list");
        if (uriList) {
            const first = uriList.split("\n").find(Boolean);
            if (first) return first.trim();
        }

        const text = dataTransfer.getData("text/plain");
        if (text && /^https?:\/\//i.test(text.trim())) return text.trim();

        const html = dataTransfer.getData("text/html");
        if (html) {
            const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (match?.[1]) return match[1];
        }
        return null;
    };

    const normalizeImageUrl = (raw: string) => {
        try {
            const url = new URL(raw);
            // Handle Google Images wrappers like /imgres?imgurl=... or /url?sa=i&url=...
            const imgurl = url.searchParams.get("imgurl");
            if (imgurl) return imgurl;
            const urlParam = url.searchParams.get("url");
            if (url.pathname === "/url" && urlParam) return urlParam;
        } catch {
            // ignore
        }
        return raw;
    };

    const extractUrlFromItems = (items: DataTransferItemList | undefined | null) =>
        new Promise<string | null>((resolve) => {
            if (!items || items.length === 0) return resolve(null);

            let pending = 0;
            let finished = false;
            const finish = (url: string | null) => {
                if (!finished) {
                    finished = true;
                    resolve(url);
                }
            };

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind !== "string") continue;
                if (item.type !== "text/uri-list" && item.type !== "text/plain" && item.type !== "text/html") continue;

                pending++;
                item.getAsString((value) => {
                    if (finished) return;
                    const val = value?.trim() || "";
                    if (item.type === "text/html") {
                        const match = val.match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (match?.[1]) return finish(match[1]);
                    }
                    if (/^https?:\/\//i.test(val)) return finish(val);

                    pending--;
                    if (pending === 0) finish(null);
                });
            }

            if (pending === 0) finish(null);
        });

    const urlToFile = async (url: string): Promise<File | null> => {
        try {
            const res = await fetch(url, { mode: "cors", referrerPolicy: "no-referrer" });
            if (!res.ok) return null;

            const blob = await res.blob();
            if (!blob.type.startsWith("image/")) return null;

            const pathName = new URL(url).pathname;
            const baseName = pathName.split("/").pop() || "dropped-image";
            const cleanName = baseName.split("?")[0] || "dropped-image";

            return new File([blob], cleanName, { type: blob.type || "image/*" });
        } catch {
            return null;
        }
    };

    const handleSelect = (file: File) => {
        setFileName(file.name);
        setPreview(URL.createObjectURL(file));
        setRemoteUrl(null);
        onSelect?.({ file, remoteUrl: null });
    };

    const handleRemoteSelect = (url: string) => {
        const cleanedName = url.split("/").pop()?.split("?")[0] || "image-from-link";
        setFileName(cleanedName);
        setPreview(url);
        setRemoteUrl(url);
        if (inputRef.current) inputRef.current.value = "";
        onSelect?.({ file: null, remoteUrl: url });
    };

    const onDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setActive(false);
        const files = e.dataTransfer.files;
        const file = files?.[0];
        if (file) {
            handleSelect(file);
            syncInputFiles(files);
            return;
        }

        // Some browsers expose the dropped image as a file item even when files is empty
        if (e.dataTransfer.items?.length) {
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const item = e.dataTransfer.items[i];
                if (item.kind === "file") {
                    const asFile = item.getAsFile();
                    if (asFile) {
                        handleSelect(asFile);
                        syncInputFiles([asFile]);
                        return;
                    }
                }
            }
        }

        let droppedUrl = extractUrlFromDrop(e.dataTransfer);
        if (!droppedUrl) droppedUrl = await extractUrlFromItems(e.dataTransfer.items);
        if (!droppedUrl) return;

        droppedUrl = normalizeImageUrl(droppedUrl);

        const fetchedFile = await urlToFile(droppedUrl);
        if (fetchedFile) {
            handleSelect(fetchedFile);
            syncInputFiles([fetchedFile]);
            return;
        }

        // If we couldn't fetch (CORS, blocked), still set the remote URL so the server can fetch it
        handleRemoteSelect(droppedUrl);
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        setActive(true);
    };

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setActive(false);
    };

    const acceptAttr = Array.isArray(accept) ? accept.join(",") : accept;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#ddd" }}>{label}</span>
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => inputRef.current?.click()}
                style={{
                    position: "relative",
                    border: "1px dashed rgba(255,255,255,0.35)",
                    borderRadius: 12,
                    padding: "14px 14px",
                    background: active ? "rgba(255,215,0,0.12)" : "rgba(0,0,0,0.25)",
                    color: "white",
                    cursor: "pointer",
                    transition: "background 0.15s ease, border 0.15s ease, outline 0.15s ease",
                    outline: active ? "2px solid rgba(255,215,0,0.6)" : "none",
                }}
            >
                <input
                    ref={inputRef}
                    name={name}
                    type="file"
                    accept={acceptAttr}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSelect(file);
                    }}
                    style={{ display: "none" }}
                />
                <input type="hidden" name={`${name}_remote`} value={remoteUrl ?? ""} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <strong style={{ fontSize: 13 }}>
                        {active ? "Release to use this image file…" : "Click to upload an image file"}
                    </strong>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>
                        {fileName
                            ? `Selected: ${fileName}`
                            : helperText || "Use a downloaded image saved on your device (click to pick)"}
                    </span>
                </div>
                {active && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 12,
                            background: "rgba(255,215,0,0.06)",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>
            {preview && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div
                        style={{
                            height: 6,
                            borderRadius: 999,
                            background: "linear-gradient(90deg, #ffd75e, #ffb347)",
                        }}
                    />
                    <img
                        src={preview}
                        alt="Preview"
                        style={{
                            borderRadius: 12,
                            maxHeight: 160,
                            objectFit: "cover",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    />
                    <span style={{ fontSize: 12, color: "#ddd" }}>File ready to upload</span>
                </div>
            )}
        </div>
    );
}
