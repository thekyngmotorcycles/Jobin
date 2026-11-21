import {requireSupabase} from "./supabase";
import {loadPublicCard} from "./professional-api";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
import {formatJShopPrice,type JShopCurrency,type JShopListing} from "./jshop-model";

/** One private JShop thread per listing and buyer. Snapshot stays when listing is removed. */
export type JShopConversation={
 id:string;listingId:string|null;buyerId:string;sellerId:string;
 title:string;price:number;currency:JShopCurrency;photoUrl:string|null;createdAt:string;
};
export type JShopInboxThread=JShopConversation&{
 otherId:string;otherName:string;side:"Compras"|"Ventas";
 lastMessage:string;lastMessageAt:string|null;
};
type ConversationRow={
 id:string;listing_id:string|null;buyer_id:string;seller_id:string;
 listing_title:string;listing_price:number|string;listing_currency:JShopCurrency;
 listing_photo_path:string|null;created_at:string;
};
type MessageRow={jshop_conversation_id:string;body:string;created_at:string};
const selection="id,listing_id,buyer_id,seller_id,listing_title,listing_price,listing_currency,listing_photo_path,created_at";

function hydrate(row:ConversationRow):JShopConversation{
 return {id:row.id,listingId:row.listing_id,buyerId:row.buyer_id,sellerId:row.seller_id,
  title:row.listing_title,price:Number(row.listing_price),currency:row.listing_currency,
  photoUrl:row.listing_photo_path?requireSupabase().storage.from("jshop-photos").getPublicUrl(row.listing_photo_path).data.publicUrl:null,
  createdAt:row.created_at};
}
export async function startJShopConversation(item:JShopListing,expectedScope?:MessageScope):Promise<JShopConversation>{
 const scope=await captureMessageScope(expectedScope),{owner}=scope,db=requireSupabase();
 const checked=async(row:ConversationRow)=>{
  await assertMessageScope(scope);
  if(row.buyer_id!==owner||row.seller_id!==item.sellerId||row.listing_id!==item.id)throw Error("La conversación no corresponde al anuncio.");
  return hydrate(row);
 };
 if(item.sellerId===owner)throw Error("No puedes contactar tu propio anuncio.");
 if(item.status!=="published")throw Error("El anuncio no admite mensajes en este momento.");
 const {data:existing,error:readError}=await db.from("jshop_conversations" as never)
  .select(selection).eq("listing_id",item.id).eq("buyer_id",owner).maybeSingle();
 if(readError)throw readError;
 await assertMessageScope(scope);
 if(existing)return checked(existing as unknown as ConversationRow);
 const {data,error}=await db.from("jshop_conversations" as never)
  .insert({listing_id:item.id,buyer_id:owner} as never).select(selection).single();
 if(error){
  // Concurrent taps or devices can create the same thread. Retrieve the unique result.
  if(error.code==="23505"){
   await assertMessageScope(scope);
   const retry=await db.from("jshop_conversations" as never).select(selection)
    .eq("listing_id",item.id).eq("buyer_id",owner).single();
   if(retry.error)throw retry.error;
   return checked(retry.data as unknown as ConversationRow);
  }
  throw error;
 }
 return checked(data as unknown as ConversationRow);
}
export async function loadJShopConversation(id:string,expectedScope?:MessageScope):Promise<JShopConversation>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),{owner}=scope;
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))throw Error("Conversación inválida.");
 const {data,error}=await db.from("jshop_conversations" as never).select(selection).eq("id",id).maybeSingle();
 if(error)throw error;
 if(!data)throw Error("No tienes acceso a esta conversación.");
 await assertMessageScope(scope);
 const hydrated=hydrate(data as unknown as ConversationRow);
 if(hydrated.buyerId!==owner&&hydrated.sellerId!==owner)throw Error("No tienes acceso a esta conversación.");
 return hydrated;
}
export async function loadJShopInbox(expectedScope?:MessageScope):Promise<JShopInboxThread[]>{
 const db=requireSupabase(),scope=await captureMessageScope(expectedScope),{owner}=scope;
 const {data,error}=await db.from("jshop_conversations" as never)
  .select(selection).or(`buyer_id.eq.${owner},seller_id.eq.${owner}`).order("created_at",{ascending:false}).limit(100);
 if(error)throw error;
 await assertMessageScope(scope);
 const rows=((data??[]) as unknown as ConversationRow[]).filter(r=>r.buyer_id===owner||r.seller_id===owner);
 if(!rows.length)return [];
 const ids=rows.map(row=>row.id);
 await assertMessageScope(scope);
 const {data:messages,error:msgError}=await db.from("jobeen_direct_messages" as never)
  .select("jshop_conversation_id,body,created_at").in("jshop_conversation_id",ids)
  .order("created_at",{ascending:false}).limit(350);
 if(msgError)throw msgError;
 const newest=new Map<string,MessageRow>();
 for(const message of (messages??[]) as unknown as MessageRow[]){
  if(!newest.has(message.jshop_conversation_id))newest.set(message.jshop_conversation_id,message);
 }
 const people=[...new Set(rows.map(row=>row.buyer_id===owner?row.seller_id:row.buyer_id))];
 const names=new Map(await Promise.all(people.map(async id=>{
  const card=await loadPublicCard(id).catch(()=>null);
  return [id,card?.name??"Usuario de Jobeen"] as const;
 })));
 await assertMessageScope(scope);
 return rows.map(row=>{
  const c=hydrate(row),otherId=row.buyer_id===owner?row.seller_id:row.buyer_id,latest=newest.get(row.id);
  return {...c,otherId,otherName:names.get(otherId)??"Usuario de Jobeen",
   side:row.buyer_id===owner?"Compras" as const:"Ventas" as const,
   lastMessage:latest?.body??"Conversación sobre este artículo",
   lastMessageAt:latest?.created_at??null};
 }).sort((a,b)=>Date.parse(b.lastMessageAt??b.createdAt)-Date.parse(a.lastMessageAt??a.createdAt));
}
export function jshopConversationPrice(c:Pick<JShopConversation,"price"|"currency">){
 return formatJShopPrice(c.price,c.currency);
}
