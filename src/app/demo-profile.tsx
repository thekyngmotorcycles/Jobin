import {useState} from "react";
import {Pressable,ScrollView,Text,View} from "react-native";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {JobinCard} from "../components/JobinCard";
import {mockJCard} from "../mocks/jcard";
import {useUi} from "../components/ui";
import {SafeAreaView} from "react-native-safe-area-context";
export default function DemoPublicProfile(){
 const {colors,s}=useUi();const [following,setFollowing]=useState(false);const [section,setSection]=useState<"cv"|"videos"|"live">("videos");const [notice,setNotice]=useState("");
 const card={...mockJCard("Sin reseñas","AVAILABLE"),name:"Alex Rivera",handle:"alex_profesional",role:"Electricista",years:7,avatar:undefined,profileUrl:"https://example.com/jobin/demo/alex_profesional",seals:[]};
 return <SafeAreaView style={{flex:1,backgroundColor:colors.paper}}><ScrollView contentContainerStyle={{padding:16,gap:14,paddingBottom:65}}>
  <Pressable accessibilityRole="button" onPress={()=>router.back()} style={{flexDirection:"row",gap:8,alignItems:"center",paddingVertical:8}}><Ionicons name="arrow-back" size={23} color={colors.ink}/><Text style={s.text}>Volver a mi perfil</Text></Pressable>
  <Text style={s.h3}>Vista de otro perfil · DEMOSTRACIÓN</Text>
  <Text style={s.muted}>Cuenta ficticia local. No corresponde a un usuario real y no genera cobros ni seguidores reales.</Text>
  <JobinCard card={card}/>
  <View style={{flexDirection:"row",gap:10}}>
   <Pressable accessibilityRole="button" onPress={()=>setFollowing(v=>!v)} style={{flex:1,backgroundColor:colors.ink,borderRadius:12,padding:14,alignItems:"center",flexDirection:"row",justifyContent:"center",gap:8}}><Ionicons name={following?"checkmark":"heart-outline"} size={20} color={colors.paper}/><Text style={{color:colors.paper,fontWeight:"700"}}>{following?"Siguiendo":"Seguir"}</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>setNotice("Vista de demostración: las suscripciones no están habilitadas.")} style={{flex:1,borderWidth:1,borderColor:colors.line,borderRadius:12,padding:14,alignItems:"center",flexDirection:"row",justifyContent:"center",gap:8}}><Ionicons name="star-outline" size={20} color={colors.ink}/><Text style={s.text}>Suscribirse</Text></Pressable>
  </View>
  <View style={{flexDirection:"row",justifyContent:"space-around",paddingVertical:10,borderBottomWidth:1,borderColor:colors.line}}>
   {([{key:"cv",icon:"school-outline"},{key:"videos",icon:"play-outline"},{key:"live",icon:"radio-outline"}] as const).map(item=><Pressable key={item.key} accessibilityRole="button" accessibilityLabel={item.key==="cv"?"Historial":item.key==="videos"?"Videos":"En vivo"} onPress={()=>setSection(item.key)} style={{padding:14,borderBottomWidth:section===item.key?2:0,borderColor:colors.ink}}><Ionicons name={item.icon} size={26} color={colors.ink}/></Pressable>)}
  </View>
  <Text style={s.h3}>{section==="cv"?"Historial profesional":section==="videos"?"Videos profesionales":"Transmisiones en vivo"}</Text>
  <Text style={s.muted}>{section==="live"?"Este perfil ficticio no está transmitiendo.":section==="videos"?"Este perfil ficticio todavía no tiene videos.":"Este perfil ficticio no tiene empleos registrados."}</Text>
  {!!notice&&<Text style={s.muted}>{notice}</Text>}
 </ScrollView></SafeAreaView>;
}
