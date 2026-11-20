import {requireSupabase} from "./supabase";
export type PostMention={id:string;name:string;handle:string;company:boolean;kind:"personal"|"business";category?:string};
export type PostBusinessMention={ownerId:string;label:string};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validBusinessMentions(value:unknown):PostBusinessMention[]{
 if(!Array.isArray(value))return [];
 return value.filter((v):v is PostBusinessMention=>Boolean(v&&typeof v.ownerId==="string"&&UUID.test(v.ownerId)&&typeof v.label==="string"&&v.label.startsWith("@")&&v.label.length<=75)).slice(0,20);
}
export async function searchPostMentions(search:string):Promise<PostMention[]>{
 const query=search.trim().replace(/[%(),\\"]/g,"").slice(0,60);
 if(query.length<2)return [];
 const db=requireSupabase();
 const [named,personalHandles,businesses]=await Promise.all([
  db.from("profiles").select("id,display_name,account_type").ilike("display_name","%"+query+"%").is("deactivated_at",null).limit(15),
  db.from("jcard_profiles").select("profile_id,handle").ilike("handle","%"+query+"%").limit(15),
  db.from("jcard_business_details" as never).select("owner_id,name,business_handle,category")
   .or("name.ilike.%"+query+"%,business_handle.ilike.%"+query+"%").limit(15)
 ]);
 if(named.error)throw named.error;
 if(personalHandles.error)throw personalHandles.error;
 if(businesses.error)throw businesses.error;
 type B={owner_id:string;name:string;business_handle:string|null;category:string|null};
 const cards=(businesses.data??[]) as unknown as B[];
 const ids=[...new Set([...(named.data??[]).map(x=>x.id),...(personalHandles.data??[]).map(x=>x.profile_id),...cards.map(x=>x.owner_id)])];
 if(!ids.length)return [];
 const [profiles,handles,visibility]=await Promise.all([
  db.from("profiles").select("id,display_name,account_type").in("id",ids).is("deactivated_at",null),
  db.from("jcard_profiles").select("profile_id,handle").in("profile_id",ids),
  db.from("jcard_visibility" as never).select("owner_id,business_enabled").in("owner_id",ids)
 ]);
 if(profiles.error)throw profiles.error;
 if(handles.error)throw handles.error;
 if(visibility.error)throw visibility.error;
 const active=new Map((profiles.data??[]).map(p=>[p.id,p]));
 const handleMap=new Map((handles.data??[]).map(p=>[p.profile_id,(p.handle??"").replace(/^@/,"")]));
 const enabled=new Map(((visibility.data??[]) as unknown as {owner_id:string;business_enabled:boolean}[]).map(p=>[p.owner_id,p.business_enabled]));
 const companyResults:PostMention[]=cards.filter(p=>active.has(p.owner_id)&&p.name?.trim()&&enabled.get(p.owner_id)!==false)
  .map(p=>({id:p.owner_id,name:p.name.trim(),handle:p.business_handle??"",company:true,kind:"business" as const,category:p.category??undefined}));
 const peopleIds=[...new Set([...(named.data??[]).map(x=>x.id),...(personalHandles.data??[]).map(x=>x.profile_id)])];
 const personResults:PostMention[]=peopleIds.filter(id=>active.has(id)).map(id=>{
  const p=active.get(id)!;
  return {id,name:p.display_name??"Profesional",handle:handleMap.get(id)??"",company:p.account_type==="company",kind:"personal" as const};
 });
 return [...companyResults,...personResults].slice(0,25);
}
