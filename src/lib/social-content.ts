import {uploadSecuredFile} from "./private-attachment-android";
import {POST_PHOTO_LIMIT} from "./feed-photo-layout";
import type {PrivateAttachment} from "./private-attachment";
import {validBusinessMentions,type PostBusinessMention} from "./post-mentions";
import {requireSupabase} from "./supabase";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";
import {loadPublishedMedia,type PublishedMedia} from "./safety-api";

const POSTS_BUCKET="photo-posts";
const PRIVATE_POSTS_BUCKET="jobeen-private-post-photos";
const DRAFT_POSTS_BUCKET="jobeen-post-draft-photos";
export type FeedAudience="public"|"private";
const STORIES_BUCKET="jobeen-story-media";

export type FeedPostKind="text"|"photos"|"video"|"live";
export type StoryKind="text"|"photo"|"video";
export type FeedPost={
 id:string;authorId:string;authorName:string;authorHandle:string;body:string;kind:FeedPostKind;
 photoUrls:string[];photoAltTexts:string[];mentionedProfileIds:string[];mentions:{id:string;label:string;card?:"personal"|"business"}[];mediaId:string|null;createdAt:string;
 likes:number;comments:number;shares:number;likedByViewer:boolean;
};
export type SocialStory={
 id:string;authorId:string;authorName:string;authorHandle:string;kind:StoryKind;body:string;
 imageUrl:string|null;mediaId:string|null;createdAt:string;expiresAt:string;
};
type FeedRow={id:string;author_id:string;body:string;kind:FeedPostKind;photo_paths:string[];photo_bucket:string;photo_alt_texts:string[];mentioned_profile_ids:string[];business_mentions:unknown;work_media_id:string|null;created_at:string};
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
export async function loadHomePosts(viewerId="",authorId?:string,postId?:string,postIds?:string[],offset=0,expectedScope?:MessageScope):Promise<FeedPost[]>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase();
 if(viewerId&&viewerId!==scope.owner)throw Error("La cuenta cambió.");
 viewerId=scope.owner;
 const query=db.from("jobeen_feed_posts" as never)
  .select("id,author_id,body,kind,photo_paths,photo_bucket,photo_alt_texts,mentioned_profile_ids,business_mentions,work_media_id,created_at")
  .is("removed_at",null).order("created_at",{ascending:false}).range(offset,offset+(postId?0:79));
 const {data,error}=await (postId?query.eq("id",postId):postIds?.length?query.in("id",postIds):authorId?query.eq("author_id",authorId):query);
 if(error)throw error;
 const rows=(data??[]) as unknown as FeedRow[];
 await assertMessageScope(scope);
 const authors=await namesFor([...rows.map(r=>r.author_id),...rows.flatMap(r=>r.mentioned_profile_ids??[])]);
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
  await assertMessageScope(scope);
  const {data:links,error:linkError}=await db.storage.from(PRIVATE_POSTS_BUCKET).createSignedUrls(privatePaths,300);
  if(linkError)throw linkError;
  for(const link of links??[])if(link.signedUrl&&link.path)signedUrls.set(link.path,link.signedUrl);
 }
 await assertMessageScope(scope);
 return rows.map(row=>{
  const count=counts.get(row.id);
  return {
   id:row.id,authorId:row.author_id,authorName:authors.get(row.author_id)?.name??"Profesional",
   authorHandle:authors.get(row.author_id)?.handle??"",body:row.body,kind:row.kind,
   photoUrls:(row.photo_paths??[]).map(path=>row.photo_bucket===PRIVATE_POSTS_BUCKET?
    signedUrls.get(path)??"":db.storage.from(POSTS_BUCKET).getPublicUrl(path).data.publicUrl).filter(Boolean),
   photoAltTexts:row.photo_alt_texts??[],mentionedProfileIds:row.mentioned_profile_ids??[],
   mentions:[...(row.mentioned_profile_ids??[]).map(id=>({
    id,label:authors.get(id)?.handle?"@"+authors.get(id)!.handle:authors.get(id)?.name??"Profesional",card:"personal" as const
   })),...validBusinessMentions(row.business_mentions).map(m=>({id:m.ownerId,label:m.label,card:"business" as const}))],
   mediaId:row.work_media_id,createdAt:row.created_at,
   likes:Number(count?.likes??0),comments:Number(count?.comments??0),shares:Number(count?.shares??0),
   likedByViewer:viewerLikes.has(row.id)
  };
 });
}
/** Load the owner's complete feed history in pages so profiles are not limited to 80 posts. */
export async function loadAllProfilePosts(viewerId:string,authorId:string,expectedScope?:MessageScope):Promise<FeedPost[]>{
 const scope=await captureMessageScope(expectedScope);
 if(viewerId&&viewerId!==scope.owner)throw Error("La cuenta cambió.");
 const all:FeedPost[]=[];
 for(let offset=0;;offset+=80){
  const batch=await loadHomePosts(viewerId,authorId,undefined,undefined,offset,scope);
  all.push(...batch);
  if(batch.length<80)break;
 }
 await assertMessageScope(scope);
 return all;
}
export async function loadActiveStories(expectedScope?:MessageScope):Promise<SocialStory[]>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase();const now=new Date().toISOString();
 const {data,error}=await db.from("jobeen_stories" as never)
  .select("id,author_id,kind,body,photo_path,work_media_id,created_at,expires_at")
  .gt("expires_at",now).order("created_at",{ascending:false}).limit(70);
 if(error)throw error;
 const rows=(data??[]) as unknown as StoryRow[];
 const authors=await namesFor(rows.map(r=>r.author_id));
 const photos=await Promise.all(rows.map(async row=>{
  if(!row.photo_path||!row.photo_path.startsWith(row.author_id+"/"))return null;
  await assertMessageScope(scope);
  const {data:link,error:linkError}=await db.storage.from(STORIES_BUCKET).createSignedUrl(row.photo_path,120);
  return linkError?null:link.signedUrl;
 }));
 await assertMessageScope(scope);
 return rows.map((row,index)=>({
  id:row.id,authorId:row.author_id,authorName:authors.get(row.author_id)?.name??"Profesional",
  authorHandle:authors.get(row.author_id)?.handle??"",kind:row.kind,body:row.body,
  imageUrl:photos[index],mediaId:row.work_media_id,createdAt:row.created_at,expiresAt:row.expires_at
 }));
}
export async function shareApprovedMedia(kind:"video"|"live",owner:string):Promise<PublishedMedia[]>{
 const entries=await loadPublishedMedia();
 return entries.filter(x=>x.creator_id===owner&&x.kind===kind);
}
export async function publishHomePost(payload:{body:string;kind:FeedPostKind;mediaId?:string|null;audience?:FeedAudience;audienceFollowers?:boolean;audienceContacts?:boolean;privatePhotos?:(PrivateAttachment|null)[];photoDraftPaths?:(string|null)[];photoAltTexts?:string[];mentionedProfileIds?:string[];businessMentions?:PostBusinessMention[]},expectedScope?:MessageScope,onPhotoProgress?:(completed:number,total:number)=>void):Promise<string>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),owner=scope.owner,uploaded:string[]=[];
 let insertStarted=false;
 if(payload.kind==="text"&&!payload.body.trim())throw Error("Escribe un mensaje para publicar.");
 const photoCount=Math.max(payload.privatePhotos?.length??0,payload.photoDraftPaths?.length??0);
 if(payload.kind==="photos"&&(!photoCount||photoCount>POST_PHOTO_LIMIT))throw Error("Añade entre 1 y "+POST_PHOTO_LIMIT+" fotografías.");
 if((payload.kind==="video"||payload.kind==="live")&&!payload.mediaId)throw Error("Selecciona un video o Live publicado y aprobado.");
 const privatePost=payload.audience==="private";
 if(privatePost&&!payload.audienceFollowers&&!payload.audienceContacts)throw Error("Selecciona seguidores, contactos o ambos.");
 if(privatePost&&(payload.kind==="video"||payload.kind==="live"))
  throw Error("Los videos y Lives aprobados solo pueden compartirse de forma pública.");
 const bucket=privatePost?PRIVATE_POSTS_BUCKET:POSTS_BUCKET;
 try{
  if(payload.kind==="photos")for(let i=0;i<photoCount;i++){
   await assertMessageScope(scope);
   const saved=payload.photoDraftPaths?.[i];
   const local=payload.privatePhotos?.[i];
   if(local){uploaded.push(await uploadSecuredFile(scope,"draft-photo",local,bucket));}
   else if(saved){
    if(!saved.startsWith(owner+"/"))throw Error("La fotografía del borrador no pertenece a tu cuenta.");
    const path=owner+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,10)+".jpg";
    // Copy server-side to avoid unsupported Blob.arrayBuffer() in the Android runtime.
    const {error:copyError}=await db.storage.from(DRAFT_POSTS_BUCKET).copy(saved,path,{destinationBucket:bucket});
    if(copyError)throw copyError;
    uploaded.push(path);await assertMessageScope(scope);
   }else throw Error("Vuelve a seleccionar la fotografía para continuar.");
   await assertMessageScope(scope);onPhotoProgress?.(i+1,photoCount);
  }
  await assertMessageScope(scope);insertStarted=true;
  const {data:created,error}=await db.from("jobeen_feed_posts" as never).insert({
   author_id:owner,body:payload.body.trim().slice(0,2000),kind:payload.kind,
   photo_paths:uploaded,work_media_id:payload.mediaId??null,
   photo_bucket:bucket,audience:privatePost?"private":"public",
   audience_followers:privatePost&&!!payload.audienceFollowers,
   audience_contacts:privatePost&&!!payload.audienceContacts,
   photo_alt_texts:payload.kind==="photos"?(payload.photoAltTexts??[]).map(t=>t.trim().slice(0,500)):[],
   mentioned_profile_ids:(payload.mentionedProfileIds??[]).slice(0,20),
   business_mentions:validBusinessMentions(payload.businessMentions??[]).filter(m=>payload.body.includes(m.label))
  } as never).select("id").single();
  if(error)throw error;
  await assertMessageScope(scope);
  return (created as unknown as {id:string}).id;
 }catch(e){
  if(!insertStarted&&uploaded.length){try{await captureMessageScope(scope);await db.storage.from(bucket).remove(uploaded);}catch{/* preserve for owner reconciliation */}}
  throw e;
 }
}
export async function publishStory(payload:{body:string;kind:StoryKind;photo?:PrivateAttachment;mediaId?:string|null},expectedScope?:MessageScope):Promise<void>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),owner=scope.owner;
 if(payload.kind==="text"&&!payload.body.trim())throw Error("Escribe algo para tu historia.");
 if(payload.kind==="photo"&&!payload.photo)throw Error("Selecciona una foto.");
 if(payload.kind==="video"&&!payload.mediaId)throw Error("Selecciona un video aprobado.");
 let path:string|null=null,insertStarted=false;
 try{
  if(payload.kind==="photo")path=await uploadSecuredFile(scope,"draft-photo",payload.photo!,STORIES_BUCKET);
  await assertMessageScope(scope);insertStarted=true;
  const {error}=await db.from("jobeen_stories" as never).insert({
   author_id:owner,kind:payload.kind,body:payload.body.trim().slice(0,280),
   photo_path:path,work_media_id:payload.mediaId??null
  } as never);
  if(error)throw error;
  await assertMessageScope(scope);
 }catch(e){
  if(path&&!insertStarted){try{await captureMessageScope(scope);await db.storage.from(STORIES_BUCKET).remove([path]);}catch{/* retain for recovery */}}
  throw e;
 }
}
export async function deleteStory(id:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),owner=scope.owner;
 const {data,error}=await db.from("jobeen_stories" as never).delete().eq("id",id).eq("author_id",owner).select("photo_path");
 if(error)throw error;
 await assertMessageScope(scope);
 if(!(data??[]).length)throw Error("La historia no está disponible.");
 // Expired/unreferenced files are reconciled separately; another story may reference them.
}
export async function deleteHomePost(id:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),owner=scope.owner;
 const {data,error}=await db.from("jobeen_feed_posts" as never).update({removed_at:new Date().toISOString()} as never)
 .eq("id",id).eq("author_id",owner).select("photo_paths,photo_bucket").maybeSingle();
 if(error)throw error;
 if(!data)throw Error("No se pudo eliminar la publicación.");
 await assertMessageScope(scope);
 const removed=data as unknown as {photo_paths:string[];photo_bucket:string};
 // Public files bypass read RLS, so remove owned, no-longer-referenced
 // public files promptly. Private files are denied by row authorization.
 if(removed.photo_bucket===POSTS_BUCKET){
  const candidates=[...new Set((removed.photo_paths??[]).filter(p=>p.startsWith(owner+"/")))];
  if(candidates.length){
   const {data:references,error:refError}=await db.from("jobeen_feed_posts" as never)
    .select("photo_paths").eq("author_id",owner).eq("photo_bucket",POSTS_BUCKET).is("removed_at",null).overlaps("photo_paths",candidates);
   await assertMessageScope(scope);
   if(!refError){
    const inUse=new Set(((references??[]) as unknown as {photo_paths:string[]}[]).flatMap(row=>row.photo_paths));
    const unused=candidates.filter(path=>!inUse.has(path));
    if(unused.length){await db.storage.from(POSTS_BUCKET).remove(unused);await assertMessageScope(scope);}
   }
  }
 }
}

