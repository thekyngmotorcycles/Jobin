import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import { AppState } from "react-native";
import {classifyAuthNavigation,type AuthNavigationPhase} from "../lib/auth-navigation-phase";
import { supabase } from "../lib/supabase";
import {exchangePendingGoogle,runAuthExit} from "../lib/auth-entry";
import {sessionExitFence} from "../lib/session-exit-fence";
import type {MessageScope} from "../lib/session-continuity";
import {parseGoogleCallback} from "../lib/auth-entry-boundary";
import { sessionMarkerKey,sessionLifetimeState } from "../lib/session-lifetime";

const AuthNavigationContext=createContext<AuthNavigationPhase>("checking");
const OAuthErrorContext=createContext<string>("");
export function useOAuthError(){return useContext(OAuthErrorContext);}
export function useAuthNavigationPhase(){return useContext(AuthNavigationContext);}
let usernameCompleted: (()=>void)|null=null;
export function completeUsernameOnboarding(){usernameCompleted?.();}

export async function startJobinSession(expectedOwner:string,expectedToken:string) {
 const result=await supabase?.auth.getSession();
 const session=result?.data.session;
 if(result?.error||session?.user.id!==expectedOwner||sessionMarkerKey(expectedOwner,session.access_token)!==sessionMarkerKey(expectedOwner,expectedToken))throw new Error("La cuenta cambió. Vuelve a iniciar sesión.");
 const key=sessionMarkerKey(expectedOwner,expectedToken);
 sessionExitFence.assertOpen(key);
 if(await AsyncStorage.getItem(key)===null){sessionExitFence.assertOpen(key);await AsyncStorage.setItem(key,String(Date.now()));}
 sessionExitFence.assertOpen(key);
}
export async function endJobinSession(expected:MessageScope) {
 if(!supabase||!expected?.owner||!expected.session)throw Error("Sesión no disponible.");
 const db=supabase;
 const origin={...expected};
 await runAuthExit(async()=>{
  const {data,error}=await db.auth.getSession();
  const session=data.session;
  if(error||!session||session.user.id!==origin.owner||sessionMarkerKey(origin.owner,session.access_token)!==origin.session)throw Error("La sesión cambió.");
  await sessionExitFence.close(origin.session,async()=>{
   // Recheck after the fence is active; do not sign out a newly selected user.
   const current=await db.auth.getSession();
   if(current.error||current.data.session?.user.id!==origin.owner||sessionMarkerKey(origin.owner,current.data.session.access_token)!==origin.session)throw Error("La sesión cambió.");
   const {error:signOutError}=await db.auth.signOut({scope:"local"});
   if(signOutError)throw signOutError;
   // Keep a per-session tombstone instead of restarting the lifetime of a
   // revoked session from a missing marker. Never touch ambiguous legacy data.
   await AsyncStorage.setItem(origin.session,"revoked");
  });
 });
}
export function AuthGate({ children }: { children: ReactNode }) {
 const [ready, setReady] = useState(false);
 const [sessionScope,setSessionScope]=useState<string|null>(null);
 const [handlingOAuth, setHandlingOAuth] = useState(true);
 const [needsUsername,setNeedsUsername]=useState(false);
 const [oauthError,setOAuthError]=useState("");
 useEffect(() => {
  let active = true;
  let revision=0;
  let observedSession:string|null=null;
  let oauthInFlight=false;
  usernameCompleted=()=>{if(active)setNeedsUsername(false);};
  async function usernameRequired(userId:string,sessionSetupIncomplete:boolean){
   const [{data:claimed,error:usernameError},{data:profile,error:profileError},{data:jcard,error:jcardError}]=await Promise.all([
    supabase!.from("usernames").select("username").eq("user_id",userId).maybeSingle(),
    supabase!.from("profiles").select("display_name").eq("id",userId).maybeSingle(),
    supabase!.from("jcard_profiles").select("handle").eq("profile_id",userId).maybeSingle()
   ]);
   if(usernameError||profileError||jcardError)throw usernameError??profileError??jcardError;
   const named=!!profile?.display_name?.trim() && profile.display_name!=="Nuevo usuario";
   const chosen=!!claimed?.username && !!jcard?.handle && claimed.username.toLowerCase()===jcard.handle.toLowerCase();
   return sessionSetupIncomplete||!named||!chosen;
  }
  async function check() {
   if(oauthInFlight||sessionExitFence.current())return;
   const checkedRevision=++revision;
   const valid=()=>active&&revision===checkedRevision;
   try {
    if(!supabase)return;
    const {data:{session},error}=await supabase.auth.getSession();
    if(error)throw error;
    if(!session){
     if(valid())setSessionScope(null);
     return;
    }
    const owner=session.user.id;
    const key=sessionMarkerKey(owner,session.access_token);
    const verified=await supabase.auth.getUser();
    if(!valid())return;
    if(verified.error||verified.data.user?.id!==owner){setSessionScope(null);return;}
    const lifetime=sessionLifetimeState(await AsyncStorage.getItem(key));
    if(!valid())return;
    if(lifetime==="expired"){
     setSessionScope(null);
     await endJobinSession({owner,session:key});
     return;
    }
    if(lifetime==="missing")await startJobinSession(owner,session.access_token);
    if(!valid())return;
    const needsSetup=await usernameRequired(owner,session.user.user_metadata?.account_setup_completed!==true);
    const current=await supabase.auth.getSession();
    if(!valid())return;
    if(current.error||current.data.session?.user.id!==owner||
       sessionMarkerKey(owner,current.data.session.access_token)!==key){
     setSessionScope(null);
     return;
    }
    setNeedsUsername(needsSetup);
    setSessionScope(key);
   }catch{if(valid())setSessionScope(null);}
   finally{if(valid())setReady(true);}
  }
  async function handleOAuthUrl(url:string|null){
   if(!parseGoogleCallback(url))return false;
   if(oauthInFlight)return true;
   oauthInFlight=true;revision++;
   try{
    setOAuthError("");
    const exchanged=await exchangePendingGoogle(url,async code=>{
     if(!active||!supabase)throw Error("Acceso no disponible.");
     setHandlingOAuth(true);
     const {data,error}=await supabase.auth.exchangeCodeForSession(code);
     if(error||!data.session)throw Error("No se pudo iniciar sesión.");
     await startJobinSession(data.session.user.id,data.session.access_token);
     return true;
    });
    if(!exchanged)setOAuthError("No se pudo completar el acceso con Google. Vuelve a intentarlo.");
   }catch{/* Do not disclose session data or OAuth codes. */setOAuthError("Google no pudo completar la sesión. Vuelve a intentarlo.");}
   finally{oauthInFlight=false;if(active){setHandlingOAuth(false);void check();}}
   return true;
  }
  void Linking.getInitialURL().then(async url=>{
   const handled=await handleOAuthUrl(url);
   if(!handled){if(active)setHandlingOAuth(false);void check();}
  }).catch(()=>{if(active)setHandlingOAuth(false);void check();});
  const linkSubscription=Linking.addEventListener("url",event=>{void handleOAuthUrl(event.url).then(handled=>{if(!handled)void check();});});

  const exitSubscription=sessionExitFence.subscribe(()=>{
   revision++;
   if(!active)return;
   if(sessionExitFence.current()){setSessionScope(null);setNeedsUsername(false);setReady(false);}
   else setTimeout(()=>{if(active)void check();},0);
  });
  const appSubscription = AppState.addEventListener("change", state => { if(state==="active"&&!oauthInFlight)void check(); });
  const subscription = supabase?.auth.onAuthStateChange((event,session) => {
   let nextSession:string|null=null;
   try{if(session)nextSession=sessionMarkerKey(session.user.id,session.access_token);}catch{/* Invalid metadata cannot select a private account. */}
   const changed=nextSession!==observedSession;
   if(changed||event==="SIGNED_OUT"){
    revision++;
    observedSession=nextSession;
    if(active){
     setSessionScope(null);
     setNeedsUsername(false);
     setReady(nextSession===null&&!sessionExitFence.current());
    }
   }
   if(nextSession&&(changed||event==="SIGNED_IN"||event==="INITIAL_SESSION"||event==="TOKEN_REFRESHED")){
    setTimeout(()=>{if(active)void check();},0);
   }
  });
  return () => { active = false;usernameCompleted=null; subscription?.data.subscription.unsubscribe(); exitSubscription(); appSubscription.remove(); linkSubscription.remove(); };
 }, []);
 // Protected routes are absent from the navigator until authorized.
 const phase=classifyAuthNavigation(ready,handlingOAuth,sessionScope,needsUsername);
 return <AuthNavigationContext.Provider value={phase}><OAuthErrorContext.Provider value={oauthError}><Fragment key={sessionScope??"signed-out"}>{children}</Fragment></OAuthErrorContext.Provider></AuthNavigationContext.Provider>;
}
