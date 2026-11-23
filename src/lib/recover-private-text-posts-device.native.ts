
import {createTextPostRecovery} from "./recover-private-text-posts";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";
import {restoreVerifiedNativePostDrafts} from "./private-metadata-storage";
import {requireSupabase} from "./supabase";
// Candidate only: no screen invokes this. No legacy values sent to a server.
const recover=createTextPostRecovery(async(grant,scope)=>{
 await captureMessageScope(scope);
 const {data,error}=await requireSupabase().rpc("jobin_legacy_recovery_text_posts",{requested_grant:grant});
 await assertMessageScope(scope);
 if(error)throw Error("Recuperación no disponible.");
 return data;
},(scope,payload,revalidate)=>restoreVerifiedNativePostDrafts(scope,payload,revalidate),captureMessageScope);
export async function recoverVerifiedTextPosts(grant:string,scope:MessageScope,confirmed:boolean){
 return recover(grant,scope,confirmed);
}
