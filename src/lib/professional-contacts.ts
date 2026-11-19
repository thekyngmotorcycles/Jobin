import {requireSupabase} from "./supabase";
export type ContactStatus="pending"|"accepted"|"declined";
export type ContactRequest={
 id:string;requester_id:string;recipient_id:string;status:ContactStatus;
 created_at:string;responded_at:string|null;
};
export type ContactPerson={id:string;name:string;requestId:string;direction:"incoming"|"outgoing"|"accepted";status:ContactStatus};

async function viewer(){
 const {data:{user},error}=await requireSupabase().auth.getUser();
 if(error)throw error;
 if(!user)throw Error("Inicia sesión para gestionar tus contactos profesionales.");
 return user.id;
}
export async function contactState(other:string):Promise<{mine:string;request:ContactRequest|null}>{
 const mine=await viewer();
 if(mine===other)return {mine,request:null};
 const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .select("*").in("requester_id",[mine,other]).in("recipient_id",[mine,other]).maybeSingle();
 if(error)throw error;
 return {mine,request:(data as ContactRequest|null)??null};
}
export async function inviteContact(other:string):Promise<void>{
 const mine=await viewer();
 if(mine===other)throw Error("No puedes agregarte como contacto.");
 const {error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .insert({requester_id:mine,recipient_id:other,status:"pending"} as never);
 if(error)throw Error(error.code==="23505"?"Ya existe una invitación o relación entre estas cuentas.":error.message);
}
export async function replyContactRequest(id:string,accept:boolean):Promise<void>{
 const mine=await viewer();
 const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .update({status:accept?"accepted":"declined"} as never)
  .eq("id",id).eq("recipient_id",mine).eq("status","pending")
  .select("id").maybeSingle();
 if(error)throw Error(error.message);
 if(!data)throw Error("La invitación ya fue respondida o no está disponible.");
}
export async function removeContactRequest(id:string):Promise<void>{
 const mine=await viewer();
 const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .delete().eq("id",id).or(`requester_id.eq.${mine},recipient_id.eq.${mine}`)
  .select("id").maybeSingle();
 if(error)throw Error(error.message);
 if(!data)throw Error("La relación ya fue eliminada o no está disponible.");
}
export async function contactCount(target:string):Promise<number>{
 if(!target)return 0;
 const {data,error}=await requireSupabase().rpc("jobeen_contact_count" as never,{p_profile:target} as never);
 if(error)throw error;
 return Number(data??0);
}
export async function myContactRequests():Promise<ContactRequest[]>{
 const mine=await viewer();
 const {data,error}=await requireSupabase().from("jobeen_contact_requests" as never)
  .select("id,requester_id,recipient_id,status,created_at,responded_at")
  .or(`requester_id.eq.${mine},recipient_id.eq.${mine}`)
  .order("created_at",{ascending:false}).limit(300);
 if(error)throw error;
 return (data??[]) as ContactRequest[];
}
export async function myContacts():Promise<ContactPerson[]>{
 const mine=await viewer();
 const rows=(await myContactRequests()).filter(x=>x.status!=="declined");
 const others=[...new Set(rows.map(x=>x.requester_id===mine?x.recipient_id:x.requester_id))];
 const names=new Map<string,string>();
 if(others.length){
  const {data,error}=await requireSupabase().from("profiles").select("id,display_name").in("id",others);
  if(error)throw error;
  for(const p of data??[])names.set(p.id,p.display_name||"Usuario de Jobeen");
 }
 return rows.map(r=>{
  const id=r.requester_id===mine?r.recipient_id:r.requester_id;
  const direction=r.status==="accepted"?"accepted":r.recipient_id===mine?"incoming":"outgoing";
  return {id,name:names.get(id)??"Usuario de Jobeen",requestId:r.id,direction,status:r.status};
 });
}
