"use client";

import { useState } from "react";
import type { Region } from "@/lib/contracts";
import { calloutText } from "@/lib/diff";
import { Canvas } from "./Canvas";
import { Panel } from "./ui";

/** Target under the contender's render with an opacity slider; optional diff mask + callouts. */
export function DiffOverlay({
  targetUrl,
  renderPng,
  diffUrl,
  regions,
}: {
  targetUrl: string;
  renderPng: string | null;
  diffUrl: string | null;
  regions: Region[];
}) {
  const [opacity, setOpacity] = useState(50);
  const [showDiff, setShowDiff] = useState(false);

  return (
    <Panel
      title="Live diff"
      actions={
        <>
          <label className="flex items-center gap-2">
            Your render
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-28 accent-register"
              aria-label="Your render opacity"
            />
            <span className="w-9 tabular-nums text-paper">{opacity}%</span>
          </label>
          <button
            type="button"
            aria-pressed={showDiff}
            onClick={() => setShowDiff((v) => !v)}
            className={`h-7 rounded-[2px] border px-2.5 ${showDiff ? "border-register bg-register text-ink" : "border-rule text-paper hover:bg-ink-2"}`}
          >
            Diff pixels
          </button>
        </>
      }
    >
      <div className="relative h-full">
        <Canvas>
          <img src={targetUrl} alt="Target" className="absolute inset-0 h-full w-full" crossOrigin="anonymous" />
          {renderPng && <img src={renderPng} alt="Your render" className="absolute inset-0 h-full w-full" style={{ opacity: opacity / 100 }} />}
          {showDiff && diffUrl && <img src={diffUrl} alt="Pixel differences" className="absolute inset-0 h-full w-full mix-blend-multiply" />}
          {regions.map((r, i) => (
            <div key={i} className="pointer-events-none absolute border-2 border-register" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
              {/* Label the two largest regions only: first above its box, second below. */}
              {i < 2 && (
                <span
                  className={`absolute left-[-2px] whitespace-nowrap bg-register px-2.5 py-1 text-[20px] font-semibold text-ink ${
                    (i === 0 && r.y >= 48) || r.y + r.h > 352 ? "bottom-full mb-1" : "top-full mt-1"
                  }`}
                >
                  {calloutText(r)}
                </span>
              )}
            </div>
          ))}
        </Canvas>
        {!renderPng && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[13px] text-muted">
            Start typing — your render appears here over the target.
          </p>
        )}
      </div>
    </Panel>
  );
}
