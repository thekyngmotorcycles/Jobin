import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAuthEntryBoundary, authRedirectScheme } from "./auth-entry-boundary";
import { requireSupabase } from "./supabase";

const googlePendingKey = "jobeen:oauth:google-pending:v1";
const replacePendingGoogle = { replacePendingGoogle: true };
const clearGooglePending = () => AsyncStorage.removeItem(googlePendingKey);
const boundary = createAuthEntryBoundary(Date.now, {
  async readDeadline() {
    const stored = await AsyncStorage.getItem(googlePendingKey);
    return stored === null ? NaN : Number(stored);
  },
  writeDeadline: deadline => AsyncStorage.setItem(googlePendingKey, String(deadline)),
  clear: clearGooglePending,
});

async function signedOut() {
  const { data, error } = await requireSupabase().auth.getSession();
  if (error || data.session) throw Error("Cierra la sesión actual antes de iniciar otro acceso.");
}

export function runSignedOutAuth<T>(action: () => Promise<T>) {
  return boundary.exclusive(async () => {
    await clearGooglePending();
    await signedOut();
    return action();
  }, replacePendingGoogle);
}

export function startGoogleAuth(open: (url: string) => Promise<unknown>) {
  return boundary.google(async ready => {
    await signedOut();
    const { data, error } = await requireSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authRedirectScheme + "://", skipBrowserRedirect: true },
    });
    if (error || !data.url) throw Error("No se pudo iniciar el acceso con Google.");
    const link = new URL(data.url);
    if (link.protocol !== "https:" || link.username || link.password) throw Error("Acceso con Google inválido.");
    await signedOut();
    await ready();
    await open(data.url);
  }, replacePendingGoogle);
}

export function exchangePendingGoogle(url: string | null, accept: (code: string) => Promise<void>) {
  return boundary.completeGoogle(url, async code => {
    if (!code) return "invalid" as const;
    await signedOut();
    await accept(code);
    return "exchanged" as const;
  });
}

export function runAuthExit<T>(action: () => Promise<T>) {
  return boundary.exclusive(async () => {
    const result = await action();
    // Supabase has cleared the verifier and session. Clean up any leftover intent as well.
    await clearGooglePending().catch(() => {});
    return result;
  }, replacePendingGoogle);
}
