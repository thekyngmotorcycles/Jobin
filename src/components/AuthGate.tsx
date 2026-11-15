import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import { ActivityIndicator, AppState, View } from "react-native";
import { router, usePathname } from "expo-router";
import { supabase } from "../lib/supabase";

const KEY = "jobin:session-start";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const AUTH_ROUTES = ["/login", "/account"];
const USERNAME_ROUTE="/choose-username";
let usernameCompleted: (()=>void)|null=null;
export function completeUsernameOnboarding(){usernameCompleted?.();}

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
 const [handlingOAuth, setHandlingOAuth] = useState(true);
 const [needsUsername,setNeedsUsername]=useState(false);
 useEffect(() => {
  let active = true;
  usernameCompleted=()=>{if(active)setNeedsUsername(false);};
  async function checkUsername(userId:string,providers:string[]){
   if(!providers.includes("google")){if(active)setNeedsUsername(false);return;}
   const {data,error}=await supabase!.from("usernames").select("username").eq("user_id",userId).maybeSingle();
   if(error)throw error;
   if(active)setNeedsUsername(!data);
  }
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
     await checkUsername(session.user.id,session.user.identities?.map(i=>i.provider)??[]);
     if (active) setSignedIn(true);
    }
   } catch { if (active) setSignedIn(false); }
   finally { if (active) setReady(true); }
  }
  async function handleOAuthUrl(url:string|null){
   if(!url || !url.startsWith("jobin:"))return false;
   const code = /[?&]code=([^&#]+)/.exec(url)?.[1];
   if(!code)return false;
   if(active)setHandlingOAuth(true);
   try{
    if(!supabase)throw new Error("Supabase no está configurado");
    const {data,error}=await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
    if(error)throw error;
    if(!data.session)throw new Error("Google no devolvió una sesión válida");
    await startJobinSession();
    await checkUsername(data.session.user.id,data.session.user.identities?.map(i=>i.provider)??[]);
    if(active)setSignedIn(true);
   }catch(error){console.warn("Google OAuth callback failed:",error);}
   finally{if(active){setHandlingOAuth(false);setReady(true);}}
   return true;
  }
  void Linking.getInitialURL().then(async url=>{
   const handled=await handleOAuthUrl(url);
   if(!handled){if(active)setHandlingOAuth(false);void check();}
  }).catch(()=>{if(active)setHandlingOAuth(false);void check();});
  const linkSubscription=Linking.addEventListener("url",event=>{void handleOAuthUrl(event.url).then(handled=>{if(!handled)void check();});});

  const appSubscription = AppState.addEventListener("change", state => { if(state==="active" && !handlingOAuth) void check(); });
  const subscription = supabase?.auth.onAuthStateChange((event) => {
   if (event === "SIGNED_OUT") { void AsyncStorage.removeItem(KEY); if (active) setSignedIn(false); }
   if (event === "SIGNED_IN") { if (active) setSignedIn(true); }
  });
  return () => { active = false;usernameCompleted=null; subscription?.data.subscription.unsubscribe(); appSubscription.remove(); linkSubscription.remove(); };
 }, []);
 useEffect(() => {
  if (!ready || handlingOAuth) return;
  if (!signedIn && !AUTH_ROUTES.includes(pathname)) router.replace("/login");
  if(signedIn && needsUsername && pathname!==USERNAME_ROUTE)router.replace(USERNAME_ROUTE);
  if(signedIn && !needsUsername && (AUTH_ROUTES.includes(pathname)||pathname===USERNAME_ROUTE))router.replace("/videos");

 }, [ready, signedIn, pathname, handlingOAuth,needsUsername]);
 if (!ready || handlingOAuth) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;
 return children;
}
