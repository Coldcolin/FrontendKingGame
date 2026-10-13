import type { Activity, MatchDTO, PlayerDTO, Slot } from "@/lib/contracts";
import { formatClock } from "@/hooks/useMatch";
import { Avatar, Crosshair, plateBg, plateText } from "./ui";

const shown = (p: PlayerDTO) => p.liveScore ?? p.officialScore;

function Side({ player, you, finished, activity, compact }: { player: PlayerDTO; you: boolean; finished: boolean; activity?: Activity; compact?: boolean }) {
  const right = player.slot === "B";
  const score = shown(player);
  return (
    <div className={`flex min-w-0 flex-1 flex-col justify-center ${compact ? "gap-1" : "gap-2"} ${right ? "items-end plate-in-right" : "plate-in-left"}`}>
      <div className={`flex min-w-0 items-center ${compact ? "gap-3 px-4" : "gap-4 px-6"} ${right ? "flex-row-reverse" : ""}`}>
        <Avatar slot={player.slot} name={player.name} url={player.avatarUrl} size={compact ? 32 : 48} />
        <div className={`min-w-0 ${right ? "text-right" : ""}`}>
          <div className={`flex items-center gap-2 ${right ? "flex-row-reverse" : ""}`}>
            <span className="truncate text-[17px] font-semibold">{player.name}</span>
            {you && <span className={`rounded-[2px] px-1.5 py-0.5 text-[11px] font-semibold text-ink ${plateBg[player.slot]}`}>You</span>}
            {!finished && (!player.connected || activity === "typing") && (
              <span className="text-[12px] text-muted">{player.connected ? "Typing" : "Offline"}</span>
            )}
          </div>
          <div className={`flex items-baseline gap-3 ${right ? "flex-row-reverse" : ""}`}>
            <span className={`font-expanded leading-none ${compact ? "text-[24px]" : "text-[38px]"} ${plateText[player.slot]}`}>
              {score == null ? "—" : `${score.toFixed(1)}%`}
            </span>
            {player.officialScore != null && player.liveScore != null && (
              <span className="text-[12px] text-muted">Official {player.officialScore.toFixed(1)}%</span>
            )}
          </div>
        </div>
      </div>
      {/* Track runs from the screen edge to the centre crosshair */}
      <div className={`relative h-1.5 w-full bg-rule/40`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score ?? 0} aria-label={`${player.name} accuracy`}>
        <div
          className={`absolute top-0 h-full transition-[width] duration-700 ease-out ${plateBg[player.slot]} ${right ? "right-0" : "left-0"}`}
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function caption(match: MatchDTO, seconds: number | null, compact?: boolean) {
  if (!compact) return match.status === "lobby" ? "Waiting to start" : match.status === "finished" ? "Final" : "Time left";
  const status = match.status === "lobby" ? "Waiting" : match.status === "live" && seconds !== 0 ? "Live" : "Finished";
  return `${match.code} · ${status}`;
}

export function Scoreboard({
  match,
  seconds,
  you,
  activity = {},
  compact = false,
}: {
  match: MatchDTO;
  seconds: number | null;
  you?: Slot | null;
  activity?: Partial<Record<Slot, Activity>>;
  compact?: boolean;
}) {
  const [a, b] = [match.players.find((p) => p.slot === "A")!, match.players.find((p) => p.slot === "B")!];
  const low = match.status === "live" && seconds != null && seconds <= 60;
  const finished = match.status === "finished";
  return (
    <div className={`flex shrink-0 items-stretch border-b border-rule/60 bg-ink max-md:h-auto max-md:flex-wrap max-md:py-3 ${compact ? "h-20" : "h-28"}`}>
      <Side player={a} you={you === "A"} finished={finished} activity={you === "A" ? undefined : activity.A} compact={compact} />
      <div className="flex w-56 shrink-0 flex-col items-center justify-center gap-1 max-md:order-first max-md:w-full">
        {!compact && <Crosshair size={26} className="text-paper/60" />}
        <span className={`font-expanded leading-none ${compact ? "text-[32px]" : "text-[48px]"} ${low ? "text-register" : ""}`} aria-live="off">
          {formatClock(seconds)}
        </span>
        <span className="text-[12px] text-muted">{caption(match, seconds, compact)}</span>
      </div>
      <Side player={b} you={you === "B"} finished={finished} activity={you === "B" ? undefined : activity.B} compact={compact} />
    </div>
  );
}
