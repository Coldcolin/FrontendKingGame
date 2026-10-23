"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError, hostToken } from "@/lib/api";
import { AppShell, Button, Panel } from "./ui";

export function HostLogin({ onSignedIn, expired }: { onSignedIn: () => void; expired?: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    if (!password) return setError("Enter the host password.");
    setBusy(true);
    setError(null);
    try {
      const { token } = await api.login(password);
      hostToken.set(token);
      onSignedIn();
    } catch (err) {
      setError((err as ApiError).message);
      setBusy(false);
    }
  }

  return (
    <AppShell nav={<span className="text-[14px] text-muted">Set up a match</span>}>
      <div className="mat-grid flex h-full items-center justify-center p-6">
        <Panel title="Host sign-in" className="w-full max-w-md" bodyClassName="p-6">
          <form onSubmit={signIn} className="flex flex-col gap-5">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight">Sign in to host</h1>
              <p className="mt-1 text-muted">
                {expired ? "Your session ended. Sign in again to launch the match." : "Only the host can set up matches."}
              </p>
            </div>
            <label htmlFor="host-password" className="flex flex-col gap-1.5 text-[13px] text-muted">
              Password
              <input
                id="host-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-[2px] border border-rule bg-ink-2 px-3 text-[15px] text-paper"
              />
            </label>
            <div className="flex items-center justify-between gap-4">
              <p className="text-[13px] text-register" role="status">{error}</p>
              <Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
            </div>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
