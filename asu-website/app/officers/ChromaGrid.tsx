"use client";

import { useEffect, useMemo, useRef } from "react";
import "./ChromaGrid.css";

type ChromaItem = {
    id: string;
    image?: string;
    title: string;
    subtitle?: string;
    handle?: string;
    gradient?: string;
    borderColor?: string;
};

type Props = {
    items: ChromaItem[];
    className?: string;
    radius?: number;
    columns?: number;
    rows?: number;
    onSelect?: (id: string) => void;
    selectedId?: string | null;
};

export default function ChromaGrid({
                                       items,
                                       className = "",
                                       radius = 260,
                                       columns = 3,
                                       rows = 2,
                                       onSelect,
                                       selectedId = null,
                                   }: Props) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const fadeRef = useRef<HTMLDivElement | null>(null);
    const posRef = useRef({
        current: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
    });
    const rafRef = useRef<number | null>(null);

    // simple lerp loop (no gsap needed)
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const rect = root.getBoundingClientRect();
        posRef.current.current = { x: rect.width / 2, y: rect.height / 2 };
        posRef.current.target = { x: rect.width / 2, y: rect.height / 2 };
        root.style.setProperty("--x", `${posRef.current.current.x}px`);
        root.style.setProperty("--y", `${posRef.current.current.y}px`);

        const tick = () => {
            const { current, target } = posRef.current;
            // eased chase toward target
            current.x += (target.x - current.x) * 0.12;
            current.y += (target.y - current.y) * 0.12;
            root.style.setProperty("--x", `${current.x}px`);
            root.style.setProperty("--y", `${current.y}px`);
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const root = rootRef.current;
        if (!root) return;
        const rect = root.getBoundingClientRect();
        posRef.current.target = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (fadeRef.current) {
            fadeRef.current.style.opacity = "0";
        }
    };

    const handleLeave = () => {
        posRef.current.target = { ...posRef.current.current };
        if (fadeRef.current) {
            fadeRef.current.style.opacity = "1";
        }
    };

    const handleCardMove = (e: React.MouseEvent<HTMLElement>) => {
        const card = e.currentTarget as HTMLElement;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
    };

    const handleSelect = (id: string) => {
        if (onSelect) onSelect(id);
    };

    const normalizedItems = useMemo(
        () =>
            items.map((item, idx) => ({
                ...item,
                gradient:
                    item.gradient ||
                    `linear-gradient(150deg, rgba(183,28,28,0.94), rgba(26,4,4,0.95))`,
                borderColor: item.borderColor || "rgba(255,215,0,0.85)",
                image: item.image || "/resources/mainicon.png",
                key: item.id || `chroma-${idx}`,
            })),
        [items]
    );

    return (
        <div
            ref={rootRef}
            className={`chroma-grid ${className}`}
            style={{
                "--r": `${radius}px`,
            } as React.CSSProperties}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
        >
            {normalizedItems.map((c) => {
                const expanded = selectedId === c.id;
                return (
                    <article
                        key={c.key}
                        className={`chroma-card ${expanded ? "expanded" : ""}`}
                        onMouseMove={handleCardMove}
                        onClick={() => handleSelect(c.id)}
                        style={{
                            "--card-border": c.borderColor,
                            "--card-gradient": c.gradient,
                            cursor: "pointer",
                        } as React.CSSProperties}
                        role="button"
                        aria-pressed={expanded}
                        aria-label={`${c.title} details`}
                    >
                        <div className="chroma-img-wrapper">
                            <img src={c.image} alt={c.title} loading="lazy" />
                        </div>
                        <footer className="chroma-info">
                            <h3 className="name">{c.title}</h3>
                            {c.handle && <span className="handle">{c.handle}</span>}
                            {c.subtitle && <p className="role">{c.subtitle}</p>}
                        </footer>
                    </article>
                );
            })}
            <div className="chroma-overlay" />
            <div ref={fadeRef} className="chroma-fade" />
        </div>
    );
}
