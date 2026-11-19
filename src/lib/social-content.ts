import * as ImageManipulator from "expo-image-manipulator";
import {requireSupabase} from "./supabase";
import {loadPublishedMedia,type PublishedMedia} from "./safety-api";

const POSTS_BUCKET="photo-posts";
const PRIVATE_POSTS_BUCKET="jobeen-private-post-photos";
export type FeedAudience="public"|"private";
const STORIES_BUCKET="jobeen-story-media";

export type FeedPostKind="text"|"photos"|"video"|"live";
export type StoryKind="text"|"photo"|"video";
export type FeedPost={
 id:string;authorId:string;authorName:string;authorHandle:string;body:string;kind:FeedPostKind;
 photoUrls:string[];mediaId:string|null;createdAt:string;
 likes:number;comments:number;shares:number;likedByViewer:boolean;
};
export type SocialStory={
 id:string;authorId:string;authorName:string;authorHandle:string;kind:StoryKind;body:string;
 imageUrl:string|null;mediaId:string|null;createdAt:string;expiresAt:string;
};
type FeedRow={id:string;author_id:string;body:string;kind:FeedPostKind;photo_paths:string[];photo_bucket:string;work_media_id:string|null;created_at:string};
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
export async function loadHomePosts(viewerId="",authorId?:string,postId?:string,postIds?:string[],offset=0):Promise<FeedPost[]>{
 const db=requireSupabase();
 const query=db.from("jobeen_feed_posts" as never)
  .select("id,author_id,body,kind,photo_paths,photo_bucket,work_media_id,created_at")
  .is("removed_at",null).order("created_at",{ascending:false}).range(offset,offset+(postId?0:79));
 const {data,error}=await (postId?query.eq("id",postId):postIds?.length?query.in("id",postIds):authorId?query.eq("author_id",authorId):query);
 if(error)throw error;
 const rows=(data??[]) as unknown as FeedRow[];
 const authors=await namesFor(rows.map(r=>r.author_id));
 const ids=rows.map(row=>row.id);
 type CountRow={post_id:string;likes:number|string;comments:number|string;shares:number|string};
 const [summary,liked]=ids.length?await Promise.all([
  db.from("jobeen_feed_engagement" as never).select("post_id,likes,comments,shares").in("post_id",ids),
  viewerId?db.from("jobeen_feed_likes" as never).select("post_id").in("post_id",ids).eq("profile_id",viewerId):Promise.resolve({data:[],error:null})
 ]):[{data:[],error:null},{data:[],error:null}];
 // Posts must remain visible during an additive backend migration.
 const counts=new Map(((summary.error?[]:summary.data??[]) as unknown as CountRow[]).map(x=>[x.post_id,x]));
 const viewerLikes=new Set(((liked.error?[]:liked.data??[]) as unknown as {post_id:string}[]).map(x=>x.post_id));
 // A private bucket is never served with getPublicUrl. Only viewers who
 // pass Storage RLS may request these short-lived links.
 const privatePaths=[...new Set(rows.filter(row=>row.photo_bucket===PRIVATE_POSTS_BUCKET)
  .flatMap(row=>row.photo_paths??[]))];
 const signedUrls=new Map<string,string>();
 if(privatePaths.length){
  const {data:links,error:linkError}=await db.storage.from(PRIVATE_POSTS_BUCKET).createSignedUrls(privatePaths,300);
  if(linkError)throw linkError;
  for(const link of links??[])if(link.signedUrl&&link.path)signedUrls.set(link.path,link.signedUrl);
 }
 return rows.map(row=>{
  const count=counts.get(row.id);
  return {
   id:row.id,authorId:row.author_id,authorName:authors.get(row.author_id)?.name??"Profesional",
   authorHandle:authors.get(row.author_id)?.handle??"",body:row.body,kind:row.kind,
   photoUrls:(row.photo_paths??[]).map(path=>row.photo_bucket===PRIVATE_POSTS_BUCKET?
    signedUrls.get(path)??"":db.storage.from(POSTS_BUCKET).getPublicUrl(path).data.publicUrl).filter(Boolean),
   mediaId:row.work_media_id,createdAt:row.created_at,
   likes:Number(count?.likes??0),comments:Number(count?.comments??0),shares:Number(count?.shares??0),
   likedByViewer:viewerLikes.has(row.id)
  };
 });
}
/** Load the owner's complete feed history in pages so profiles are not limited to 80 posts. */
export async function loadAllProfilePosts(viewerId:string,authorId:string):Promise<FeedPost[]>{
 const all:FeedPost[]=[];
 for(let offset=0;;offset+=80){
  const batch=await loadHomePosts(viewerId,authorId,undefined,undefined,offset);
  all.push(...batch);
  if(batch.length<80)break;
 }
 return all;
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
export async function publishHomePost(payload:{body:string;photos:string[];kind:FeedPostKind;mediaId?:string|null;audience?:FeedAudience;audienceFollowers?:boolean;audienceContacts?:boolean}):Promise<void>{
 const db=requireSupabase(),owner=await currentSocialUser(),uploaded:string[]=[];
 if(payload.kind==="text"&&!payload.body.trim())throw Error("Escribe un mensaje para publicar.");
 if(payload.kind==="photos"&&(!payload.photos.length||payload.photos.length>5))throw Error("Añade entre 1 y 5 fotografías.");
 if((payload.kind==="video"||payload.kind==="live")&&!payload.mediaId)throw Error("Selecciona un video o Live publicado y aprobado.");
 const privatePost=payload.audience==="private";
 if(privatePost&&!payload.audienceFollowers&&!payload.audienceContacts)throw Error("Selecciona seguidores, contactos o ambos.");
 if(privatePost&&(payload.kind==="video"||payload.kind==="live"))
  throw Error("Los videos y Lives aprobados solo pueden compartirse de forma pública.");
 const bucket=privatePost?PRIVATE_POSTS_BUCKET:POSTS_BUCKET;
 try{
  if(payload.kind==="photos")for(const uri of payload.photos)uploaded.push(await uploadPhoto(owner,uri,bucket));
  const {error}=await db.from("jobeen_feed_posts" as never).insert({
   author_id:owner,body:payload.body.trim().slice(0,2000),kind:payload.kind,
   photo_paths:uploaded,work_media_id:payload.mediaId??null,
   photo_bucket:bucket,audience:privatePost?"private":"public",
   audience_followers:privatePost&&!!payload.audienceFollowers,
   audience_contacts:privatePost&&!!payload.audienceContacts
  } as never);
  if(error)throw error;
 }catch(e){
  if(uploaded.length)await db.storage.from(bucket).remove(uploaded).catch(()=>{});
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
 .eq("id",id).eq("author_id",owner).select("photo_paths,photo_bucket").maybeSingle();
 if(error)throw error;
 if(!data)throw Error("No se pudo eliminar la publicación.");
 const stored=data as unknown as {photo_paths:string[];photo_bucket:string};
 const paths=stored.photo_paths??[];
 if(paths.length)await db.storage.from(stored.photo_bucket===PRIVATE_POSTS_BUCKET?PRIVATE_POSTS_BUCKET:POSTS_BUCKET).remove(paths).catch(()=>{});
}

export type HomePostComment={
 id:string;postId:string;authorId:string;authorName:string;authorHandle:string;body:string;createdAt:string;
};
type CommentRow={id:string;post_id:string;author_id:string;body:string;created_at:string};
export async function loadHomePostComments(postId:string):Promise<HomePostComment[]>{
 const db=requireSupabase();
 const {data,error}=await db.from("jobeen_feed_comments" as never)
  .select("id,post_id,author_id,body,created_at")
  .eq("post_id",postId).order("created_at",{ascending:true}).limit(100);
 if(error)throw error;
 const rows=(data??[]) as unknown as CommentRow[];
 const authors=await namesFor(rows.map(r=>r.author_id));
 return rows.map(row=>({
  id:row.id,postId:row.post_id,authorId:row.author_id,
  authorName:authors.get(row.author_id)?.name??"Profesional",
  authorHandle:authors.get(row.author_id)?.handle??"",
  body:row.body,createdAt:row.created_at
 }));
}
export async function addHomePostComment(postId:string,body:string):Promise<HomePostComment>{
 const trimmed=body.trim().slice(0,500);
 if(!trimmed)throw Error("Escribe un comentario.");
 const db=requireSupabase(),author=await currentSocialUser();
 const {data,error}=await db.from("jobeen_feed_comments" as never)
  .insert({post_id:postId,author_id:author,body:trimmed} as never)
  .select("id,post_id,author_id,body,created_at").single();
 if(error)throw error;
 const row=data as unknown as CommentRow;
 const authorInfo=(await namesFor([author])).get(author);
 return {id:row.id,postId:row.post_id,authorId:author,
  authorName:authorInfo?.name??"Profesional",authorHandle:authorInfo?.handle??"",
  body:row.body,createdAt:row.created_at};
}
export async function setHomePostLike(postId:string,liked:boolean):Promise<void>{
 const db=requireSupabase(),viewer=await currentSocialUser();
 if(liked){
  const {error}=await db.from("jobeen_feed_likes" as never)
   .insert({post_id:postId,profile_id:viewer} as never);
  if(error&&error.code!=="23505")throw error;
 }else{
  const {error}=await db.from("jobeen_feed_likes" as never)
   .delete().eq("post_id",postId).eq("profile_id",viewer);
  if(error)throw error;
 }
}
export async function recordHomePostShare(postId:string):Promise<void>{
 const db=requireSupabase(),viewer=await currentSocialUser();
 const {error}=await db.from("jobeen_feed_shares" as never)
  .insert({post_id:postId,profile_id:viewer} as never);
 if(error)throw error;
}
