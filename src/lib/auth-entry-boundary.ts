const GOOGLE_PENDING_TTL = 5 * 60 * 1000;
export const authRedirectScheme = process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT === "1" ? "jobeen-security-pilot" : "jobin";

function callbackSuffix(url: string | null, scheme: string) {
  if (!url || url.length > 4096 || (scheme !== "jobin" && scheme !== "jobeen-security-pilot")) return null;
  const prefix = scheme + ":";
  if (!url.startsWith(prefix)) return null;
  // GoTrue's net/url serialization omits // for an empty authority and path.
  const suffix = url.slice(prefix.length);
  return suffix.startsWith("//") ? suffix.slice(2) : suffix;
}

export function isGoogleCallbackUrl(url: string | null, scheme = authRedirectScheme) {
  const suffix = callbackSuffix(url, scheme);
  // Only the empty-host OAuth redirect. Normal app links cannot terminate an attempt.
  return suffix !== null && /^\/?[?#]/.test(suffix)
    && /[?&#](?:code|error|error_code|error_description)(?:=|[&#]|$)/.test(suffix);
}

export function parseGoogleCallback(url: string | null, scheme = authRedirectScheme): string | null {
  const suffix = callbackSuffix(url, scheme);
  const match = suffix === null ? null : /^\/?\?code=([A-Za-z0-9_%.-]{1,2048})$/.exec(suffix);
  if (!match) return null;
  try {
    const code = decodeURIComponent(match[1]);
    return /^[A-Za-z0-9_-]{1,512}$/.test(code) ? code : null;
  } catch { return null; }
}

type PendingGoogleStore = {
  readDeadline(): Promise<number>;
  writeDeadline(deadline: number): Promise<void>;
  clear(): Promise<void>;
};
type Lease = { kind: "exclusive" | "google-start" | "google-pending" | "google-exchange"; deadline: number };

export function createAuthEntryBoundary(now = Date.now, pending?: PendingGoogleStore) {
  let active: Lease | null = null;
  let canRestore = true;

  function withinWindow(deadline: number | undefined) {
    const current = now();
    return deadline !== undefined && deadline > current && deadline <= current + GOOGLE_PENDING_TTL;
  }

  function begin(kind: "exclusive" | "google-start", replacePendingGoogle: boolean) {
    if (active?.kind === "google-pending" && (replacePendingGoogle || !withinWindow(active.deadline))) active = null;
    if (active) throw Error("Hay un acceso en proceso. Finalízalo o vuelve a intentar cuando caduque.");
    canRestore = false;
    const lease: Lease = { kind, deadline: 0 };
    active = lease;
    return lease;
  }

  return {
    async exclusive<T>(action: () => Promise<T>, { replacePendingGoogle = false } = {}): Promise<T> {
      const lease = begin("exclusive", replacePendingGoogle);
      try {
        return await action();
      } finally { if (active === lease) active = null; }
    },

    async google(action: (ready: () => Promise<void>) => Promise<void>, { replacePendingGoogle = false } = {}) {
      const lease = begin("google-start", replacePendingGoogle);
      try {
        if (replacePendingGoogle) await pending?.clear();
        await action(async () => {
          if (active !== lease || lease.kind !== "google-start") throw Error("Acceso no disponible.");
          lease.deadline = now() + GOOGLE_PENDING_TTL;
          await pending?.writeDeadline(lease.deadline);
          lease.kind = "google-pending";
        });
        if (lease.kind === "google-start") throw Error("Acceso no disponible.");
      } catch (error) {
        // A delayed browser failure belongs only to its own attempt.
        if (active === lease) {
          lease.kind = "google-start";
          try { await pending?.clear(); } finally { active = null; }
        }
        throw error;
      }
    },

    async completeGoogle<T>(url: string | null, action: (code: string | null) => Promise<T>, onClaim?: () => void): Promise<T | null> {
      if (!isGoogleCallbackUrl(url) || (active ? active.kind !== "google-pending" : !canRestore)) return null;
      const liveDeadline = active?.deadline;
      const lease: Lease = { kind: "google-exchange", deadline: 0 };
      active = lease; // Claim before reading storage so no other entry can supersede this return.
      try {
        if (!withinWindow(liveDeadline ?? await pending?.readDeadline())) return null;
        canRestore = false;
        const code = parseGoogleCallback(url);
        if (code) onClaim?.();
        await pending?.clear(); // Consume the persisted intent before Supabase can create a session.
        return await action(code);
      } finally { if (active === lease) active = null; }
    },
  };
}
