import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";

export type ActivityNotice={
 id:string;kind:string;payload:Record<string,unknown>;readAt:string|null;createdAt:string;
 actorName:string;actorId:string|null;
};
type RawNotice={recipient_id:string;id:string;kind:string;payload:Record<string,unknown>|null;read_at:string|null;created_at:string};
function value(payload:Record<string,unknown>,field:string):string{
 const item=payload[field];
 return typeof item==="string"?item:"";
}
export async function loadActivityNotifications(limit=100,expectedScope?:MessageScope):Promise<ActivityNotice[]>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),user={id:scope.owner};
 const {data,error}=await db.from("notifications" as never)
  .select("recipient_id,id,kind,payload,read_at,created_at").eq("recipient_id",user.id)
  .order("created_at",{ascending:false}).limit(limit);
 if(error)throw error;
 await assertMessageScope(scope);
 const rows=((data??[]) as unknown as RawNotice[]).filter(r=>r.recipient_id===scope.owner);
 const actorIds=[...new Set(rows.map(n=>value(n.payload??{},"actor_id")).filter(Boolean))];
 const names=new Map<string,string>();
 if(actorIds.length){
  const {data:profiles,error:profilesError}=await db.from("profiles")
   .select("id,display_name").in("id",actorIds);
  if(profilesError)throw profilesError;
  for(const profile of profiles??[])names.set(profile.id,profile.display_name||"Usuario de Jobeen");
 }
 await assertMessageScope(scope);
 return rows.map(row=>{
  const actorId=value(row.payload??{},"actor_id");
  return {id:row.id,kind:row.kind,payload:row.payload??{},readAt:row.read_at,createdAt:row.created_at,
   actorId:actorId||null,actorName:names.get(actorId)??"Usuario de Jobeen"};
 });
}
export async function countUnreadActivityNotifications():Promise<number>{
 const db=requireSupabase();const {data:{user}}=await db.auth.getUser();
 if(!user)return 0;
 const {count,error}=await db.from("notifications" as never)
  .select("id",{head:true,count:"exact"}).eq("recipient_id",user.id).is("read_at",null);
 if(error)throw error;
 return count??0;
}
/**
 * Count unresolved CV access requests as actionable items even when their
 * notification was already opened. Do not double-count requests that still
 * have an unread activity notification.
 */
export async function countPendingProfileAlerts():Promise<number>{
 const db=requireSupabase();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError)throw authError;
 if(!user)return 0;
 const [unread,pending,unreadCv,pendingContacts,unreadContacts]=await Promise.all([
  db.from("notifications" as never)
   .select("id",{head:true,count:"exact"}).eq("recipient_id",user.id).is("read_at",null),
  db.from("employment_access_requests" as never)
   .select("id").eq("owner_id",user.id).eq("status","pending"),
  db.from("notifications" as never)
   .select("payload").eq("recipient_id",user.id).eq("kind","cv_request").is("read_at",null),
  db.from("jobeen_contact_requests" as never)
   .select("id").eq("recipient_id",user.id).eq("status","pending"),
  db.from("notifications" as never)
   .select("payload").eq("recipient_id",user.id).eq("kind","contact_request").is("read_at",null)
 ]);
 if(unread.error)throw unread.error;
 if(pending.error)throw pending.error;
 if(unreadCv.error)throw unreadCv.error;
 if(pendingContacts.error)throw pendingContacts.error;
 if(unreadContacts.error)throw unreadContacts.error;
 const alreadyCounted=new Set(((unreadCv.data??[]) as unknown as {payload:Record<string,unknown>|null}[])
  .map(n=>n.payload?.request_id).filter((id):id is string=>typeof id==="string"));
 const pendingUncounted=((pending.data??[]) as unknown as {id:string}[])
  .filter(request=>!alreadyCounted.has(request.id)).length;
 const alreadyCountedContacts=new Set(((unreadContacts.data??[]) as unknown as {payload:Record<string,unknown>|null}[])
  .map(n=>n.payload?.request_id).filter((id):id is string=>typeof id==="string"));
 const pendingUncountedContacts=((pendingContacts.data??[]) as unknown as {id:string}[])
  .filter(request=>!alreadyCountedContacts.has(request.id)).length;
 return (unread.count??0)+pendingUncounted+pendingUncountedContacts;
}
export async function markActivityNotificationsRead(ids?:string[],expectedScope?:MessageScope):Promise<void>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),user={id:scope.owner};
 if(ids&&ids.length===0)return;
 let query=db.from("notifications" as never).update({read_at:new Date().toISOString()} as never)
  .eq("recipient_id",user.id).is("read_at",null);
 if(ids)query=query.in("id",ids);
 const {error}=await query;
 if(error)throw error;
 await assertMessageScope(scope);
}
export function noticeDescription(notice:ActivityNotice):{title:string;detail:string;category:"activity"|"requests"|"system"}{
 const {kind,actorName,payload}=notice;
 const status=value(payload,"status");
 switch(kind){
  case "contact_request":return {title:actorName+" quiere conectar contigo",detail:"Aceptar o rechazar la invitación profesional",category:"requests"};
  case "contact_accepted":return {title:actorName+" aceptó tu invitación de contacto",detail:"Ver contacto profesional",category:"activity"};
  case "new_follower":return {title:actorName+" comenzó a seguirte",detail:"Ver perfil",category:"activity"};
  case "post_like":return {title:actorName+" indicó que le gusta tu publicación",detail:"Ver publicación",category:"activity"};
  case "post_comment":return {title:actorName+" comentó tu publicación",detail:"Ver comentario",category:"activity"};
  case "cv_request":return {title:actorName+" solicitó acceso a tu historial profesional",detail:"Revisar solicitud",category:"requests"};
  case "cv_response":return {title:status==="approved"?"Tu solicitud de CV fue aprobada":status==="revoked"?"Se revocó tu acceso al CV":"Tu solicitud de CV no fue aprobada",detail:"Ver perfil profesional",category:"requests"};
  case "message_request":return {title:actorName+" te envió una solicitud de mensaje",detail:"Revisar solicitud",category:"requests"};
  case "new_message":return {title:"Nuevo mensaje de "+actorName,detail:"Abrir conversación",category:"activity"};
  case "identity_verification":return {title:status==="approved"?"Verificación de identidad aprobada":"Actualización de tu verificación de identidad",detail:value(payload,"reason")||"Ver estado de identidad",category:"system"};
  default:{
   const title=value(payload,"title").slice(0,120)||"Mensaje de Jobeen";
   const detail=(value(payload,"body")||value(payload,"message")||"Aviso del sistema").slice(0,700);
   return {title,detail,category:"system"};
  }
 }
}
