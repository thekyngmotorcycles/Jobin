import {useEffect,useState} from "react";
import {Avatar} from "./social-ui";
import {personalAvatarUrl} from "../lib/personal-jcard-photo";
import {requireSupabase} from "../lib/supabase";
import {loadPublicCard} from "../lib/professional-api";
import {assertMessageScope,captureMessageScope} from "../lib/message-session";

/** Public profile picture with initials fallback; never displays another user's private contact data. */
export function PublicProfileAvatar({userId,name,size=52,height=size,shape="circle",framed=true,respectJCardVisibility=false}:{userId:string;name:string;size?:number;height?:number;shape?:"circle"|"portrait";framed?:boolean;respectJCardVisibility?:boolean}){
 const [uri,setUri]=useState<string|undefined>();
 useEffect(()=>{
  let live=true;setUri(undefined);
  if(!userId)return;
  void (async()=>{
   try{
    const scope=await captureMessageScope();
    if(respectJCardVisibility){const card=await loadPublicCard(userId,scope);await assertMessageScope(scope);if(live)setUri(personalAvatarUrl(card.avatar));return;}
    const {data,error}=await requireSupabase().from("profiles").select("avatar_path").eq("id",userId).maybeSingle();
    await assertMessageScope(scope);
    if(live&&!error)setUri(personalAvatarUrl(data?.avatar_path));
   }catch{/* Keep initials fallback if the avatar cannot be loaded. */}
  })();
  return()=>{live=false;};
 },[userId,respectJCardVisibility]);
 return <Avatar uri={uri} name={name} size={size} height={height} shape={shape} framed={framed}/>;
}
