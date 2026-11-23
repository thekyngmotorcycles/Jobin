import AsyncStorage from "@react-native-async-storage/async-storage";
import {createAuthEntryBoundary,authRedirectScheme} from "./auth-entry-boundary";
import {requireSupabase} from "./supabase";
const boundary=createAuthEntryBoundary();
const googlePendingKey="jobeen:oauth:google-pending:v1";
const googlePendingTTL=5*60*1000;
async function clearGooglePending(){await AsyncStorage.removeItem(googlePendingKey);}

async function signedOut(){
 const {data,error}=await requireSupabase().auth.getSession();
 if(error||data.session)throw Error("Cierra la sesión actual antes de iniciar otro acceso.");
}
export function runSignedOutAuth<T>(action:()=>Promise<T>){
 return boundary.exclusive(async()=>{await signedOut();return action();});
}
export function startGoogleAuth(open:(url:string)=>Promise<unknown>){
 return boundary.google(async ready=>{
  await signedOut();
  const {data,error}=await requireSupabase().auth.signInWithOAuth({provider:"google",options:{redirectTo:authRedirectScheme+"://",skipBrowserRedirect:true}});
  if(error||!data.url)throw Error("No se pudo iniciar el acceso con Google.");
  const link=new URL(data.url);
  if(link.protocol!=="https:"||link.username||link.password)throw Error("Acceso con Google inválido.");
  await signedOut();ready();
  await AsyncStorage.setItem(googlePendingKey,String(Date.now()+googlePendingTTL));
  try{await open(data.url);}catch(error){await clearGooglePending();throw error;}
 });
}
export async function exchangePendingGoogle<T>(url:string|null,accept:(code:string)=>Promise<T>){
 const stored=await AsyncStorage.getItem(googlePendingKey);
 const deadline=stored?Number(stored):NaN;
 if(Number.isFinite(deadline)&&deadline>Date.now()&&deadline<=Date.now()+googlePendingTTL){
  boundary.restorePendingGoogle(deadline);
 }
 try{return await boundary.exchange(url,async code=>{await signedOut();return accept(code);});}
 finally{await clearGooglePending();}
}
export const cancelPendingGoogle=()=>boundary.cancelPendingGoogle();
// Serialize logout with every entry, including completion of Google PKCE.
export function runAuthExit<T>(action:()=>Promise<T>){
 boundary.cancelPendingGoogle();
 return boundary.exclusive(action);
}
