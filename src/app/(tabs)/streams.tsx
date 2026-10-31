import { useTabClearance } from "../../theme/navigation";
import { useState } from "react";
import { ScrollView,Text,View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StreamGrid } from "../../components/StreamGrid";
import { PublishedWorkMedia } from "../../components/PublishedWorkMedia";
import { FeedTopBar } from "../../components/FeedTopBar";
import { useUi } from "../../components/ui";
import { browseStreams } from "../../lib/streams";
import { type FeedTab } from "../../lib/feed";
import { useApp } from "../../state/AppProvider";
export default function Live(){
 const {s}=useUi();const inset=useSafeAreaInsets();const {contentBottom}=useTabClearance();const {city}=useApp();const [tab,setTab]=useState<FeedTab>("Local");
 const rooms=browseStreams(tab==="Local"?"Nearby":"Popular",city);
 return <View style={s.screen}>
  <ScrollView contentContainerStyle={{padding:16,gap:16,paddingTop:inset.top+78,paddingBottom:contentBottom}} showsVerticalScrollIndicator={false}>
   <PublishedWorkMedia kind="live"/>
   <Text style={s.muted}>Vistas de ejemplo · No son transmisiones reales.</Text>
   <StreamGrid rooms={rooms}/>
   {rooms.length===0&&<Text style={s.muted}>No hay vistas de ejemplo en tu zona.</Text>}
  </ScrollView>
  <View style={{position:"absolute",top:inset.top+4,left:8,right:8,zIndex:20}}>
   <FeedTopBar overlay videoMode tab={tab} onTab={setTab} plusLabel="Iniciar live" onPlus={()=>router.push("/live")} onSearch={()=>router.push({pathname:"/search",params:{mode:"live"}})}/>
  </View>
 </View>;
}
