import {requireSupabase} from "./supabase";
import {loadPublicCard} from "./professional-api";

export type RequestStatus="pending"|"spam"|"accepted"|"declined"|"reported";
export type MessageRequest={
 id:string;senderId:string;recipientId:string;senderName:string;body:string;
 status:RequestStatus;createdAt:string;
};
export type MessagePrivacy={requestsFrom:"all"|"following"|"none";filterSpam:boolean};
type RequestRow={id:string;sender_id:string;recipient_id:string;body:string;status:RequestStatus;created_at:string};
export type ContactAccess={kind:"none"|"accepted"|"incoming"|"outgoing"|"closed";request:MessageRequest|null};
const FIELDS="id,sender_id,recipient_id,body,status,created_at";

async function uid(){
 const {data:{user},error}=await requireSupabase().auth.getUser();
 if(error||!user)throw Error("Inicia sesión para gestionar tus mensajes.");
 return user.id;
}
type AcceptedContactRow={requester_id:string;recipient_id:string};
async function acceptedContactPeers(owner:string, peers:string[]):Promise<Set<string>>{
 const ids=[...new Set(peers)].filter(id=>id!==owner);
 const accepted=new Set<string>();
 for(let offset=0;offset<ids.length;offset+=100){
  const batch=ids.slice(offset,offset+100);
  const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
   .select("requester_id,recipient_id").eq("status","accepted")
   .or(`and(requester_id.eq.${owner},recipient_id.in.(${batch.join(",")})),and(recipient_id.eq.${owner},requester_id.in.(${batch.join(",")}))`);
  if(error)throw error;
  for(const r of (data??[]) as unknown as AcceptedContactRow[]){
   if(r.requester_id===owner&&batch.includes(r.recipient_id))accepted.add(r.recipient_id);
   if(r.recipient_id===owner&&batch.includes(r.requester_id))accepted.add(r.requester_id);
  }
 }
 if(await uid()!==owner)throw Error("La sesión cambió.");
 return accepted;
}
export async function loadChatRequestPreviews(expectedOwner:string):Promise<{id:string;body:string;createdAt:string}[]>{
 const owner=await uid();
 if(owner!==expectedOwner)throw Error("La sesión cambió.");
 const {data,error}=await requireSupabase().from("jobeen_message_requests" as never).select(FIELDS)
  .or(`sender_id.eq.${owner},recipient_id.eq.${owner}`).in("status",["accepted","pending"])
  .order("created_at",{ascending:false}).limit(160);
 if(error)throw error;
 const rows=((data??[]) as unknown as RequestRow[]).filter(r=>r.sender_id===owner||r.recipient_id===owner);
 const peer=(r:RequestRow)=>r.sender_id===owner?r.recipient_id:r.sender_id;
 const contacts=await acceptedContactPeers(owner,rows.filter(r=>r.status==="pending").map(peer));
 return rows.filter(r=>r.status==="accepted"||contacts.has(peer(r))).map(r=>({id:peer(r),body:r.body,createdAt:r.created_at}));
}
export async function loadIncomingRequests():Promise<MessageRequest[]>{
 const db=requireSupabase(),owner=await uid();
 const {data,error}=await db.from("jobeen_message_requests" as never).select(FIELDS)
  .eq("recipient_id",owner).in("status",["pending","spam"])
  .order("created_at",{ascending:false}).limit(100);
 if(error)throw error;
 const candidates=((data??[]) as unknown as RequestRow[]).filter(r=>r.recipient_id===owner);
 const contacts=await acceptedContactPeers(owner,candidates.filter(r=>r.status==="pending").map(r=>r.sender_id));
 const rows=candidates.filter(r=>r.status!=="pending"||!contacts.has(r.sender_id));
 const names=new Map(await Promise.all([...new Set(rows.map(x=>x.sender_id))].map(async id=>{
  const card=await loadPublicCard(id).catch(()=>null);
  return [id,card?.name??"Usuario de Jobeen"] as const;
 })));
 if(await uid()!==owner)throw Error("La sesión cambió.");
 return rows.map(r=>({id:r.id,senderId:r.sender_id,recipientId:r.recipient_id,
  senderName:names.get(r.sender_id)??"Usuario de Jobeen",body:r.body,status:r.status,createdAt:r.created_at}));
}
export async function loadContactAccess(other:string):Promise<ContactAccess>{
 const owner=await uid();
 if(owner===other)throw Error("No puedes escribirte a ti mismo.");
 const db=requireSupabase();
 const {data,error}=await db.from("jobeen_message_requests" as never).select(FIELDS)
  .or(`and(sender_id.eq.${owner},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${owner})`)
  .order("created_at",{ascending:false}).limit(3);
 if(error)throw error;
 const rows=((data??[]) as unknown as RequestRow[]).filter(r=>
  (r.sender_id===owner&&r.recipient_id===other)||(r.sender_id===other&&r.recipient_id===owner));
 const contacts=await acceptedContactPeers(owner,[other]);
 const chosen=rows.find(x=>x.status==="accepted")??rows.find(x=>x.recipient_id===owner&&["pending","spam"].includes(x.status))
  ??rows.find(x=>x.sender_id===owner)??rows[0];
 if(!chosen)return {kind:contacts.has(other)?"accepted":"none",request:null};
 const request:MessageRequest={id:chosen.id,senderId:chosen.sender_id,recipientId:chosen.recipient_id,
  senderName:"",body:chosen.body,status:chosen.status,createdAt:chosen.created_at};
 if(chosen.status==="accepted")return {kind:"accepted",request};
 if(contacts.has(other)){
  const pending=rows.find(r=>r.status==="pending");
  return {kind:"accepted",request:pending?{id:pending.id,senderId:pending.sender_id,recipientId:pending.recipient_id,senderName:"",body:pending.body,status:pending.status,createdAt:pending.created_at}:null};
 }
 if(chosen.recipient_id===owner&&["pending","spam"].includes(chosen.status))return {kind:"incoming",request};
 if(chosen.sender_id===owner&&["pending","spam"].includes(chosen.status))return {kind:"outgoing",request};
 return {kind:"closed",request};
}
export async function sendContactRequest(other:string,body:string,expectedOwner?:string):Promise<MessageRequest>{
 const owner=await uid(),text=body.trim();
 if(expectedOwner&&owner!==expectedOwner)throw Error("La sesión cambió.");
 if(!text||text.length>500)throw Error("La solicitud admite un único mensaje de hasta 500 caracteres.");
 const db=requireSupabase();
 const {data,error}=await db.from("jobeen_message_requests" as never)
  .insert({sender_id:owner,recipient_id:other,body:text} as never).select(FIELDS).single();
 if(error){
  if(error.code==="23505")throw Error("Ya enviaste una solicitud a esta persona.");
  throw error;
 }
 const row=data as unknown as RequestRow;
 return {id:row.id,senderId:row.sender_id,recipientId:row.recipient_id,
  senderName:"",body:row.body,status:row.status,createdAt:row.created_at};
}
export async function decideMessageRequest(id:string,status:"accepted"|"declined"|"spam"|"reported"){
 const owner=await uid();
 const {data,error}=await requireSupabase().from("jobeen_message_requests" as never)
  .update({status} as never).eq("id",id).eq("recipient_id",owner).select("id").maybeSingle();
 if(error)throw error;
 if(!data)throw Error("Solicitud no encontrada o no autorizada.");
}
export async function loadMessagePrivacy():Promise<MessagePrivacy>{
 const owner=await uid();
 const {data,error}=await requireSupabase().from("jobeen_message_privacy" as never)
  .select("requests_from,filter_spam").eq("user_id",owner).maybeSingle();
 if(error)throw error;
 const row=data as {requests_from:MessagePrivacy["requestsFrom"];filter_spam:boolean}|null;
 return {requestsFrom:row?.requests_from??"all",filterSpam:row?.filter_spam??true};
}
export async function saveMessagePrivacy(settings:MessagePrivacy){
 const db=requireSupabase(),owner=await uid();
 const {data:existing,error:readError}=await db.from("jobeen_message_privacy" as never)
  .select("user_id").eq("user_id",owner).maybeSingle();
 if(readError)throw readError;
 const query=existing
  ?db.from("jobeen_message_privacy" as never).update({requests_from:settings.requestsFrom,filter_spam:settings.filterSpam} as never).eq("user_id",owner)
  :db.from("jobeen_message_privacy" as never).insert({user_id:owner,requests_from:settings.requestsFrom,filter_spam:settings.filterSpam} as never);
 const {error}=await query;
 if(error)throw error;
}
export async function loadJShopSpamIds():Promise<Set<string>>{
 const owner=await uid(),db=requireSupabase();
 const {data,error}=await db.from("jobeen_jshop_spam" as never)
  .select("conversation_id").eq("owner_id",owner).eq("is_spam",true).limit(500);
 if(error)throw error;
 return new Set(((data??[]) as unknown as {conversation_id:string}[]).map(x=>x.conversation_id));
}
export async function markJShopSpam(conversation:string,flag:boolean){
 const owner=await uid(),db=requireSupabase();
 const {data:previous,error:readError}=await db.from("jobeen_jshop_spam" as never)
  .select("conversation_id").eq("conversation_id",conversation).eq("owner_id",owner).maybeSingle();
 if(readError)throw readError;
 const query=previous
  ?db.from("jobeen_jshop_spam" as never).update({is_spam:flag} as never).eq("conversation_id",conversation).eq("owner_id",owner)
  :db.from("jobeen_jshop_spam" as never).insert({conversation_id:conversation,owner_id:owner,is_spam:flag} as never);
 const {error}=await query;
 if(error)throw error;
}
export async function reportMessageUser(other:string,reason:"spam"|"estafa"|"acoso"){
 const owner=await uid(),db=requireSupabase();
 const {error}=await db.from("reports" as never).insert({reporter_id:owner,subject_id:other,reason:"mensaje:"+reason} as never);
 if(error)throw error;
}
export async function blockMessageUser(other:string){
 const owner=await uid(),db=requireSupabase();
 if(owner===other)throw Error("No puedes bloquear tu propia cuenta.");
 const {error}=await db.from("blocks" as never).insert({blocker_id:owner,blocked_id:other} as never);
 if(error&&error.code!=="23505")throw error;
}
