import AsyncStorage from "@react-native-async-storage/async-storage";
import {assertAccountOwner} from "./account-scope";
import {requireSupabase} from "./supabase";
import type {FeedAudience,FeedPostKind} from "./social-content";
import type {PostBusinessMention} from "./post-mentions";

export const DRAFT_PHOTO_BUCKET="jobeen-post-draft-photos";
export type PostDraftPhoto={id:string;uri:string;backupPath?:string;altText:string};
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
export async function readPostDrafts(owner:string):Promise<PostDraft[]>{
 if(!owner)return [];
 await assertAccountOwner(owner);
 const raw=await AsyncStorage.getItem(key(owner));
 await assertAccountOwner(owner);
 if(!raw)return [];
 try{
  const data:unknown=JSON.parse(raw);
  if(!Array.isArray(data))return [];
  return data.filter((v):v is PostDraft=>Boolean(v&&typeof v==="object"&&
   typeof (v as PostDraft).id==="string"&&typeof (v as PostDraft).body==="string"&&
   Array.isArray((v as PostDraft).photos))).sort((a,b)=>b.updatedAt-a.updatedAt);
 }catch{return [];}
}
export async function savePostDraft(owner:string,draft:PostDraft){
 if(!owner||!hasDraftContent(draft))return;
 await assertAccountOwner(owner);
 const previous=await readPostDrafts(owner);
 if(!previous.some(x=>x.id===draft.id)&&previous.length>=MAX_POST_DRAFTS)
  throw Error("Has alcanzado el límite de "+MAX_POST_DRAFTS+" borradores. Elimina uno de los anteriores para guardar otro.");
 const next=[{...draft,updatedAt:Date.now()},...previous.filter(x=>x.id!==draft.id)];
 await assertAccountOwner(owner);
 await AsyncStorage.setItem(key(owner),JSON.stringify(next));
}
export async function deletePostDraft(owner:string,id:string,removePhotos=true){
 if(!owner)return;
 await assertAccountOwner(owner);
 const previous=await readPostDrafts(owner);
 const found=previous.find(x=>x.id===id);
 await assertAccountOwner(owner);
 await AsyncStorage.setItem(key(owner),JSON.stringify(previous.filter(x=>x.id!==id)));
 if(removePhotos&&found){
  const paths=found.photos.map(x=>x.backupPath).filter((x):x is string=>!!x&&x.startsWith(owner+"/"));
  if(paths.length)await requireSupabase().storage.from(DRAFT_PHOTO_BUCKET).remove(paths).catch(()=>{});
 }
}
export async function restorePostDraftPhotoUrls(photos:PostDraftPhoto[]):Promise<PostDraftPhoto[]>{
 const backed=photos.filter(p=>p.backupPath);
 if(!backed.length)return photos;
 const paths=backed.map(p=>p.backupPath!);
 const {data,error}=await requireSupabase().storage.from(DRAFT_PHOTO_BUCKET).createSignedUrls(paths,3600);
 if(error)throw error;
 const urls=new Map((data??[]).filter(x=>!!x.signedUrl&&!!x.path).map(x=>[x.path!,x.signedUrl]));
 return photos.map(p=>p.backupPath?{...p,uri:urls.get(p.backupPath)??p.uri}:p);
}
