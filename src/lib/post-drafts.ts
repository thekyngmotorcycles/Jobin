import {privateMetadataStorage} from "./private-metadata-storage";
import {assertAccountOwner} from "./account-scope";
import {type MessageScope} from "./message-session";
import {serializePrivateWrite} from "./private-write-queue";
import {requireSupabase} from "./supabase";
import type {FeedAudience,FeedPostKind} from "./social-content";
import type {PostBusinessMention} from "./post-mentions";
import {DRAFT_PREVIEW_TTL_SECONDS,toStoredDraftPhoto,type PostDraftPhoto} from "./post-draft-photo";

export const DRAFT_PHOTO_BUCKET="jobeen-post-draft-photos";
export type {PostDraftPhoto} from "./post-draft-photo";
export type PostDraft={
 id:string;updatedAt:number;body:string;kind:FeedPostKind;photos:PostDraftPhoto[];
 mediaId:string;audience:FeedAudience;audienceFollowers:boolean;audienceContacts:boolean;
 consent:boolean;mentionedProfileIds:string[];businessMentions?:PostBusinessMention[];
};
export const MAX_POST_DRAFTS=10;
const key=(owner:string)=>"jobeen.post.drafts.v1."+owner;

export function hasDraftContent(draft:PostDraft){
 return Boolean(draft.body.trim()||draft.photos.length||draft.mediaId||(draft.mentionedProfileIds?.length??0)||(draft.businessMentions?.length??0));
}
export function emptyPostDraft():PostDraft{
 return {
  id:Date.now().toString(36)+"-"+Math.random().toString(36).slice(2),
  updatedAt:Date.now(),body:"",kind:"text",photos:[],mediaId:"",
  audience:"public",audienceFollowers:true,audienceContacts:false,consent:false,mentionedProfileIds:[],businessMentions:[]
 };
}
async function confirm(owner:string,scope:MessageScope){
 if(!scope||scope.owner!==owner)throw Error("La cuenta cambió.");
 await assertAccountOwner(owner,scope.session);
}
export async function readPostDrafts(owner:string,scope:MessageScope):Promise<PostDraft[]>{
 await confirm(owner,scope);
 const raw=await privateMetadataStorage.read("post-drafts",scope);
 await confirm(owner,scope);
 if(!raw)return [];
 const data:unknown=JSON.parse(raw);
 if(!Array.isArray(data))throw Error("Los borradores necesitan revisión antes de recuperarse.");
 return data.map(value=>{
  if(!value||typeof value!=="object"||typeof value.id!=="string"||typeof value.body!=="string"||!Array.isArray(value.photos))throw Error("Hay un borrador que necesita recuperación.");
  const draft=value as PostDraft;
  if(draft.photos.some(p=>!p||typeof p.id!=="string"||(p.backupPath&&!p.backupPath.startsWith(owner+"/"))))throw Error("No se pudo verificar la propiedad de las fotos.");
  return {...draft,photos:draft.photos.map(toStoredDraftPhoto)};
 }).sort((a,b)=>b.updatedAt-a.updatedAt);
}
export async function savePostDraft(owner:string,draft:PostDraft,scope:MessageScope){
 if(!hasDraftContent(draft))return;
 await confirm(owner,scope);
 await serializePrivateWrite(key(owner),async()=>{
  await confirm(owner,scope);
  const previous=await readPostDrafts(owner,scope);
  if(!previous.some(x=>x.id===draft.id)&&previous.length>=MAX_POST_DRAFTS)
   throw Error("Has alcanzado el límite de "+MAX_POST_DRAFTS+" borradores. Elimina uno de los anteriores para guardar otro.");
  if(draft.photos.some(p=>p.backupPath&&!p.backupPath.startsWith(owner+"/")))throw Error("La fotografía pertenece a otra cuenta.");
  const next=[{...draft,photos:draft.photos.map(toStoredDraftPhoto),updatedAt:Date.now()},...previous.filter(x=>x.id!==draft.id)];
  await confirm(owner,scope);
  await privateMetadataStorage.write("post-drafts",scope,JSON.stringify(next));
  await confirm(owner,scope);
 });
}
export async function deletePostDraft(owner:string,id:string,scope:MessageScope,removePhotos=true){
 await confirm(owner,scope);
 await serializePrivateWrite(key(owner),async()=>{
  await confirm(owner,scope);
  const previous=await readPostDrafts(owner,scope);
  const found=previous.find(x=>x.id===id),remaining=previous.filter(x=>x.id!==id);
  await confirm(owner,scope);
  await privateMetadataStorage.write("post-drafts",scope,JSON.stringify(remaining));
  await confirm(owner,scope);
  if(removePhotos&&found){
   // Do not remove shared references or delete after the original session changes.
   const referenced=new Set(remaining.flatMap(d=>d.photos.map(p=>p.backupPath)));
   const paths=found.photos.map(x=>x.backupPath).filter((x):x is string=>!!x&&x.startsWith(owner+"/")&&!referenced.has(x));
   if(paths.length){await confirm(owner,scope);await requireSupabase().storage.from(DRAFT_PHOTO_BUCKET).remove([...new Set(paths)]);await confirm(owner,scope);}
  }
 });
}
export async function restorePostDraftPhotoUrls(photos:PostDraftPhoto[],owner:string,scope:MessageScope):Promise<PostDraftPhoto[]>{
 await confirm(owner,scope);
 const session=scope.session;
 const backed=photos.filter(p=>p.backupPath);
 if(!backed.length)return photos.map(toStoredDraftPhoto);
 const paths=backed.map(p=>p.backupPath!);
 if(paths.some(path=>!path.startsWith(owner+"/")))throw new Error("No se pudo verificar la propiedad de las fotos.");
 const {data,error}=await requireSupabase().storage.from(DRAFT_PHOTO_BUCKET).createSignedUrls(paths,DRAFT_PREVIEW_TTL_SECONDS);
 await assertAccountOwner(owner,session);
 if(error)throw error;
 const urls=new Map<string,string>();
 for(const link of data??[])if(link.path&&link.signedUrl)urls.set(link.path,link.signedUrl);
 return photos.map(p=>p.backupPath?{...toStoredDraftPhoto(p),previewUri:urls.get(p.backupPath)}:toStoredDraftPhoto(p));
}