export type HomePostComment={
 id:string;postId:string;authorId:string;authorName:string;authorHandle:string;body:string;createdAt:string;
};
type CommentRow={id:string;post_id:string;author_id:string;body:string;created_at:string};
export async function loadHomePostComments(postId:string,expectedScope?:MessageScope):Promise<HomePostComment[]>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase();
 const {data,error}=await db.from("jobeen_feed_comments" as never)
  .select("id,post_id,author_id,body,created_at")
  .eq("post_id",postId).order("created_at",{ascending:true}).limit(100);
 if(error)throw error;
 const rows=(data??[]) as unknown as CommentRow[];
 const authors=await namesFor(rows.map(r=>r.author_id));
 await assertMessageScope(scope);
 return rows.map(row=>({
  id:row.id,postId:row.post_id,authorId:row.author_id,
  authorName:authors.get(row.author_id)?.name??"Profesional",
  authorHandle:authors.get(row.author_id)?.handle??"",
  body:row.body,createdAt:row.created_at
 }));
}
export async function addHomePostComment(postId:string,body:string,expectedScope?:MessageScope):Promise<HomePostComment>{
 const trimmed=body.trim().slice(0,500);
 if(!trimmed)throw Error("Escribe un comentario.");
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),author=scope.owner;
 const {data,error}=await db.from("jobeen_feed_comments" as never)
  .insert({post_id:postId,author_id:author,body:trimmed} as never)
  .select("id,post_id,author_id,body,created_at").single();
 if(error)throw error;
 const row=data as unknown as CommentRow;
 const authorInfo=(await namesFor([author])).get(author);
 await assertMessageScope(scope);
 return {id:row.id,postId:row.post_id,authorId:author,
  authorName:authorInfo?.name??"Profesional",authorHandle:authorInfo?.handle??"",
  body:row.body,createdAt:row.created_at};
}
export async function setHomePostLike(postId:string,liked:boolean,expectedScope?:MessageScope):Promise<void>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),viewer=scope.owner;
 if(liked){
  const {error}=await db.from("jobeen_feed_likes" as never)
   .insert({post_id:postId,profile_id:viewer} as never);
  if(error&&error.code!=="23505")throw error;
 }else{
  const {error}=await db.from("jobeen_feed_likes" as never)
   .delete().eq("post_id",postId).eq("profile_id",viewer);
  if(error)throw error;
 }
 await assertMessageScope(scope);
}
export async function recordHomePostShare(postId:string,expectedScope?:MessageScope):Promise<void>{
 const scope=await captureMessageScope(expectedScope),db=requireSupabase(),viewer=scope.owner;
 const {error}=await db.from("jobeen_feed_shares" as never)
  .insert({post_id:postId,profile_id:viewer} as never);
 if(error)throw error;
 await assertMessageScope(scope);
}
