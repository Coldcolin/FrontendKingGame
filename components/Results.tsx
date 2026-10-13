"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError, fileUrl } from "@/lib/api";
import type { GradeResult, MatchDTO, Slot } from "@/lib/contracts";
import { calloutText } from "@/lib/diff";
import { Canvas } from "./Canvas";
import { Scoreboard } from "./Scoreboard";
import { AppShell, CenterMessage, Panel, plateText } from "./ui";

function Final({ match, slot, final }: { match: MatchDTO; slot: Slot; final?: GradeResult }) {
  const p = match.players.find((pl) => pl.slot === slot)!;
  return (
    <Panel
      title={<span className={plateText[slot]}>{p.name}</span>}
      actions={
        p.didNotStart ? (
          <span className="text-[14px] text-muted">Did not start</span>
        ) : (
          final && <span className={`font-expanded text-[20px] ${plateText[slot]}`}>{final.score.toFixed(1)}%</span>
        )
      }
      bodyClassName="flex flex-col"
    >
      {final ? (
        <>
          <div className="min-h-0 flex-1">
            <Canvas>
              <img src={fileUrl(final.renderUrl)} alt={`${p.name}'s final render`} className="absolute inset-0 h-full w-full" />
              <img src={fileUrl(final.diffUrl)} alt="" className="absolute inset-0 h-full w-full opacity-60 mix-blend-multiply" />
            </Canvas>
          </div>
          <ul className="shrink-0 space-y-1 border-t border-rule/60 px-4 py-3 text-[13px] text-muted">
            {final.regions.length ? final.regions.map((r, i) => <li key={i}>{calloutText(r)} at {r.x}, {r.y}</li>) : <li>No significant differences.</li>}
          </ul>
        </>
      ) : (
        <CenterMessage title="No final render" />
      )}
    </Panel>
  );
}

export function Results() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ match: MatchDTO; finals: GradeResult[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.results(id).then(setData, (e: ApiError) => setError(e.message));
  }, [id]);

  if (error) return <AppShell><CenterMessage title="Can't load results">{error}</CenterMessage></AppShell>;
  if (!data) return <AppShell><CenterMessage title="Loading results…" /></AppShell>;
  const { match, finals } = data;
  if (match.status !== "finished" || !match.challenge) {
    return <AppShell><CenterMessage title="This match isn't over yet"><Link className="underline" href={`/m/${id}/watch`}>Watch it live</Link></CenterMessage></AppShell>;
  }

  const winner = match.players.find((p) => p.slot === match.winner);
  const finalFor = (s: Slot) => finals.find((f) => f.slot === s);

  return (
    <AppShell
      nav={<span className="text-[14px] text-muted">Match {match.code} results</span>}
      footer={
        <>
          <p className="text-[15px]">
            {winner ? <><span className={`font-semibold ${plateText[winner.slot]}`}>{winner.name}</span> wins.</> : "It's a tie."}
          </p>
          <Link href="/admin/new" className="inline-flex h-10 items-center rounded-[2px] bg-register px-5 text-[15px] font-semibold text-ink">
            Set up a new match
          </Link>
        </>
      }
    >
      <div className="flex h-full flex-col">
        <Scoreboard match={{ ...match, players: match.players.map((p) => ({ ...p, liveScore: null })) }} seconds={0} />
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 p-4 max-lg:grid-cols-1 max-lg:[&>*]:h-[60vh]">
          <Final match={match} slot="A" final={finalFor("A")} />
          <Panel title="Target" actions={<span>{match.challenge.title}</span>}>
            <Canvas>
              <img src={fileUrl(match.challenge.displayUrl)} alt={`Target: ${match.challenge.title}`} className="h-full w-full" />
            </Canvas>
          </Panel>
          <Final match={match} slot="B" final={finalFor("B")} />
        </div>
      </div>
    </AppShell>
  );
}
