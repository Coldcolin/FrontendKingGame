"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fileUrl } from "@/lib/api";
import type { PlayerDTO } from "@/lib/contracts";
import { useCountdown, useMatch, type Snapshot } from "@/hooks/useMatch";
import type { Activity } from "@/lib/contracts";
import { Canvas } from "./Canvas";
import { Scoreboard } from "./Scoreboard";
import { AppShell, CenterMessage, Panel, plateText } from "./ui";

function PlayerCanvas({ p, snap, activity }: { p: PlayerDTO; snap?: Snapshot; activity?: Activity }) {
  return (
    <Panel
      title={<span className={plateText[p.slot]}>{p.name}</span>}
      actions={<span>{activity === "typing" ? "Typing" : p.connected ? "Idle" : "Offline"}</span>}
    >
      {snap ? (
        <Canvas>
          <img src={snap.png} alt={`${p.name}'s current render`} className="h-full w-full" />
        </Canvas>
      ) : (
        <CenterMessage title={`${p.name} hasn't rendered yet`} />
      )}
    </Panel>
  );
}

export function Spectate() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { match, error, snapshots, activity, clockOffset } = useMatch(id);
  const seconds = useCountdown(match, clockOffset);

  useEffect(() => {
    if (match?.status === "finished") router.replace(`/m/${id}/results`);
  }, [match?.status, id, router]);

  if (error) return <AppShell><CenterMessage title="Can't open this match">{error}</CenterMessage></AppShell>;
  if (!match) return <AppShell><CenterMessage title="Loading match…" /></AppShell>;

  const [a, b] = match.players;
  return (
    <AppShell nav={<span className="text-[14px] text-muted">Watching match {match.code}</span>}>
      <div className="flex h-full flex-col">
        <Scoreboard match={match} seconds={seconds} activity={activity} />
        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[1fr_1fr] gap-4 p-4 max-lg:grid-cols-1 max-lg:grid-rows-none max-lg:[&>*]:h-[60vh]">
          <PlayerCanvas p={a} snap={snapshots.A} activity={activity.A} />
          <PlayerCanvas p={b} snap={snapshots.B} activity={activity.B} />
          <Panel title="Target" actions={<span>{match.challenge?.title ?? "Revealed at the start"}</span>} className="col-span-2 max-lg:col-span-1">
            {!match.challenge ? (
              <CenterMessage title="Waiting for the host to start the match" />
            ) : (
              <Canvas>
                <img src={fileUrl(match.challenge.displayUrl)} alt={`Target: ${match.challenge.title}`} className="h-full w-full" />
              </Canvas>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
