import { useState } from "react";
import { ScrollView,Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StreamGrid } from "../../components/StreamGrid";
import { PublishedWorkMedia } from "../../components/PublishedWorkMedia";
import { FeedTopBar } from "../../components/FeedTopBar";
import { useUi } from "../../components/ui";
import { browseStreams } from "../../lib/streams";
import { type FeedTab } from "../../lib/feed";
import { useApp } from "../../state/AppProvider";
export default function Live(){
 const {s}=useUi();const {city}=useApp();const [tab,setTab]=useState<FeedTab>("Local");
 const rooms=browseStreams(tab==="Local"?"Nearby":"Popular",city);
 return <SafeAreaView edges={["top","left","right"]} style={s.screen}>
  <FeedTopBar tab={tab} onTab={setTab} plusLabel="Iniciar live" onPlus={()=>router.push("/live")} onSearch={()=>router.push({pathname:"/search",params:{mode:"live"}})}/>
  <ScrollView contentContainerStyle={{padding:16,gap:16,paddingBottom:32}} showsVerticalScrollIndicator={false}>
   <PublishedWorkMedia kind="live"/>
   <Text style={s.muted}>Vistas de ejemplo · No son transmisiones reales.</Text>
   <StreamGrid rooms={rooms}/>
   {rooms.length===0&&<Text style={s.muted}>No hay vistas de ejemplo en tu zona.</Text>}
  </ScrollView>
 </SafeAreaView>;
}
