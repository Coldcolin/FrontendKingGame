"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { sandboxDocument } from "@/lib/sandbox";

/**
 * Renders contender code in an opaque-origin sandbox at 600×400 and reports
 * a PNG of the result after each change. Mount it inside <Canvas>.
 */
export function PreviewFrame({ code, onRender }: { code: string; onRender: (png: string) => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const seq = useRef(0);
  const emitRender = useEffectEvent((png: string) => onRender(png));

  const srcDoc = useMemo(() => {
    if (typeof window === "undefined") return "";
    const nonce = crypto.getRandomValues(new Uint32Array(4)).join("");
    return sandboxDocument(window.location.origin, nonce);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      if (e.data?.type === "ready") setReady(true);
      if (e.data?.type === "render" && e.data.id === seq.current) emitRender(e.data.png);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      seq.current += 1;
      ref.current?.contentWindow?.postMessage({ type: "code", id: seq.current, code }, "*");
    }, 300);
    return () => clearTimeout(t);
  }, [code, ready]);

  return (
    <iframe
      ref={ref}
      title="Your render"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className="block h-[400px] w-[600px] border-0 bg-white"
    />
  );
}
