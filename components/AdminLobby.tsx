"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api, ApiError, fileUrl } from "@/lib/api";
import type { ChallengeDTO, CreateMatchResponse, PlayerDTO } from "@/lib/contracts";
import { useCountdown, useMatch } from "@/hooks/useMatch";
import { linksKey } from "./AdminSetup";
import { Canvas } from "./Canvas";
import { Scoreboard } from "./Scoreboard";
import { AppShell, Avatar, Button, CenterMessage, Panel, plateText } from "./ui";

function LinkRow({ label, path, accent }: { label: string; path: string; accent?: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`text-[13px] ${accent ?? "text-muted"}`}>{label}</span>
      <div className="flex gap-2">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className="h-10 min-w-0 flex-1 rounded-[2px] border border-rule bg-ink-2 px-3 text-[13px] text-paper" aria-label={label} />
        <Button
          variant="secondary"
          className="w-24"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function Presence({ p }: { p: PlayerDTO }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar slot={p.slot} name={p.name} url={p.avatarUrl} size={40} />
      <div>
        <p className={`font-semibold ${plateText[p.slot]}`}>{p.name}</p>
        <p className="text-[13px] text-muted">{p.connected ? "Joined" : "Not joined yet"}</p>
      </div>
    </div>
  );
}

export function AdminLobby() {
  const { id } = useParams<{ id: string }>();
  const key = useSearchParams().get("k") ?? "";
  const { match, setMatch, error, clockOffset } = useMatch(id);
  const seconds = useCountdown(match, clockOffset);
  const [links, setLinks] = useState<CreateMatchResponse["links"] | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  // Only the admin check reveals the target before the start.
  const [hostChallenge, setHostChallenge] = useState<ChallengeDTO | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.checkAdmin(id, key).then(
      (r) => {
        setValid(r.valid);
        setHostChallenge(r.challenge);
        try {
          const raw = localStorage.getItem(linksKey(id));
          if (raw) setLinks(JSON.parse(raw));
        } catch {}
      },
      () => setValid(false),
    );
  }, [id, key]);

  if (error) return <AppShell><CenterMessage title="Can't open this match">{error}</CenterMessage></AppShell>;
  if (!match || valid === null) return <AppShell><CenterMessage title="Loading match…" /></AppShell>;
  if (!valid) return <AppShell><CenterMessage title="This admin link isn't valid">Only the link created with the match can start it.</CenterMessage></AppShell>;

  const both = match.players.every((p) => p.connected);
  const challenge = match.challenge ?? hostChallenge;

  async function start() {
    setStarting(true);
    setStartError(null);
    try {
      setMatch(await api.start(id, key));
    } catch (e) {
      setStartError((e as ApiError).message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <AppShell
      nav={<span className="text-[14px] text-muted">Match {match.code}</span>}
      footer={
        <>
          <p className="text-[14px] text-muted" role="status">
            {startError ? (
              <span className="text-register">{startError}</span>
            ) : match.status === "lobby" ? (
              both ? "Both contenders are in. Start when you're ready." : "You can start before both contenders join — the clock runs either way."
            ) : match.status === "live" ? (
              "The match is live."
            ) : (
              "The match is over."
            )}
          </p>
          {match.status === "lobby" ? (
            <Button onClick={start} disabled={starting}>{starting ? "Starting…" : "Start match"}</Button>
          ) : (
            <Link href={match.status === "live" ? `/m/${id}/watch` : `/m/${id}/results`} className="inline-flex h-10 items-center rounded-[2px] bg-register px-5 text-[15px] font-semibold text-ink">
              {match.status === "live" ? "Watch match" : "See results"}
            </Link>
          )}
        </>
      }
    >
      <div className="flex h-full flex-col">
        <Scoreboard match={match} seconds={seconds} />
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(380px,2fr)_3fr] gap-6 p-6 max-lg:grid-cols-1">
          <Panel title="Share links" bodyClassName="flex flex-col gap-6 overflow-auto p-6">
            {links ? (
              <>
                <LinkRow label={`${match.players[0].name}'s player link`} path={links.a} accent="text-plate-a" />
                <LinkRow label={`${match.players[1].name}'s player link`} path={links.b} accent="text-plate-b" />
                <LinkRow label="Spectator link" path={links.spectator} />
                <p className="text-[13px] text-muted">Player links are private — each one lets someone code as that contender.</p>
              </>
            ) : (
              <p className="text-muted">Player links are only shown in the browser that created this match. Spectators can use /m/{id}/watch.</p>
            )}
            <div className="mt-auto flex flex-col gap-4 border-t border-rule/60 pt-5">
              {match.players.map((p) => <Presence key={p.slot} p={p} />)}
            </div>
          </Panel>
          <Panel title="Target" actions={challenge && <span>{challenge.title}, 600 × 400 px</span>} className="max-lg:h-[60vh]">
            {challenge ? (
              <Canvas padding={40}>
                <img src={fileUrl(challenge.displayUrl)} alt={`Target: ${challenge.title}`} className="h-full w-full" />
              </Canvas>
            ) : (
              <CenterMessage title="Loading target…" />
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
