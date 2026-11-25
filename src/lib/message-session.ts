import {assertAccountOwner} from "./account-scope";
import {requireSupabase} from "./supabase";
import {sessionMarkerKey} from "./session-lifetime";
import {sessionExitFence} from "./session-exit-fence";
import {verifyMessageSession,type MessageScope} from "./session-continuity";
export type {MessageScope} from "./session-continuity";

// Deduplicate only overlapping server checks for the exact credential.
const pendingUserChecks=new Map<string,Promise<string|null>>();

function verifyUser(db:ReturnType<typeof requireSupabase>,credential:string){
 const pending=pendingUserChecks.get(credential);
 if(pending)return pending;
 const request=db.auth.getUser().then(({data:{user},error})=>{
  if(error)throw error;
  return user?.id??null;
 }).finally(()=>pendingUserChecks.delete(credential));
 pendingUserChecks.set(credential,request);
 return request;
}

async function readCredential(db:ReturnType<typeof requireSupabase>){
 const {data,error}=await db.auth.getSession();
 if(error||!data.session)throw Error("Inicia sesión para gestionar tus mensajes.");
 const owner=data.session.user.id,credential=data.session.access_token;
 const session=sessionMarkerKey(owner,credential);
 sessionExitFence.assertOpen(session);
 return {scope:{owner,session},credential};
}

/** A local continuity hint only. Callers must verify it before using private data. */
export async function readMessageScope():Promise<MessageScope>{
 return (await readCredential(requireSupabase())).scope;
}

/** The decoded session ID is a local continuity guard; getUser and RLS authorize requests. */
export async function captureMessageScope(expected?:MessageScope):Promise<MessageScope>{
 const db=requireSupabase();
 let credential="";
 return verifyMessageSession(async()=>{
  const current=await readCredential(db);
  credential=current.credential;
  return current.scope;
 },()=>verifyUser(db,credential),assertAccountOwner,expected);
}
export async function assertMessageScope(scope:MessageScope):Promise<void>{
 await assertAccountOwner(scope.owner,scope.session);
}
