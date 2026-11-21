import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import { ActivityIndicator, AppState, View } from "react-native";
import { router, usePathname } from "expo-router";
import { supabase } from "../lib/supabase";
import { sessionMarkerKey,sessionLifetimeState } from "../lib/session-lifetime";

const LEGACY_KEY = "jobin:session-start";
const AUTH_ROUTES = ["/login", "/account"];
const USERNAME_ROUTE="/choose-username";
let usernameCompleted: (()=>void)|null=null;
export function completeUsernameOnboarding(){usernameCompleted?.();}

export async function startJobinSession(expectedOwner:string) {
 const result=await supabase?.auth.getSession();
 if(result?.error||result?.data.session?.user.id!==expectedOwner)throw new Error("La cuenta cambió. Vuelve a iniciar sesión.");
 await AsyncStorage.setItem(sessionMarkerKey(expectedOwner),String(Date.now()));
}
export async function endJobinSession(expectedOwner?:string) {
 if(!supabase)return;
 const {data,error}=await supabase.auth.getSession();
 if(error)throw error;
 const owner=data.session?.user.id;
 if(expectedOwner&&owner!==expectedOwner)throw new Error("La cuenta cambió. Vuelve a intentar.");
 const {error:signOutError}=await supabase.auth.signOut({scope:"local"});
 if(signOutError)throw signOutError;
 if(owner)await AsyncStorage.removeItem(sessionMarkerKey(owner));
 await AsyncStorage.removeItem(LEGACY_KEY);
}
export function AuthGate({ children }: { children: ReactNode }) {
 const pathname = usePathname();
 const [ready, setReady] = useState(false);
 const [signedIn, setSignedIn] = useState(false);
 const [sessionOwner,setSessionOwner]=useState<string|null>(null);
 const [handlingOAuth, setHandlingOAuth] = useState(true);
 const [needsUsername,setNeedsUsername]=useState(false);
 useEffect(() => {
  let active = true;
  let revision=0;
  let observedOwner:string|null=null;
  let oauthInFlight=false;
  usernameCompleted=()=>{if(active)setNeedsUsername(false);};
  async function checkUsername(userId:string,sessionSetupIncomplete:boolean){
   const [{data:claimed,error:usernameError},{data:profile,error:profileError},{data:jcard,error:jcardError}]=await Promise.all([
    supabase!.from("usernames").select("username").eq("user_id",userId).maybeSingle(),
    supabase!.from("profiles").select("display_name").eq("id",userId).maybeSingle(),
    supabase!.from("jcard_profiles").select("handle").eq("profile_id",userId).maybeSingle()
   ]);
   if(usernameError||profileError||jcardError)throw usernameError??profileError??jcardError;
   const named=!!profile?.display_name?.trim() && profile.display_name!=="Nuevo usuario";
   const chosen=!!claimed?.username && !!jcard?.handle && claimed.username.toLowerCase()===jcard.handle.toLowerCase();
   const current=await supabase!.auth.getSession();
   if(active&&current.data.session?.user.id===userId)setNeedsUsername(sessionSetupIncomplete||!named||!chosen);
  }
  async function check() {
   const checkedRevision=revision;
   const valid=()=>active&&revision===checkedRevision;
   if (!supabase) { if (active) { setSignedIn(false); setReady(true); } return; }
   try {
    const { data: { session } } = await supabase.auth.getSession();
    const started=session?await AsyncStorage.getItem(sessionMarkerKey(session.user.id)):null;
    if(!valid())return;
    if (!session) {
     if (valid()) {setSessionOwner(null);setSignedIn(false);}
    } else if(sessionLifetimeState(started)==="expired") {
     if(valid())await endJobinSession(session.user.id);
     if (valid()) {setSessionOwner(null);setSignedIn(false);}
    } else {
     if(sessionLifetimeState(started)==="missing")await startJobinSession(session.user.id);
     await checkUsername(session.user.id,session.user.user_metadata?.account_setup_completed!==true);
     if (valid()&&(await supabase.auth.getSession()).data.session?.user.id===session.user.id&&valid()){setSessionOwner(session.user.id);setSignedIn(true);}
    }
   } catch { if (valid()) {setSessionOwner(null);setSignedIn(false);} }
   finally { if (valid()) setReady(true); }
  }
  async function handleOAuthUrl(url:string|null){
   if(!url || !url.startsWith("jobin:"))return false;
   const code = /[?&]code=([^&#]+)/.exec(url)?.[1];
   if(!code)return false;
   oauthInFlight=true;
   if(active)setHandlingOAuth(true);
   try{
    if(!supabase)throw new Error("Supabase no está configurado");
    const {data,error}=await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
    if(error)throw error;
    if(!data.session)throw new Error("El proveedor de acceso no devolvió una sesión válida");
    await startJobinSession(data.session.user.id);
    await checkUsername(data.session.user.id,data.session.user.user_metadata?.account_setup_completed!==true);
    if(active)setSignedIn(true);
   }catch{if(active){setSignedIn(false);setSessionOwner(null);}}
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
   const nextOwner=session?.user.id??null;
   if(nextOwner!==observedOwner){revision++;observedOwner=nextOwner;if(active){setSessionOwner(nextOwner);setNeedsUsername(false);}}
   if(active&&event==="INITIAL_SESSION")setReady(true);
   if(event==="SIGNED_OUT"&&active)setSignedIn(false);
   if (event === "SIGNED_IN"||event === "INITIAL_SESSION") { if (active) setSignedIn(!!session?.user); }
   if(event==="SIGNED_IN"||event==="INITIAL_SESSION")setTimeout(()=>{if(active)void check();},0);
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
 return <Fragment key={sessionOwner??"signed-out"}>{children}</Fragment>;
}
