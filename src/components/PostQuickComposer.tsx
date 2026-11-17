import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useEffect,useState} from "react";
import {Pressable,Text,View} from "react-native";
import {PublicProfileAvatar} from "./PublicProfileAvatar";
import {currentSocialUser} from "../lib/social-content";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

export function PostQuickComposer(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [authorId,setAuthorId]=useState("");
 useEffect(()=>{let active=true;void currentSocialUser().then(id=>{if(active)setAuthorId(id);}).catch(()=>{});return()=>{active=false;};},[]);
 return <View style={{marginHorizontal:14,borderRadius:21,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,padding:12,gap:12}}>
  <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
   {authorId?<PublicProfileAvatar userId={authorId} name="Mi cuenta" size={43}/>:<Ionicons name="person-circle-outline" size={42} color={t.ink2}/>}
   <Pressable accessibilityRole="button" accessibilityLabel="Crear publicación de texto" onPress={()=>router.push("/post/create")}
    style={({pressed})=>({flex:1,borderWidth:1,borderColor:t.line,borderRadius:25,minHeight:45,backgroundColor:pressed?t.cream:t.bg,paddingHorizontal:14,justifyContent:"center"})}>
    <Text style={{color:t.ink2,fontSize:14}}>¿Qué quieres compartir?</Text>
   </Pressable>
  </View>
  <View style={{flexDirection:"row",gap:7}}>
   {([
    {label:"Foto",icon:"image-outline",kind:"photo"},
    {label:"Video",icon:"videocam-outline",kind:"video"},
    {label:"Clip de Live",icon:"radio-outline",kind:"live"}
   ] as const).map(x=><Pressable key={x.kind} accessibilityRole="button" accessibilityLabel={"Publicar "+x.label}
    onPress={()=>router.push({pathname:"/post/create",params:{kind:x.kind}})}
    style={({pressed})=>({minHeight:43,flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:5,borderRadius:14,backgroundColor:pressed?t.cream:t.bg})}>
    <Ionicons name={x.icon} size={18} color={t.ink}/>
    <Text numberOfLines={1} style={{fontSize:12,color:t.ink,fontWeight:"700"}}>{x.label}</Text>
   </Pressable>)}
  </View>
 </View>;
}
