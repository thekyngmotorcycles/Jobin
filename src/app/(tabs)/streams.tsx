import { useTabClearance } from "../../theme/navigation";
import { useState } from "react";
import { Pressable,ScrollView,Text,View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StreamGrid } from "../../components/StreamGrid";
import {type WorkFilter} from "../../components/WorkCategoryFilters";
import { FeedTopBar } from "../../components/FeedTopBar";
import { useUi } from "../../components/ui";
import { browseStreams,type LiveStream } from "../../lib/streams";
import { type FeedTab } from "../../lib/feed";
import { useApp } from "../../state/AppProvider";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

function matchesFilter(room:LiveStream,filter:WorkFilter){
 if(filter==="Todo")return true;
 if(filter==="Comercio")return room.category==="Shop";
 if(filter==="Tecnología")return room.category==="Games"||/developer|software|tecnolog/i.test(room.profession);
 if(filter==="Educación")return /trainer|teacher|profesor|instructor|educa/i.test(room.profession);
 return room.category==="Work"&&!/trainer|teacher|profesor|instructor|educa/i.test(room.profession);
}
export default function Live(){
 const {s,colors}=useUi();const {theme}=useTheme();const jt=jobeenTokens(theme);const glass=theme==="sunflower";const inset=useSafeAreaInsets();const {contentBottom}=useTabClearance();const {city}=useApp();
 const [tab,setTab]=useState<FeedTab>("Local");const [filter,setFilter]=useState<WorkFilter>("Todo");
 const rooms=browseStreams(tab==="Local"?"Nearby":"Popular",city).filter(room=>matchesFilter(room,filter));
 return <View style={s.screen}>
  <ScrollView contentContainerStyle={{paddingTop:inset.top+72,paddingBottom:contentBottom,gap:15}} showsVerticalScrollIndicator={false}>
   <View style={{paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
    <Text accessibilityRole="header" style={{color:colors.ink,fontSize:17,fontWeight:"800",flex:1}}>Transmisiones</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Iniciar una transmisión de tu trabajo" onPress={()=>router.push("/live")}
     style={({pressed})=>({minHeight:44,paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:7,borderRadius:15,
      backgroundColor:glass?colors.glassPromo:theme==="light"?jt.cream:colors.accent,borderWidth:1,
      borderColor:glass?colors.glassBorder:theme==="light"?jt.line:colors.line,opacity:pressed?0.7:1})}>
     <Ionicons name="radio-outline" size={19} color={colors.ink}/>
     <Text style={{fontSize:13,fontWeight:"700",color:colors.ink}}>Transmitir</Text>
    </Pressable>
   </View>
   <View style={{paddingHorizontal:16,gap:14}}>
    <Text style={s.muted}>Vistas de ejemplo · No son transmisiones reales.</Text>
    <StreamGrid rooms={rooms}/>
    {rooms.length===0&&<Text style={s.muted}>No hay transmisiones de ejemplo para este filtro.</Text>}
   </View>
  </ScrollView>
  <View style={{position:"absolute",top:inset.top+4,left:8,right:8,zIndex:20}}>
   <FeedTopBar tab={tab} onTab={setTab} category={filter} onCategory={setFilter} leading="videos" onLeading={()=>router.navigate("/(tabs)/videos")} onSearch={()=>router.push({pathname:"/search",params:{mode:"live"}})}/>
  </View>
 </View>;
}
