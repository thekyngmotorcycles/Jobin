import {requireSupabase} from "./supabase";
import {myContacts,type ContactPerson} from "./professional-contacts";
import {loadContactAccess,sendContactRequest} from "./message-requests";

export type SharedJCardSide="personal"|"business";
export type SharedJCard={userId:string;side:SharedJCardSide;name:string;url:string;message:string};
export type ShareRecipient={id:string;name:string;lastMessageAt:string|null};
export type ShareSendOutcome={sent:string[];failed:{id:string;name:string;reason:string}[];requests:string[]};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LINK=/jobin:\/\/jcard\?user=([0-9a-f-]{36})&card=(personal|business)/i;
export const MAX_SHARE_RECIPIENTS=5;

export function buildSharedJCard(targetId:string,side:SharedJCardSide,name:string):SharedJCard{
 if(!UUID.test(targetId)||!["personal","business"].includes(side))throw Error("La JCard no está disponible para compartir.");
 const label=(name.trim()||"Jobeen").replace(/[\r\n]+/g," ").slice(0,120);
 const url="jobin://jcard?user="+targetId+"&card="+side;
 const message="JCard "+(side==="business"?"de negocio":"personal")+" de "+label+": "+url;
 return {userId:targetId,side,name:label,url,message};
}
export function sharedJCardFromMessage(body:string):{userId:string;side:SharedJCardSide}|null{
 const found=body.match(LINK);
 if(!found||!UUID.test(found[1]))return null;
 return {userId:found[1],side:found[2].toLowerCase() as SharedJCardSide};
}
/** Only accepted professional contacts appear in sharing suggestions.
 * Existing conversations are used exclusively for sorting, never sent to the
 * share panel or shown to other people.
 */
export async function shareContactSuggestions():Promise<ShareRecipient[]>{
 const [contacts,auth]=await Promise.all([myContacts(),requireSupabase().auth.getUser()]);
 const uid=auth.data.user?.id;
 if(auth.error)throw auth.error;
 if(!uid)throw Error("Inicia sesión para compartir con tus contactos.");
 const accepted=contacts.filter((c:ContactPerson)=>c.status==="accepted"&&c.id!==uid);
 if(!accepted.length)return [];
 const lastSeen=new Map<string,string>();
 try{
  const {data,error}=await requireSupabase().from("jobeen_direct_messages" as never)
   .select("sender_id,recipient_id,created_at").or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
   .order("created_at",{ascending:false}).limit(250);
  if(!error)for(const m of (data??[]) as {sender_id:string;recipient_id:string;created_at:string}[]){
   const other=m.sender_id===uid?m.recipient_id:m.sender_id;
   if(!lastSeen.has(other))lastSeen.set(other,m.created_at);
  }
 }catch{/* Contact suggestions remain available if message history is offline. */}
 return accepted.map(c=>({id:c.id,name:c.name,lastMessageAt:lastSeen.get(c.id)??null}))
  .sort((a,b)=>(b.lastMessageAt??"").localeCompare(a.lastMessageAt??"")||a.name.localeCompare(b.name,"es"))
  .slice(0,100);
}
/** Respects pending requests, blocks and existing message privacy.
 * Sending a first message creates one message request; it is never treated as
 * an accepted conversation. Partial failures are explicitly returned.
 */
export async function sendJCardToContacts(card:SharedJCard,recipients:ShareRecipient[]):Promise<ShareSendOutcome>{
 if(!recipients.length||recipients.length>MAX_SHARE_RECIPIENTS)throw Error("Selecciona entre 1 y 5 contactos.");
 const auth=await requireSupabase().auth.getUser(),uid=auth.data.user?.id;
 if(auth.error||!uid)throw Error("Inicia sesión para enviar JCards.");
 if(!UUID.test(card.userId)||!["personal","business"].includes(card.side))throw Error("Enlace de JCard inválido.");
 const unique=[...new Set(recipients.map(r=>r.id))];
 if(unique.length!==recipients.length||unique.some(id=>!UUID.test(id)||id===uid))throw Error("Selección de destinatarios inválida.");
 // A contact list may change while the panel is open.
 const accepted=new Set((await myContacts()).filter(c=>c.status==="accepted").map(c=>c.id));
 const result:ShareSendOutcome={sent:[],failed:[],requests:[]};
 for(const person of recipients){
  if(!accepted.has(person.id)){result.failed.push({id:person.id,name:person.name,reason:"Ya no figura como contacto aceptado."});continue;}
  try{
   const access=await loadContactAccess(person.id);
   if(access.kind==="none"){
    await sendContactRequest(person.id,card.message);
    result.sent.push(person.id);result.requests.push(person.id);
   }else if(access.kind==="accepted"){
    const {error}=await requireSupabase().from("jobeen_direct_messages" as never)
     .insert({sender_id:uid,recipient_id:person.id,body:card.message,jshop_conversation_id:null} as never);
    if(error)throw error;
    result.sent.push(person.id);
   }else{
    result.failed.push({id:person.id,name:person.name,reason:"Hay una solicitud pendiente o el chat no está disponible."});
   }
  }catch(e){result.failed.push({id:person.id,name:person.name,reason:e instanceof Error?e.message:"No se pudo enviar la tarjeta."});}
 }
 return result;
}
