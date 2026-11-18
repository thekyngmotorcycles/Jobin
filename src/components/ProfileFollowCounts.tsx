import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Pressable,Text,TextInput,View} from "react-native";
import {requireSupabase} from "../lib/supabase";
import {useUi} from "./ui";
import {BottomSheet} from "./social-ui";
import {AccountAvatar} from "./AccountAvatar";

type ListType="followers"|"following";
type Connection={id:string;name:string;following:boolean};

export function ProfileFollowCounts({userId,refreshKey=0}:{userId:string;refreshKey?:number}){
 const {colors,s}=useUi();
 const [viewer,setViewer]=useState("");
 const [counts,setCounts]=useState<{followers:number;following:number}|null>(null);
 const [sheet,setSheet]=useState(false);
 const [tab,setTab]=useState<ListType>("followers");
 const [rows,setRows]=useState<Connection[]>([]);
 const [query,setQuery]=useState("");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const refreshCounts=useCallback(async()=>{
  if(!userId)return;
  try{
   const db=requireSupabase();
   const {data:{user}}=await db.auth.getUser();
   setViewer(user?.id??"");
   const [followers,following]=await Promise.all([
    db.from("profile_follows" as never).select("*",{head:true,count:"exact"}).eq("followed_id",userId),
    db.from("profile_follows" as never).select("*",{head:true,count:"exact"}).eq("follower_id",userId)
   ]);
   if(followers.error||following.error)throw new Error("No se pudieron cargar los contadores");
   setCounts({followers:followers.count??0,following:following.count??0});
  }catch{setCounts(null);}
 },[userId]);
 useFocusEffect(useCallback(()=>{void refreshCounts();},[refreshCounts]));
 useEffect(()=>{void refreshCounts();},[refreshCounts,refreshKey]);
 const isOwner=!!viewer&&viewer===userId;

 async function loadConnections(kind:ListType){
  if(!isOwner)return;
  setLoading(true);setError("");setRows([]);
  try{
   const db=requireSupabase();
   const col=kind==="followers"?"followed_id":"follower_id";
   const other=kind==="followers"?"follower_id":"followed_id";
   const {data:links,error:linkError}=await db.from("profile_follows" as never)
    .select("follower_id,followed_id,created_at").eq(col,userId)
    .order("created_at",{ascending:false}).limit(200);
   if(linkError)throw linkError;
   const ids=(links??[]).map((item:any)=>item[other] as string);
   if(!ids.length){setRows([]);return;}
   const [names,following]=await Promise.all([
    db.from("profiles").select("id,display_name").in("id",ids),
    db.from("profile_follows" as never).select("followed_id").eq("follower_id",viewer)
   ]);
   if(names.error||following.error)throw names.error??following.error;
   const byId=new Map((names.data??[]).map(x=>[x.id,x.display_name]));
   const followed=new Set(((following.data??[]) as unknown as {followed_id:string}[]).map(x=>x.followed_id));
   setRows(ids.map(id=>({id,name:byId.get(id)??"Usuario de Jobeen",following:followed.has(id)})));
  }catch(e){setError(e instanceof Error?e.message:"No se pudieron cargar las conexiones.");}
  finally{setLoading(false);}
 }
 function openList(kind:ListType){
  if(!isOwner)return;
  setTab(kind);setQuery("");setSheet(true);void loadConnections(kind);
 }
 async function toggleFollow(person:Connection){
  setError("");
  try{
   const db=requireSupabase();
   const request=person.following?
    db.from("profile_follows" as never).delete().eq("follower_id",viewer).eq("followed_id",person.id):
    db.from("profile_follows" as never).insert({follower_id:viewer,followed_id:person.id} as never);
   const {error:followError}=await request;
   if(followError)throw followError;
   setRows(current=>current.map(row=>row.id===person.id?{...row,following:!person.following}:row));
   void refreshCounts();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar el seguimiento.");}
 }
 function changeTab(next:ListType){setTab(next);setQuery("");void loadConnections(next);}
 const visible=rows.filter(r=>r.name.toLowerCase().includes(query.trim().toLowerCase()));
 return <>
  <View style={{flexDirection:"row",justifyContent:"space-evenly",alignItems:"center",paddingVertical:8}}>
   {([{id:"followers",label:"Seguidores",value:counts?.followers},{id:"following",label:"Seguidos",value:counts?.following}] as const).map(item=>
    <Pressable key={item.id} accessibilityRole={isOwner?"button":undefined}
     accessibilityLabel={item.label+": "+(item.value??"no disponible")+(isOwner?", ver lista":"")}
     disabled={!isOwner} onPress={()=>openList(item.id)}
     style={{alignItems:"center",gap:3,flex:1,minHeight:56,justifyContent:"center"}}>
     <Text style={{fontSize:20,fontWeight:"800",color:colors.ink}}>{item.value===undefined?"—":new Intl.NumberFormat("es").format(item.value)}</Text>
     <Text style={{fontSize:13,color:colors.muted}}>{item.label}</Text>
    </Pressable>)}
  </View>
  <BottomSheet visible={sheet} onClose={()=>setSheet(false)} title="Conexiones">
   <View style={{gap:14,paddingVertical:8}}>
    <View style={{flexDirection:"row",gap:8}}>
     {(["followers","following"] as const).map(option=><Pressable key={option} accessibilityRole="tab" accessibilityState={{selected:tab===option}}
      onPress={()=>changeTab(option)} style={{flex:1,minHeight:44,borderRadius:13,borderWidth:1,borderColor:tab===option?colors.ink:colors.line,
       backgroundColor:tab===option?colors.accent:colors.paper,alignItems:"center",justifyContent:"center"}}>
      <Text style={{color:colors.ink,fontWeight:tab===option?"800":"600"}}>{option==="followers"?"Seguidores":"Siguiendo"}</Text>
     </Pressable>)}
    </View>
    <TextInput accessibilityLabel="Buscar en mis conexiones" value={query} onChangeText={setQuery} placeholder="Buscar personas" placeholderTextColor={colors.muted}
     style={{minHeight:44,borderRadius:13,borderWidth:1,borderColor:colors.line,paddingHorizontal:12,color:colors.ink}}/>
    {loading&&<ActivityIndicator color={colors.ink}/>}
    {!!error&&<Text accessibilityLiveRegion="polite" style={s.muted}>{error}</Text>}
    {!loading&&!visible.length&&<Text style={[s.muted,{paddingVertical:16,textAlign:"center"}]}>{rows.length?"No se encontraron personas.":"Todavía no hay personas en esta lista."}</Text>}
    {visible.map(person=><View key={person.id} style={{flexDirection:"row",alignItems:"center",gap:9,minHeight:58}}>
     <Pressable accessibilityRole="button" accessibilityLabel={"Ver perfil de "+person.name} onPress={()=>{setSheet(false);router.push({pathname:"/jcard",params:{user:person.id}});}}
      style={{flex:1,flexDirection:"row",alignItems:"center",gap:10}}>
      <AccountAvatar accountId={person.id} fallbackName={person.name} size={40}/>
      <Text numberOfLines={1} style={[s.text,{fontWeight:"700",flex:1}]}>{person.name}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={person.following?"Dejar de seguir a "+person.name:"Seguir a "+person.name}
      onPress={()=>void toggleFollow(person)} style={{minHeight:42,paddingHorizontal:12,borderRadius:13,
       backgroundColor:person.following?colors.accent:colors.ink,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:12,fontWeight:"700",color:person.following?colors.ink:colors.paper}}>{person.following?"Siguiendo":"Seguir"}</Text>
     </Pressable>
    </View>)}
    {rows.length>=200&&<Text style={s.muted}>Mostrando las primeras 200 conexiones.</Text>}
   </View>
  </BottomSheet>
 </>;
}
