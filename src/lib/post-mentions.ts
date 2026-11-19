import {requireSupabase} from "./supabase";
export type PostMention={id:string;name:string;handle:string;company:boolean};
export async function searchPostMentions(search:string):Promise<PostMention[]>{
 const query=search.trim().replace(/[%(),]/g,"").slice(0,60);
 if(query.length<2)return [];
 const db=requireSupabase();
 const {data:profiles,error}=await db.from("profiles")
  .select("id,display_name,account_type")
  .ilike("display_name","%"+query+"%").is("deactivated_at",null).limit(15);
 if(error)throw error;
 const ids=(profiles??[]).map(p=>p.id);
 if(!ids.length)return [];
 const {data:handles,error:handleError}=await db.from("jcard_profiles")
  .select("profile_id,handle").in("profile_id",ids);
 if(handleError)throw handleError;
 const byId=new Map((handles??[]).map(p=>[p.profile_id,p.handle??""]));
 return (profiles??[]).map(p=>({id:p.id,name:p.display_name??"Profesional",
  handle:byId.get(p.id)??"",company:p.account_type==="company"}));
}
