import {useEffect,useState} from "react";
import {Avatar} from "./social-ui";
import {personalAvatarUrl} from "../lib/personal-jcard-photo";
import {requireSupabase} from "../lib/supabase";

/** Public profile picture with initials fallback; never displays another user's private contact data. */
export function PublicProfileAvatar({userId,name,size=52}:{userId:string;name:string;size?:number}){
 const [uri,setUri]=useState<string|undefined>();
 useEffect(()=>{
  let live=true;setUri(undefined);
  if(!userId)return;
  void requireSupabase().from("profiles").select("avatar_path").eq("id",userId).maybeSingle()
   .then(({data,error})=>{if(live&&!error)setUri(personalAvatarUrl(data?.avatar_path));})
   .catch(()=>{});
  return()=>{live=false;};
 },[userId]);
 return <Avatar uri={uri} name={name} size={size}/>;
}
