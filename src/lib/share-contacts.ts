import {myContacts,type ContactPerson} from "./professional-contacts";
import {loadContactAccess,sendContactRequest} from "./message-requests";
import {requireSupabase} from "./supabase";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";

export type ShareRecipient=Pick<ContactPerson,"id"|"name">;
export type ShareResult={sent:string[];requested:string[];failed:{id:string;reason:string}[]};

/** Only accepted professional contacts are eligible. No phone-book permission is required. */
export async function loadShareRecipients(expectedScope?:MessageScope):Promise<ShareRecipient[]>{
 const scope=await captureMessageScope(expectedScope);
 const contacts=await myContacts(scope);await assertMessageScope(scope);
 return contacts.filter(c=>c.status==="accepted")
  .map(c=>({id:c.id,name:c.name}))
  .sort((a,b)=>a.name.localeCompare(b.name,"es"));
}

/** Send with the existing direct-message permissions and RLS.
 * A professional contact without an accepted message thread receives a message
 * request, never an invented successful direct delivery.
 */
export async function sendToShareRecipients(ids:string[],message:string,expectedScope?:MessageScope):Promise<ShareResult>{
 const scope=await captureMessageScope(expectedScope);
 const recipients=[...new Set(ids)].slice(0,50);
 const text=message.trim();
 if(!text)throw Error("No hay contenido para compartir.");
 if(!recipients.length)throw Error("Seleccioná al menos un contacto.");
 const allowed=new Set((await loadShareRecipients(scope)).map(c=>c.id));
 const db=requireSupabase();
 await assertMessageScope(scope);
 const result:ShareResult={sent:[],requested:[],failed:[]};
 for(const id of recipients){
  await assertMessageScope(scope);
  if(!allowed.has(id)){result.failed.push({id,reason:"El usuario ya no es un contacto aceptado."});continue;}
  try{
   const access=await loadContactAccess(id,scope);
   await assertMessageScope(scope);
   if(access.kind==="accepted"){
    const {error}=await db.from("jobeen_direct_messages" as never)
     .insert({sender_id:scope.owner,recipient_id:id,body:text.slice(0,2000),jshop_conversation_id:null} as never);
    if(error)throw error;
    await assertMessageScope(scope);result.sent.push(id);
   }else if(access.kind==="none"){
    await sendContactRequest(id,text.slice(0,500),scope.owner,scope);
    await assertMessageScope(scope);
    result.requested.push(id);
   }else{
    result.failed.push({id,reason:access.kind==="outgoing"?"Solicitud de mensaje pendiente.":access.kind==="incoming"?"Aceptá la solicitud de mensaje primero.":"La conversación no admite mensajes."});
   }
  }catch(e){
   await assertMessageScope(scope);
   result.failed.push({id,reason:e instanceof Error?e.message:"No se pudo compartir con este contacto."});
  }
 }
 await assertMessageScope(scope);return result;
}
