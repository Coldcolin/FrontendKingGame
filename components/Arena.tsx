"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, fileUrl } from "@/lib/api";
import type { GradeResult, Slot } from "@/lib/contracts";
import { compressSnapshot, liveDiff, type LiveDiff } from "@/lib/diff";
import { useCountdown, useMatch } from "@/hooks/useMatch";
import { Canvas } from "./Canvas";
import { CodeEditor } from "./CodeEditor";
import { DiffOverlay } from "./DiffOverlay";
import { PreviewFrame } from "./PreviewFrame";
import { Scoreboard } from "./Scoreboard";
import { AppShell, Button, CenterMessage, Kbd, Panel, plateText } from "./ui";

const other = (s: Slot): Slot => (s === "A" ? "B" : "A");

export function Arena() {
  const { id } = useParams<{ id: string }>();
  const token = useSearchParams().get("t") ?? undefined;
  const router = useRouter();
  const { match, error, activity, clockOffset, you, socket } = useMatch(id, token);
  const seconds = useCountdown(match, clockOffset);

  const [edited, setCode] = useState<string | null>(null);
  const [render, setRender] = useState<string | null>(null);
  const [live, setLive] = useState<LiveDiff | null>(null);
  const [official, setOfficial] = useState<{ result: GradeResult; code: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const lastSnapshot = useRef(0);
  const draftKey = you ? `diffarena:${id}:${you}` : null;

  // Until the player edits, show their saved draft or the starter code.
  const starter = match?.starterCode;
  const initial = useMemo(() => {
    if (starter === undefined || !draftKey) return null;
    try {
      return localStorage.getItem(draftKey) ?? starter;
    } catch {
      return starter;
    }
  }, [starter, draftKey]);
  const code = edited ?? initial;

  // At 0:00 the server is grading; stop edits and checks before it says so.
  const live_ = match?.status === "live" && seconds !== 0;

  // Re-send the latest code whenever the socket (re)connects: server live state is
  // in memory, so after a backend restart it would otherwise grade stale code.
  const resendCode = useEffectEvent(() => {
    if (code !== null) socket.current?.emit("code:update", { code });
  });
  useEffect(() => {
    const s = socket.current;
    if (!s || !live_) return;
    const resend = () => resendCode();
    s.on("connect", resend);
    return () => {
      s.off("connect", resend);
    };
  }, [socket, live_]);

  // Stream code to the server (for the final grade) and keep a local draft.
  useEffect(() => {
    if (code === null || !draftKey) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey, code); } catch {}
      if (live_) socket.current?.emit("code:update", { code });
    }, 300);
    return () => clearTimeout(t);
  }, [code, draftKey, live_, socket]);

  useEffect(() => {
    if (match?.status === "finished") router.replace(`/m/${id}/results`);
  }, [match?.status, id, router]);

  const onRender = async (png: string) => {
    setRender(png);
    // The target stays hidden until the match starts.
    if (!match?.challenge) return;
    const result = await liveDiff(fileUrl(match.challenge.targetUrl), png).catch(() => null);
    if (!result) return;
    setLive(result);
    if (live_ && Date.now() - lastSnapshot.current > 1000) {
      lastSnapshot.current = Date.now();
      const small = await compressSnapshot(png);
      socket.current?.emit("snapshot", { png: small });
    }
  };

  // A render from before the start never reached the server; send it once live.
  const sendInitial = useEffectEvent(() => {
    if (!render || !live) return;
    void compressSnapshot(render).then((png) => socket.current?.emit("snapshot", { png }));
  });
  useEffect(() => {
    if (live_) sendInitial();
  }, [live_]);

  const submitCheck = useCallback(async () => {
    if (!token || code === null || !live_ || submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const r = await api.submit(id, token, code);
      setOfficial({ result: r, code });
      setNotice({ tone: "ok", text: `Diff check scored ${r.score.toFixed(1)}%` });
    } catch (e) {
      setNotice({ tone: "error", text: (e as ApiError).message });
    } finally {
      setSubmitting(false);
    }
  }, [token, code, live_, submitting, id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void submitCheck();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitCheck]);

  if (!token) {
    return (
      <AppShell>
        <CenterMessage title="This link is missing its player key">Ask the host for your player link. Spectators can use the watch link instead.</CenterMessage>
      </AppShell>
    );
  }
  if (error) return <AppShell><CenterMessage title="Can't open this match">{error}</CenterMessage></AppShell>;
  if (!match || you === undefined) return <AppShell><CenterMessage title="Joining match…" /></AppShell>;
  if (you === null) {
    return (
      <AppShell>
        <CenterMessage title="This player link isn't valid for this match">
          Check that you copied the whole link. To follow along without playing, use the watch link.
        </CenterMessage>
      </AppShell>
    );
  }

  const rival = match.players.find((p) => p.slot === other(you))!;
  const challenge = match.challenge;
  const displayUrl = challenge ? fileUrl(challenge.displayUrl) : null;
  // Official callouts apply until the code changes again.
  const diffSource = official && official.code === code ? official.result : live;

  return (
    <AppShell
      header={false}
      footer={
        <>
          <p className="text-[14px] text-muted" role="status">
            {notice ? (
              <span className={notice.tone === "ok" ? "text-paper" : "text-register"}>{notice.text}</span>
            ) : live_ ? (
              <>Changes render as you type. Press <Kbd>⌘ Enter</Kbd> to run an official diff check.</>
            ) : match.status === "lobby" ? (
              "The editor unlocks when the host starts the match."
            ) : (
              "Time's up. Grading final renders…"
            )}
          </p>
          <Button onClick={submitCheck} disabled={!live_ || submitting}>
            {submitting ? "Checking…" : "Submit diff check"}
            <span className="text-[12px] font-medium opacity-70">⌘↵</span>
          </Button>
        </>
      }
    >
      <div className="flex h-full flex-col">
        <Scoreboard
          compact
          match={{ ...match, players: match.players.map((p) => (p.slot === you && live ? { ...p, liveScore: live.score } : p)) }}
          seconds={seconds}
          you={you}
          activity={activity}
        />
        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[1fr_1fr] gap-4 p-4 max-lg:grid-cols-1 max-lg:grid-rows-none max-lg:[&>*]:h-[70vh]">
          <Panel title="Your code" actions={<span>index.html</span>}>
            {code !== null && <CodeEditor value={code} onChange={setCode} onSubmit={submitCheck} readOnly={!live_} />}
          </Panel>

          <Panel title="Target" actions={<span>{challenge ? `${challenge.title}, ` : ""}600 × 400 px</span>}>
            {!challenge || !displayUrl ? (
              <CenterMessage title="The target appears when the match starts">You and {rival.name} see it at the same moment.</CenterMessage>
            ) : (
              <Canvas>
                <img src={displayUrl} alt={`Target: ${challenge.title}`} className="h-full w-full" />
              </Canvas>
            )}
          </Panel>

          {!displayUrl ? (
            <Panel title="Live diff">
              <CenterMessage title="Nothing to compare yet" />
            </Panel>
          ) : (
            <DiffOverlay targetUrl={displayUrl} renderPng={render} diffUrl={diffSource?.diffUrl ? fileUrl(diffSource.diffUrl) : null} regions={diffSource?.regions ?? []} />
          )}

          <Panel
            title="Your preview"
            actions={
              <>
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${render ? "bg-paper" : "bg-rule"}`} />
                  {render ? "Rendered" : "Rendering"}
                </span>
                <span className={`font-expanded text-[20px] ${plateText[you]}`}>{live ? `${live.score.toFixed(1)}%` : "—"}</span>
              </>
            }
          >
            <Canvas>{code !== null && <PreviewFrame code={code} onRender={onRender} />}</Canvas>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
