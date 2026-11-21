import {assertAccountOwner} from "./account-scope";
import {requireSupabase} from "./supabase";
import {sessionMarkerKey} from "./session-lifetime";

export type MessageScope={owner:string;session:string};

/** The decoded session ID is a local continuity guard; getUser and RLS authorize requests. */
export async function captureMessageScope(expected?:MessageScope):Promise<MessageScope>{
 const db=requireSupabase();
 const {data,error}=await db.auth.getSession();
 if(error||!data.session)throw Error("Inicia sesión para gestionar tus mensajes.");
 const owner=data.session.user.id;
 const session=sessionMarkerKey(owner,data.session.access_token);
 if(expected&&(expected.owner!==owner||expected.session!==session))throw Error("La sesión cambió.");
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||user?.id!==owner)throw Error("La sesión cambió.");
 await assertAccountOwner(owner,session);
 return {owner,session};
}
export async function assertMessageScope(scope:MessageScope):Promise<void>{
 await assertAccountOwner(scope.owner,scope.session);
}
