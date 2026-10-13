"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, fileUrl } from "@/lib/api";
import type { ChallengeDTO, Slot } from "@/lib/contracts";
import { Canvas } from "./Canvas";
import { AppShell, Avatar, Button, Crosshair, Panel, plateBorder, plateText } from "./ui";

interface Contender {
  name: string;
  handle: string;
  avatarUrl?: string;
}

const DURATIONS = [
  { label: "10 min", sec: 600 },
  { label: "15 min", sec: 900 },
  { label: "20 min", sec: 1200 },
  { label: "30 min", sec: 1800 },
  { label: "40 min", sec: 2400 },
  { label: "1 hour", sec: 3600 },
];

export const linksKey = (id: string) => `diffarena:links:${id}`;

function ContenderRow({ slot, value, onChange }: { slot: Slot; value: Contender; onChange: (c: Contender) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameId = `name-${slot}`;
  const handleId = `handle-${slot}`;

  async function upload(f: File) {
    setUploading(true);
    setError(null);
    try {
      const { url } = await api.uploadAvatar(f);
      onChange({ ...value, avatarUrl: url });
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-end gap-4 max-sm:items-start">
      <button
        type="button"
        onClick={() => file.current?.click()}
        className={`group relative flex h-16 w-16 shrink-0 items-center justify-center border-2 border-dashed ${plateBorder[slot]} text-[12px] text-muted hover:text-paper`}
        aria-label={`Upload avatar for contender ${slot}`}
      >
        {value.avatarUrl ? <Avatar slot={slot} name={value.name} url={value.avatarUrl} size={60} /> : uploading ? "Uploading" : "Avatar"}
      </button>
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <div className="grid min-w-0 flex-1 grid-cols-[3fr_2fr] gap-3 max-sm:grid-cols-1">
        <label htmlFor={nameId} className="flex flex-col gap-1.5 text-[13px] text-muted">
          Contender {slot}
          <input
            id={nameId}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder={slot === "A" ? "Alex Rivera" : "Sarah Chen"}
            maxLength={40}
            required
            className="h-10 rounded-[2px] border border-rule bg-ink-2 px-3 text-[15px] text-paper placeholder:text-paper/30"
          />
        </label>
        <label htmlFor={handleId} className="flex flex-col gap-1.5 text-[13px] text-muted">
          Handle
          <input
            id={handleId}
            value={value.handle}
            onChange={(e) => onChange({ ...value, handle: e.target.value })}
            placeholder={slot === "A" ? "@arivera" : "@schen"}
            maxLength={40}
            className={`h-10 rounded-[2px] border border-rule bg-ink-2 px-3 text-[15px] placeholder:text-paper/30 ${plateText[slot]}`}
          />
        </label>
      </div>
      {error && <p className="text-[13px] text-register">{error}</p>}
    </div>
  );
}

export function AdminSetup() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeDTO[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [players, setPlayers] = useState<Record<Slot, Contender>>({ A: { name: "", handle: "" }, B: { name: "", handle: "" } });
  const [duration, setDuration] = useState(600);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.challenges().then(
      (list) => {
        setChallenges(list);
        setSelected((s) => s ?? list[0]?.id ?? null);
      },
      (e: ApiError) => setLoadError(e.message),
    );
  }, []);

  async function uploadTarget(f: File) {
    setUploading(true);
    setFormError(null);
    try {
      const c = await api.uploadChallenge(f);
      setChallenges((list) => [...(list ?? []), c]);
      setSelected(c.id);
    } catch (e) {
      setFormError((e as ApiError).message);
    } finally {
      setUploading(false);
    }
  }

  async function launch() {
    setFormError(null);
    if (!players.A.name.trim() || !players.B.name.trim()) return setFormError("Enter a name for both contenders.");
    if (!selected) return setFormError("Pick a target for the match.");
    setLaunching(true);
    try {
      const { match, links } = await api.createMatch({
        challengeId: selected,
        durationSec: duration,
        players: (["A", "B"] as const).map((s) => ({
          name: players[s].name.trim(),
          handle: players[s].handle.trim() || undefined,
          avatarUrl: players[s].avatarUrl,
        })),
      });
      try { localStorage.setItem(linksKey(match.id), JSON.stringify(links)); } catch {}
      router.push(links.admin);
    } catch (e) {
      setFormError((e as ApiError).message);
      setLaunching(false);
    }
  }

  const current = challenges?.find((c) => c.id === selected);

  return (
    <AppShell
      nav={<span className="text-[14px] text-muted">Set up a match</span>}
      footer={
        <>
          <p className="text-[14px] text-muted" role="status">
            {formError ? <span className="text-register">{formError}</span> : "You'll get a link for each contender and one for spectators."}
          </p>
          <Button onClick={launch} disabled={launching || !challenges}>
            {launching ? "Launching…" : "Launch match"}
          </Button>
        </>
      }
    >
      <div className="grid h-full grid-cols-[minmax(380px,2fr)_3fr] gap-6 p-6 max-lg:grid-cols-1">
        <div className="flex min-h-0 flex-col gap-6">
          <Panel title="Contenders" className="flex-1" bodyClassName="flex flex-col overflow-auto p-6">
            <div className="mb-auto">
              <h1 className="text-[28px] font-semibold leading-tight">New match</h1>
              <p className="mt-1 text-muted">Pick two contenders and a target. Setup takes under a minute.</p>
            </div>
            <div className="my-8 flex flex-col">
              <ContenderRow slot="A" value={players.A} onChange={(c) => setPlayers((p) => ({ ...p, A: c }))} />
              {/* Cyan and magenta rules meet at the registration mark */}
              <div className="flex items-center gap-4 py-3 pl-[31px]" aria-hidden>
                <div className="flex flex-col items-center">
                  <span className="h-6 w-px bg-plate-a" />
                  <Crosshair size={28} className="text-paper/70" />
                  <span className="h-6 w-px bg-plate-b" />
                </div>
                <span className="font-expanded text-[22px] text-paper/80">VS</span>
              </div>
              <ContenderRow slot="B" value={players.B} onChange={(c) => setPlayers((p) => ({ ...p, B: c }))} />
            </div>
            <div className="mt-auto border-t border-rule/60 pt-5">
              <p className="mb-2 text-[13px] text-muted" id="duration-label">Match length</p>
              <div className="grid grid-cols-3 gap-1 rounded-[2px] bg-ink-2 p-1" role="radiogroup" aria-labelledby="duration-label">
                {DURATIONS.map((d) => (
                  <button
                    key={d.sec}
                    role="radio"
                    aria-checked={duration === d.sec}
                    onClick={() => setDuration(d.sec)}
                    className={`h-10 rounded-[2px] text-[15px] ${duration === d.sec ? "border-2 border-register text-paper" : "text-muted hover:text-paper"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <Panel
          title="Select target"
          actions={current && <span>{current.title}, 600 × 400 px</span>}
          bodyClassName="flex flex-col"
          className="max-lg:h-[80vh]"
        >
          <div className="grid shrink-0 grid-cols-4 gap-4 border-b border-rule/60 p-5 max-md:grid-cols-2" role="radiogroup" aria-label="Target">
            {loadError && <p className="col-span-4 text-register">{loadError}</p>}
            {!challenges && !loadError && <p className="col-span-4 text-muted">Loading targets…</p>}
            {challenges?.map((c) => {
              const on = c.id === selected;
              return (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelected(c.id)}
                  className={`relative flex flex-col overflow-hidden rounded-[2px] border text-left ${on ? "border-2 border-register" : "border-rule hover:border-paper/50"}`}
                >
                  <img src={fileUrl(c.displayUrl)} alt="" className="aspect-[3/2] w-full bg-white object-cover" />
                  <span className={`px-3 py-2 text-[13px] ${on ? "text-paper" : "text-muted"}`}>{c.title}</span>
                  {on && <span className="absolute right-2 top-2 bg-register px-1.5 py-0.5 text-[11px] font-semibold text-ink">Selected</span>}
                </button>
              );
            })}
            {challenges && (
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                disabled={uploading}
                className="flex aspect-[3/2] flex-col items-center justify-center gap-1 self-start rounded-[2px] border border-dashed border-rule text-[13px] text-muted hover:border-paper/50 hover:text-paper"
              >
                <span className="text-[22px] leading-none">+</span>
                {uploading ? "Uploading…" : "Upload PNG or SVG"}
              </button>
            )}
            <input ref={uploadRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && uploadTarget(e.target.files[0])} />
          </div>
          <div className="min-h-0 flex-1">
            {current ? (
              <Canvas padding={40} label="600 × 400 px">
                <img src={fileUrl(current.displayUrl)} alt={`Target preview: ${current.title}`} className="h-full w-full" />
              </Canvas>
            ) : (
              <div className="mat-grid h-full" />
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
