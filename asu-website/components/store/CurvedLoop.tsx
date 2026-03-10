"use client";

import { useRef, useEffect, useState, useMemo, useId, FC, PointerEvent } from "react";
import "./CurvedLoop.css";

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
  direction?: "left" | "right";
  interactive?: boolean;
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = "",
  speed = 2,
  className,
  curveAmount = 400,
  direction = "left",
  interactive = true,
}) => {
  const statements = useMemo(() => {
    const parsed = marqueeText
      .split("✦")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    if (parsed.length > 0) return parsed;
    const fallback = marqueeText.trim();
    return fallback ? [fallback] : ["ASU STORE"];
  }, [marqueeText]);

  const unitText = useMemo(
    () => statements.map((segment) => `${segment}\u00A0✦\u00A0`).join(""),
    [statements]
  );

  const measureRef = useRef<SVGTextElement | null>(null);
  const textPathRef = useRef<SVGTextPathElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [spacing, setSpacing] = useState(0);
  const [offset, setOffset] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  const baseY = isMobile ? 52 : 40;
  const effectiveCurveAmount = isMobile ? Math.min(curveAmount, 130) : curveAmount;
  const pathD = `M-100,${baseY} Q720,${baseY + effectiveCurveAmount} 1540,${baseY}`;

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef<"left" | "right">(direction);
  const velRef = useRef(0);

  const textLength = spacing;
  const cycleCount = textLength ? Math.ceil(1800 / textLength) + 2 : 2;
  const totalStatements = cycleCount * statements.length;
  const ready = spacing > 0;
  const isInteractive = interactive && !isMobile;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(query.matches);
    update();
    if ("addEventListener" in query) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    const legacyQuery = query as MediaQueryList & {
      addListener: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
      removeListener: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
    };
    const legacyListener = ((_: MediaQueryListEvent) => update()) as (
      this: MediaQueryList,
      ev: MediaQueryListEvent
    ) => void;
    legacyQuery.addListener(legacyListener);
    return () => legacyQuery.removeListener(legacyListener);
  }, []);

  useEffect(() => {
    if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
  }, [unitText, className]);

  useEffect(() => {
    if (!spacing) return;
    if (textPathRef.current) {
      const initial = -spacing;
      textPathRef.current.setAttribute("startOffset", initial + "px");
      setOffset(initial);
    }
  }, [spacing]);

  useEffect(() => {
    if (!spacing || !ready) return;
    let frame = 0;
    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === "right" ? speed : -speed;
        const currentOffset = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
        let newOffset = currentOffset + delta;
        const wrapPoint = spacing;
        if (newOffset <= -wrapPoint) newOffset += wrapPoint;
        if (newOffset > 0) newOffset -= wrapPoint;
        textPathRef.current.setAttribute("startOffset", newOffset + "px");
        setOffset(newOffset);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed, ready]);

  const onPointerDown = (e: PointerEvent) => {
    if (!isInteractive) return;
    dragRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isInteractive || !dragRef.current || !textPathRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;
    const currentOffset = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
    let newOffset = currentOffset + dx;
    const wrapPoint = spacing;
    if (newOffset <= -wrapPoint) newOffset += wrapPoint;
    if (newOffset > 0) newOffset -= wrapPoint;
    textPathRef.current.setAttribute("startOffset", newOffset + "px");
    setOffset(newOffset);
  };

  const endDrag = () => {
    if (!isInteractive) return;
    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? "right" : "left";
  };

  // eslint-disable-next-line react-hooks/refs
  const cursorStyle = isInteractive ? (dragRef.current ? "grabbing" : "grab") : "auto";

  return (
    <div
      className="curved-loop-jacket"
      style={{ visibility: ready ? "visible" : "hidden", cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg className="curved-loop-svg" viewBox="0 0 1440 120">
        <text ref={measureRef} xmlSpace="preserve" style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}>
          {unitText}
        </text>
        <defs>
          <path ref={pathRef} id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>
        {ready && (
          <text fontWeight="bold" xmlSpace="preserve" className={className}>
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset={offset + "px"} xmlSpace="preserve">
              {Array.from({ length: totalStatements }).map((_, index) => (
                <tspan key={index} fill="#ffffff">
                  {`${statements[index % statements.length]}\u00A0✦\u00A0`}
                </tspan>
              ))}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
};

export default CurvedLoop;
