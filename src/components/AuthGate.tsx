import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import { AppState } from "react-native";
import {classifyAuthNavigation,type AuthNavigationPhase} from "../lib/auth-navigation-phase";
import { supabase } from "../lib/supabase";
import { sessionMarkerKey,sessionLifetimeState } from "../lib/session-lifetime";

const LEGACY_KEY = "jobin:session-start";
const AuthNavigationContext=createContext<AuthNavigationPhase>("checking");
export function useAuthNavigationPhase(){return useContext(AuthNavigationContext);}
let usernameCompleted: (()=>void)|null=null;
export function completeUsernameOnboarding(){usernameCompleted?.();}

export async function startJobinSession(expectedOwner:string,expectedToken:string) {
 const result=await supabase?.auth.getSession();
 const session=result?.data.session;
 if(result?.error||session?.user.id!==expectedOwner||sessionMarkerKey(expectedOwner,session.access_token)!==sessionMarkerKey(expectedOwner,expectedToken))throw new Error("La cuenta cambió. Vuelve a iniciar sesión.");
 const key=sessionMarkerKey(expectedOwner,expectedToken);
 if(await AsyncStorage.getItem(key)===null)await AsyncStorage.setItem(key,String(Date.now()));
}
export async function endJobinSession(expectedOwner?:string,expectedToken?:string) {
 if(!supabase)return;
 const {data,error}=await supabase.auth.getSession();
 if(error)throw error;
 const owner=data.session?.user.id;
 let key:string|null=null;
 try{if(owner&&data.session)key=sessionMarkerKey(owner,data.session.access_token);}catch{if(expectedToken)throw new Error("La sesión cambió.");}
 if(expectedOwner&&(owner!==expectedOwner||(expectedToken&&key!==sessionMarkerKey(expectedOwner,expectedToken))))throw new Error("La cuenta cambió. Vuelve a intentar.");
 const {error:signOutError}=await supabase.auth.signOut({scope:"local"});
 if(signOutError)throw signOutError;
 if(key)await AsyncStorage.removeItem(key);
 await AsyncStorage.removeItem(LEGACY_KEY);
}
export function AuthGate({ children }: { children: ReactNode }) {
 const [ready, setReady] = useState(false);
 const [sessionScope,setSessionScope]=useState<string|null>(null);
 const [handlingOAuth, setHandlingOAuth] = useState(true);
 const [needsUsername,setNeedsUsername]=useState(false);
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
   if(oauthInFlight)return;
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
     await endJobinSession(owner,session.access_token);
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
   if(!url || !url.startsWith("jobin:"))return false;
   const code = /[?&]code=([^&#]+)/.exec(url)?.[1];
   if(!code)return false;
   if(oauthInFlight)return true;
   oauthInFlight=true;
   revision++;
   if(active)setHandlingOAuth(true);
   try{
    if(!supabase)throw new Error("Supabase no está configurado");
    const {data,error}=await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
    if(error)throw error;
    if(!data.session)throw new Error("El proveedor de acceso no devolvió una sesión válida");
    await startJobinSession(data.session.user.id,data.session.access_token);
   }catch{if(active)setSessionScope(null);}
   finally{oauthInFlight=false;if(active){setHandlingOAuth(false);void check();}}
   return true;
  }
  void Linking.getInitialURL().then(async url=>{
   const handled=await handleOAuthUrl(url);
   if(!handled){if(active)setHandlingOAuth(false);void check();}
  }).catch(()=>{if(active)setHandlingOAuth(false);void check();});
  const linkSubscription=Linking.addEventListener("url",event=>{void handleOAuthUrl(event.url).then(handled=>{if(!handled)void check();});});

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
     setReady(nextSession===null);
    }
   }
   if(nextSession&&(changed||event==="SIGNED_IN"||event==="INITIAL_SESSION"||event==="TOKEN_REFRESHED")){
    setTimeout(()=>{if(active)void check();},0);
   }
  });
  return () => { active = false;usernameCompleted=null; subscription?.data.subscription.unsubscribe(); appSubscription.remove(); linkSubscription.remove(); };
 }, []);
 // Protected routes are absent from the navigator until authorized.
 const phase=classifyAuthNavigation(ready,handlingOAuth,sessionScope,needsUsername);
 return <AuthNavigationContext.Provider value={phase}><Fragment key={sessionScope??"signed-out"}>{children}</Fragment></AuthNavigationContext.Provider>;
}
