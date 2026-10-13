import type { ChallengeDTO, CreateMatchResponse, GradeResult, MatchDTO } from "./contracts";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Backend-relative file paths (/files/...) to absolute URLs; data: and absolute URLs pass through. */
export const fileUrl = (p: string) => (p.startsWith("/") ? `${API_URL}${p}` : p);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(0, `Can't reach the DiffArena server at ${API_URL}. Check that the backend is running.`);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Something went wrong. Try again.");
  return body as T;
}

const json = (method: string, body: unknown, headers: Record<string, string> = {}): RequestInit => ({
  method,
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});

export const api = {
  challenges: () => call<ChallengeDTO[]>("/api/challenges"),
  uploadChallenge: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return call<ChallengeDTO>("/api/challenges", { method: "POST", body: form });
  },
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return call<{ url: string }>("/api/uploads/avatar", { method: "POST", body: form });
  },
  createMatch: (input: {
    challengeId: string;
    durationSec: number;
    players: { name: string; handle?: string; avatarUrl?: string }[];
  }) => call<CreateMatchResponse>("/api/matches", json("POST", input)),
  match: (id: string) => call<MatchDTO>(`/api/matches/${id}`),
  checkAdmin: (id: string, key: string) =>
    call<{ valid: boolean; challenge: ChallengeDTO | null }>(`/api/matches/${id}/admin`, { headers: { "x-admin-key": key } }),
  start: (id: string, key: string) =>
    call<MatchDTO>(`/api/matches/${id}/start`, { method: "POST", headers: { "x-admin-key": key } }),
  submit: (id: string, token: string, code: string) =>
    call<GradeResult>(`/api/matches/${id}/submit`, json("POST", { code }, { "x-player-token": token })),
  results: (id: string) => call<{ match: MatchDTO; finals: GradeResult[] }>(`/api/matches/${id}/results`),
};
