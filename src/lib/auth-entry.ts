import {createAuthEntryBoundary} from "./auth-entry-boundary";
import {requireSupabase} from "./supabase";
const boundary=createAuthEntryBoundary();
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
  const {data,error}=await requireSupabase().auth.signInWithOAuth({provider:"google",options:{redirectTo:"jobin://",skipBrowserRedirect:true}});
  if(error||!data.url)throw Error("No se pudo iniciar el acceso con Google.");
  const link=new URL(data.url);
  if(link.protocol!=="https:"||link.username||link.password)throw Error("Acceso con Google inválido.");
  await signedOut();ready();await open(data.url);
 });
}
export function exchangePendingGoogle<T>(url:string|null,accept:(code:string)=>Promise<T>){
 return boundary.exchange(url,async code=>{await signedOut();return accept(code);});
}
export const cancelPendingGoogle=()=>boundary.cancelPendingGoogle();
// Serialize logout with every entry, including completion of Google PKCE.
export function runAuthExit<T>(action:()=>Promise<T>){
 boundary.cancelPendingGoogle();
 return boundary.exclusive(action);
}
