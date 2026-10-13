"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * A 600×400 canvas scaled to fit its container, centred on the mat grid with
 * crop marks at the canvas corners. Children are laid out at true 600×400.
 */
export function Canvas({ children, padding = 24, grid = true, label }: { children: ReactNode; padding?: number; grid?: boolean; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth - padding * 2;
      const h = el.clientHeight - padding * 2;
      setScale(Math.max(0.05, Math.min(w / 600, h / 400)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [padding]);

  return (
    <div ref={ref} className={`relative flex h-full w-full items-center justify-center overflow-hidden ${grid ? "mat-grid" : ""}`}>
      <div className="crop-marks relative" style={{ width: 600 * scale, height: 400 * scale, visibility: scale ? "visible" : "hidden" }}>
        <div className="absolute left-0 top-0 h-[400px] w-[600px] origin-top-left overflow-hidden bg-white" style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
      {label && <span className="absolute bottom-2 right-3 text-[12px] text-muted">{label}</span>}
    </div>
  );
}
