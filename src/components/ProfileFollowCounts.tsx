import {useEffect,useState} from "react";
import {Text,View} from "react-native";
import {requireSupabase} from "../lib/supabase";
import {useUi} from "./ui";

/** Counts only public follow relationships; never substitutes fabricated values on query failure. */
export function ProfileFollowCounts({userId,refreshKey=0}:{userId:string;refreshKey?:number}){
 const {colors}=useUi();
 const [counts,setCounts]=useState<{followers:number;following:number}|null>(null);
 useEffect(()=>{
  let active=true;setCounts(null);
  if(!userId)return;
  void(async()=>{
   try{
    const db=requireSupabase();
    const [followers,following]=await Promise.all([
     db.from("profile_follows" as never).select("*",{head:true,count:"exact"}).eq("followed_id",userId),
     db.from("profile_follows" as never).select("*",{head:true,count:"exact"}).eq("follower_id",userId)
    ]);
    if(followers.error||following.error)throw new Error("No se pudieron cargar los contadores");
    if(active)setCounts({followers:followers.count??0,following:following.count??0});
   }catch{if(active)setCounts(null);}
  })();
  return()=>{active=false;};
 },[userId,refreshKey]);
 return <View style={{flexDirection:"row",justifyContent:"space-evenly",alignItems:"center",paddingVertical:8}}>
  {([{label:"Seguidores",value:counts?.followers},{label:"Seguidos",value:counts?.following}] as const).map(item=>
   <View key={item.label} style={{alignItems:"center",gap:3,flex:1}} accessibilityLabel={item.label+": "+(item.value??"no disponible")}>
    <Text style={{fontSize:20,fontWeight:"800",color:colors.ink}}>{item.value===undefined?"—":new Intl.NumberFormat("es").format(item.value)}</Text>
    <Text style={{fontSize:13,color:colors.muted}}>{item.label}</Text>
   </View>)}
 </View>;
}
