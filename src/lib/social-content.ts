import * as ImageManipulator from "expo-image-manipulator";
import {requireSupabase} from "./supabase";
import {loadPublishedMedia,type PublishedMedia} from "./safety-api";

const POSTS_BUCKET="photo-posts";
const STORIES_BUCKET="jobeen-story-media";

export type FeedPostKind="text"|"photos"|"video"|"live";
export type StoryKind="text"|"photo"|"video";
export type FeedPost={
 id:string;authorId:string;authorName:string;authorHandle:string;body:string;kind:FeedPostKind;
 photoUrls:string[];mediaId:string|null;createdAt:string;
};
export type SocialStory={
 id:string;authorId:string;authorName:string;authorHandle:string;kind:StoryKind;body:string;
 imageUrl:string|null;mediaId:string|null;createdAt:string;expiresAt:string;
};
type FeedRow={id:string;author_id:string;body:string;kind:FeedPostKind;photo_paths:string[];work_media_id:string|null;created_at:string};
type StoryRow={id:string;author_id:string;kind:StoryKind;body:string;photo_path:string|null;work_media_id:string|null;created_at:string;expires_at:string};

async function namesFor(ids:string[]){
 const db=requireSupabase();const uniq=[...new Set(ids)];
 if(!uniq.length)return new Map<string,{name:string;handle:string}>();
 const [profiles,handles]=await Promise.all([
  db.from("profiles").select("id,display_name").in("id",uniq),
  db.from("jcard_profiles").select("profile_id,handle").in("profile_id",uniq)
 ]);
 if(profiles.error)throw profiles.error;
 if(handles.error)throw handles.error;
 const hs=new Map((handles.data??[]).map(x=>[x.profile_id,x.handle??""]));
 return new Map((profiles.data??[]).map(x=>[x.id,{name:x.display_name??"Profesional",handle:hs.get(x.id)??""}]));
}
export async function currentSocialUser():Promise<string>{
 const {data,error}=await requireSupabase().auth.getUser();
 if(error||!data.user)throw new Error("Inicia sesión para crear contenido.");
 return data.user.id;
}
export async function loadHomePosts():Promise<FeedPost[]>{
 const db=requireSupabase();
 const {data,error}=await db.from("jobeen_feed_posts" as never)
  .select("id,author_id,body,kind,photo_paths,work_media_id,created_at")
  .is("removed_at",null).order("created_at",{ascending:false}).limit(80);
 if(error)throw error;
 const rows=(data??[]) as unknown as FeedRow[];
 const authors=await namesFor(rows.map(r=>r.author_id));
 return rows.map(row=>({
  id:row.id,authorId:row.author_id,authorName:authors.get(row.author_id)?.name??"Profesional",
  authorHandle:authors.get(row.author_id)?.handle??"",body:row.body,kind:row.kind,
  photoUrls:(row.photo_paths??[]).map(path=>db.storage.from(POSTS_BUCKET).getPublicUrl(path).data.publicUrl),
  mediaId:row.work_media_id,createdAt:row.created_at
 }));
}
export async function loadActiveStories():Promise<SocialStory[]>{
 const db=requireSupabase();const now=new Date().toISOString();
 const {data,error}=await db.from("jobeen_stories" as never)
  .select("id,author_id,kind,body,photo_path,work_media_id,created_at,expires_at")
  .gt("expires_at",now).order("created_at",{ascending:false}).limit(70);
 if(error)throw error;
 const rows=(data??[]) as unknown as StoryRow[];
 const authors=await namesFor(rows.map(r=>r.author_id));
 const photos=await Promise.all(rows.map(async row=>{
  if(!row.photo_path)return null;
  const {data:link,error:linkError}=await db.storage.from(STORIES_BUCKET).createSignedUrl(row.photo_path,120);
  return linkError?null:link.signedUrl;
 }));
 return rows.map((row,index)=>({
  id:row.id,authorId:row.author_id,authorName:authors.get(row.author_id)?.name??"Profesional",
  authorHandle:authors.get(row.author_id)?.handle??"",kind:row.kind,body:row.body,
  imageUrl:photos[index],mediaId:row.work_media_id,createdAt:row.created_at,expiresAt:row.expires_at
 }));
}
async function uploadPhoto(owner:string,uri:string,bucket:string){
 const normalized=await ImageManipulator.manipulateAsync(uri,[{resize:{width:1440}}],{format:ImageManipulator.SaveFormat.JPEG,compress:0.76,base64:true});
 if(!normalized.base64)throw Error("No se pudo preparar la fotografía.");
 const data=atob(normalized.base64);const bytes=new Uint8Array(data.length);
 for(let i=0;i<data.length;i++)bytes[i]=data.charCodeAt(i);
 if(bytes.byteLength>10*1024*1024)throw Error("La fotografía supera 10 MB.");
 const path=owner+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,11)+".jpg";
 const {error}=await requireSupabase().storage.from(bucket).upload(path,bytes,{contentType:"image/jpeg",upsert:false});
 if(error)throw error;
 return path;
}
export async function shareApprovedMedia(kind:"video"|"live",owner:string):Promise<PublishedMedia[]>{
 const entries=await loadPublishedMedia();
 return entries.filter(x=>x.creator_id===owner&&x.kind===kind);
}
export async function publishHomePost(payload:{body:string;photos:string[];kind:FeedPostKind;mediaId?:string|null}):Promise<void>{
 const db=requireSupabase(),owner=await currentSocialUser(),uploaded:string[]=[];
 if(payload.kind==="text"&&!payload.body.trim())throw Error("Escribe un mensaje para publicar.");
 if(payload.kind==="photos"&&(!payload.photos.length||payload.photos.length>5))throw Error("Añade entre 1 y 5 fotografías.");
 if((payload.kind==="video"||payload.kind==="live")&&!payload.mediaId)throw Error("Selecciona un video o Live publicado y aprobado.");
 try{
  if(payload.kind==="photos")for(const uri of payload.photos)uploaded.push(await uploadPhoto(owner,uri,POSTS_BUCKET));
  const {error}=await db.from("jobeen_feed_posts" as never).insert({
   author_id:owner,body:payload.body.trim().slice(0,2000),kind:payload.kind,
   photo_paths:uploaded,work_media_id:payload.mediaId??null
  } as never);
  if(error)throw error;
 }catch(e){
  if(uploaded.length)await db.storage.from(POSTS_BUCKET).remove(uploaded).catch(()=>{});
  throw e;
 }
}
export async function publishStory(payload:{body:string;kind:StoryKind;photoUri?:string;mediaId?:string|null}):Promise<void>{
 const db=requireSupabase(),owner=await currentSocialUser();
 if(payload.kind==="text"&&!payload.body.trim())throw Error("Escribe algo para tu historia.");
 if(payload.kind==="photo"&&!payload.photoUri)throw Error("Selecciona una foto.");
 if(payload.kind==="video"&&!payload.mediaId)throw Error("Selecciona un video aprobado.");
 let path:string|null=null;
 try{
  if(payload.kind==="photo")path=await uploadPhoto(owner,payload.photoUri!,STORIES_BUCKET);
  const {error}=await db.from("jobeen_stories" as never).insert({
   author_id:owner,kind:payload.kind,body:payload.body.trim().slice(0,280),
   photo_path:path,work_media_id:payload.mediaId??null
  } as never);
  if(error)throw error;
 }catch(e){
  if(path)await db.storage.from(STORIES_BUCKET).remove([path]).catch(()=>{});
  throw e;
 }
}
export async function deleteStory(id:string){
 const db=requireSupabase(),owner=await currentSocialUser();
 const {data,error}=await db.from("jobeen_stories" as never).delete().eq("id",id).eq("author_id",owner).select("photo_path");
 if(error)throw error;
 const paths=((data??[]) as unknown as {photo_path:string|null}[]).map(x=>x.photo_path).filter((p):p is string=>!!p);
 if(paths.length)await db.storage.from(STORIES_BUCKET).remove(paths).catch(()=>{});
}
export async function deleteHomePost(id:string){
 const db=requireSupabase(),owner=await currentSocialUser();
 const {data,error}=await db.from("jobeen_feed_posts" as never).update({removed_at:new Date().toISOString()} as never)
 .eq("id",id).eq("author_id",owner).select("photo_paths").maybeSingle();
 if(error)throw error;
 if(!data)throw Error("No se pudo eliminar la publicación.");
}
