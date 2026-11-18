import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {ScrollView,Pressable,Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

export type HomeFeedFilter="all"|"following"|"companies";
const tabs=[
 {key:"all" as const,label:"Para ti",icon:"sparkles-outline" as const},
 {key:"following" as const,label:"Siguiendo",icon:"people-outline" as const},
 {key:"companies" as const,label:"Empresas",icon:"business-outline" as const},
];
export function HomeFeedFilters({value,onChange}:{value:HomeFeedFilter;onChange:(value:HomeFeedFilter)=>void}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 return <View style={{paddingVertical:1}}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
   contentContainerStyle={{paddingHorizontal:14,gap:7,alignItems:"center"}}>
   {tabs.map(tab=><Pressable key={tab.key} accessibilityRole="button" accessibilityLabel={"Filtrar Home: "+tab.label}
    accessibilityState={{selected:value===tab.key}} onPress={()=>onChange(tab.key)}
    style={({pressed})=>({minHeight:42,paddingHorizontal:13,borderRadius:21,flexDirection:"row",gap:6,alignItems:"center",
     backgroundColor:value===tab.key?t.ink:pressed?t.cream:t.surface,borderWidth:1,borderColor:value===tab.key?t.ink:t.line})}>
    <Ionicons name={tab.icon} size={16} color={value===tab.key?t.surface:t.ink}/>
    <Text style={{fontSize:12,color:value===tab.key?t.surface:t.ink,fontWeight:value===tab.key?"800":"600"}}>{tab.label}</Text>
   </Pressable>)}
   <Pressable accessibilityRole="button" accessibilityLabel="Explorar empresas y profesionales en el mapa"
    onPress={()=>router.push({pathname:"/search",params:{view:"map"}})}
    style={({pressed})=>({minHeight:42,paddingHorizontal:13,borderRadius:21,flexDirection:"row",gap:6,alignItems:"center",
     backgroundColor:pressed?t.cream:t.surface,borderWidth:1,borderColor:t.line})}>
    <Ionicons name="map-outline" size={17} color={t.ink}/>
    <Text style={{fontSize:12,fontWeight:"700",color:t.ink}}>Mapa</Text>
   </Pressable>
  </ScrollView>
 </View>;
}
