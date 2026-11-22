import {assertAccountOwner} from "./account-scope";
import {requireSupabase} from "./supabase";
import {sessionMarkerKey} from "./session-lifetime";
import {verifyMessageSession,type MessageScope} from "./session-continuity";
export type {MessageScope} from "./session-continuity";

/** The decoded session ID is a local continuity guard; getUser and RLS authorize requests. */
export async function captureMessageScope(expected?:MessageScope):Promise<MessageScope>{
 const db=requireSupabase();
 return verifyMessageSession(async()=>{
  const {data,error}=await db.auth.getSession();
  if(error||!data.session)throw Error("Inicia sesión para gestionar tus mensajes.");
  const owner=data.session.user.id;
  return {owner,session:sessionMarkerKey(owner,data.session.access_token)};
 },async()=>{
  const {data:{user},error}=await db.auth.getUser();
  if(error)throw error;
  return user?.id??null;
 },assertAccountOwner,expected);
}
export async function assertMessageScope(scope:MessageScope):Promise<void>{
 await assertAccountOwner(scope.owner,scope.session);
}
