"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL, api, ApiError } from "@/lib/api";
import type { Activity, ClientToServer, MatchDTO, ServerToClient, Slot } from "@/lib/contracts";

export interface Snapshot {
  png: string;
  liveScore: number;
  activity: Activity;
}

type MatchSocket = Socket<ServerToClient, ClientToServer>;

/** Loads a match and keeps it live over Socket.IO. `token` joins as a player. */
export function useMatch(matchId: string, token?: string) {
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Partial<Record<Slot, Snapshot>>>({});
  const [scores, setScores] = useState<Partial<Record<Slot, { liveScore: number; activity: Activity }>>>({});
  const [clockOffset, setClockOffset] = useState(0);
  /** undefined until the socket says who we are; null = spectator */
  const [you, setYou] = useState<Slot | null | undefined>(undefined);
  const socketRef = useRef<MatchSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apply = (m: MatchDTO) => {
      if (cancelled) return;
      setMatch(m);
      setClockOffset(new Date(m.serverNow).getTime() - Date.now());
    };
    let loaded = false;
    api.match(matchId).then(
      (m) => {
        loaded = true;
        apply(m);
      },
      (e: ApiError) => !cancelled && setError(e.message),
    );

    const socket: MatchSocket = io(API_URL, { auth: { matchId, token }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("session", ({ slot }) => !cancelled && setYou(slot));
    // socket.io keeps retrying; only surface it when the REST load never worked either.
    socket.on("connect_error", () => {
      if (!cancelled && !loaded) setError(`Can't reach the DiffArena server at ${API_URL}. It may be waking up — try again in a minute.`);
    });
    socket.on("match:state", apply);
    socket.on("match:ended", apply);
    socket.on("player:score", ({ slot, ...score }) => setScores((s) => ({ ...s, [slot]: score })));
    socket.on("player:snapshot", ({ slot, ...snap }) => setSnapshots((s) => ({ ...s, [slot]: snap })));
    socket.on("player:activity", ({ slot, activity }) =>
      setScores((s) => (s[slot] ? { ...s, [slot]: { ...s[slot]!, activity } } : s)),
    );
    return () => {
      cancelled = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId, token]);

  // player:score events are fresher than the last match:state broadcast.
  const withLive =
    match && {
      ...match,
      players: match.players.map((p) => (scores[p.slot] ? { ...p, liveScore: scores[p.slot]!.liveScore } : p)),
    };
  const activity: Partial<Record<Slot, Activity>> = { A: scores.A?.activity, B: scores.B?.activity };

  return { match: withLive, setMatch, error, snapshots, activity, clockOffset, you, socket: socketRef };
}

/** Seconds left on the match clock, corrected for server clock offset. */
export function useCountdown(match: MatchDTO | null, clockOffset: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (match?.status !== "live") return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [match?.status]);
  if (!match) return null;
  if (match.status === "lobby") return match.durationSec;
  if (match.status === "finished" || !match.endsAt) return 0;
  return Math.max(0, Math.ceil((new Date(match.endsAt).getTime() - (now + clockOffset)) / 1000));
}

export const formatClock = (sec: number | null) =>
  sec == null ? "--:--" : `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
