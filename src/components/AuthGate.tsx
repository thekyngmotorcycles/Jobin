import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { router, usePathname } from "expo-router";
import { supabase } from "../lib/supabase";

const KEY = "jobin:session-start";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const AUTH_ROUTES = ["/login", "/account"];

export async function startJobinSession() {
 await AsyncStorage.setItem(KEY, String(Date.now()));
}
export async function endJobinSession() {
 await AsyncStorage.removeItem(KEY);
 await supabase?.auth.signOut();
}
export function AuthGate({ children }: { children: ReactNode }) {
 const pathname = usePathname();
 const [ready, setReady] = useState(false);
 const [signedIn, setSignedIn] = useState(false);
 useEffect(() => {
  let active = true;
  async function check() {
   if (!supabase) { if (active) { setSignedIn(false); setReady(true); } return; }
   try {
    const { data: { session } } = await supabase.auth.getSession();
    const started = await AsyncStorage.getItem(KEY);
    if (!session) {
     await AsyncStorage.removeItem(KEY);
     if (active) setSignedIn(false);
    } else if (started && Date.now() - Number(started) >= SEVEN_DAYS) {
     await endJobinSession();
     if (active) setSignedIn(false);
    } else {
     if (!started) await startJobinSession();
     if (active) setSignedIn(true);
    }
   } catch { if (active) setSignedIn(false); }
   finally { if (active) setReady(true); }
  }
  void check();
  const appSubscription = AppState.addEventListener("change", state => { if(state==="active") void check(); });
  const subscription = supabase?.auth.onAuthStateChange((event) => {
   if (event === "SIGNED_OUT") { void AsyncStorage.removeItem(KEY); if (active) setSignedIn(false); }
   if (event === "SIGNED_IN") { if (active) setSignedIn(true); }
  });
  return () => { active = false; subscription?.data.subscription.unsubscribe(); appSubscription.remove(); };
 }, []);
 useEffect(() => {
  if (!ready) return;
  if (!signedIn && !AUTH_ROUTES.includes(pathname)) router.replace("/login");
  if (signedIn && AUTH_ROUTES.includes(pathname)) router.replace("/videos");
  if (signedIn && pathname === "/") router.replace("/videos");
 }, [ready, signedIn, pathname]);
 if (!ready) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;
 return children;
}
