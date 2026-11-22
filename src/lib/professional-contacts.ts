import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
export type ContactStatus="pending"|"accepted"|"declined";
export type ContactRequest={
 id:string;requester_id:string;recipient_id:string;status:ContactStatus;
 created_at:string;responded_at:string|null;
};
export type ContactPerson={id:string;name:string;requestId:string;direction:"incoming"|"outgoing"|"accepted";status:ContactStatus};

export async function contactState(other:string,expectedScope?:MessageScope):Promise<{mine:string;request:ContactRequest|null}>{
 const scope=await captureMessageScope(expectedScope),mine=scope.owner;
 if(mine===other)return {mine,request:null};
 const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .select("*").in("requester_id",[mine,other]).in("recipient_id",[mine,other]).maybeSingle();
 if(error)throw error;
 await assertMessageScope(scope);
 const request=(data as ContactRequest|null)??null;
 if(request&&!((request.requester_id===mine&&request.recipient_id===other)||(request.recipient_id===mine&&request.requester_id===other)))throw Error("Contacto no autorizado.");
 return {mine,request};
}
export async function inviteContact(other:string,expectedScope?:MessageScope):Promise<void>{
 const scope=await captureMessageScope(expectedScope),mine=scope.owner;
 if(mine===other)throw Error("No puedes agregarte como contacto.");
 const {error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .insert({requester_id:mine,recipient_id:other,status:"pending"} as never);
 if(error)throw Error(error.code==="23505"?"Ya existe una invitación o relación entre estas cuentas.":error.message);
 await assertMessageScope(scope);
}
export async function replyContactRequest(id:string,accept:boolean,expectedScope?:MessageScope):Promise<void>{
 const scope=await captureMessageScope(expectedScope),mine=scope.owner;
 const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .update({status:accept?"accepted":"declined"} as never)
  .eq("id",id).eq("recipient_id",mine).eq("status","pending")
  .select("id").maybeSingle();
 if(error)throw Error(error.message);
 await assertMessageScope(scope);
 if(!data)throw Error("La invitación ya fue respondida o no está disponible.");
}
export async function removeContactRequest(id:string,expectedScope?:MessageScope):Promise<void>{
 const scope=await captureMessageScope(expectedScope),mine=scope.owner;
 const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .delete().eq("id",id).or(`requester_id.eq.${mine},recipient_id.eq.${mine}`)
  .select("id").maybeSingle();
 if(error)throw Error(error.message);
 await assertMessageScope(scope);
 if(!data)throw Error("La relación ya fue eliminada o no está disponible.");
}
export async function contactCount(target:string):Promise<number>{
 if(!target)return 0;
 const {data,error}=await requireSupabase().rpc("jobeen_contact_count" as never,{p_profile:target} as never);
 if(error)throw error;
 return Number(data??0);
}
export async function myContactRequests(expectedScope?:MessageScope):Promise<ContactRequest[]>{
 const scope=await captureMessageScope(expectedScope),mine=scope.owner;
 const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .select("id,requester_id,recipient_id,status,created_at,responded_at")
  .or(`requester_id.eq.${mine},recipient_id.eq.${mine}`)
  .order("created_at",{ascending:false}).limit(300);
 if(error)throw error;
 await assertMessageScope(scope);
 return ((data??[]) as ContactRequest[]).filter(r=>r.requester_id===mine||r.recipient_id===mine);
}
export async function myContacts(expectedScope?:MessageScope):Promise<ContactPerson[]>{
 const scope=await captureMessageScope(expectedScope),mine=scope.owner;
 const rows=(await myContactRequests(scope)).filter(x=>x.status!=="declined");
 const others=[...new Set(rows.map(x=>x.requester_id===mine?x.recipient_id:x.requester_id))];
 const names=new Map<string,string>();
 if(others.length){
  await assertMessageScope(scope);
  const {data,error}=await requireSupabase().from("profiles").select("id,display_name").in("id",others);
  if(error)throw error;
  for(const p of data??[])names.set(p.id,p.display_name||"Usuario de Jobeen");
 }
 await assertMessageScope(scope);
 return rows.map(r=>{
  const id=r.requester_id===mine?r.recipient_id:r.requester_id;
  const direction=r.status==="accepted"?"accepted":r.recipient_id===mine?"incoming":"outgoing";
  return {id,name:names.get(id)??"Usuario de Jobeen",requestId:r.id,direction,status:r.status};
 });
}
