import { useTabClearance } from "../../theme/navigation";
import { useRef,useState } from "react";
import { Animated,Pressable,ScrollView,Text,View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StreamGrid } from "../../components/StreamGrid";
import { FeedTopBar } from "../../components/FeedTopBar";
import { useUi } from "../../components/ui";
import { browseStreams,type LiveStream } from "../../lib/streams";
import { type FeedTab } from "../../lib/feed";
import { useApp } from "../../state/AppProvider";

const FILTERS=["Todo","Servicios","Educación","Comercio","Tecnología"] as const;
type Filter=typeof FILTERS[number];
function matchesFilter(room:LiveStream,filter:Filter){
 if(filter==="Todo")return true;
 if(filter==="Comercio")return room.category==="Shop";
 if(filter==="Tecnología")return room.category==="Games"||/developer|software|tecnolog/i.test(room.profession);
 if(filter==="Educación")return /trainer|teacher|profesor|instructor|educa/i.test(room.profession);
 return room.category==="Work"&&!/trainer|teacher|profesor|instructor|educa/i.test(room.profession);
}
export default function Live(){
 const {s,colors}=useUi();const inset=useSafeAreaInsets();const {contentBottom}=useTabClearance();const {city}=useApp();
 const [tab,setTab]=useState<FeedTab>("Local");const [filter,setFilter]=useState<Filter>("Todo");
 const scrollY=useRef(new Animated.Value(0)).current;
 const unselectedOpacity=scrollY.interpolate({inputRange:[0,65,145],outputRange:[1,0.45,0],extrapolate:"clamp"});
 const rooms=browseStreams(tab==="Local"?"Nearby":"Popular",city).filter(room=>matchesFilter(room,filter));
 return <View style={s.screen}>
  <Animated.ScrollView onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})} scrollEventThrottle={16}
   contentContainerStyle={{paddingTop:inset.top+78,paddingBottom:contentBottom,gap:14}} showsVerticalScrollIndicator={false}>
   <Pressable accessibilityRole="button" accessibilityLabel="Iniciar una transmisión de tu trabajo" onPress={()=>router.push("/live")}
    style={{marginHorizontal:16,borderRadius:16,backgroundColor:colors.accent,paddingHorizontal:18,paddingVertical:14,flexDirection:"row",alignItems:"center",gap:14}}>
    <View style={{flex:1,gap:4}}>
     <Text style={{color:colors.ink,fontSize:20,fontWeight:"800"}}>Tu trabajo. En tiempo real.</Text>
     <Text style={{color:colors.muted,fontSize:12}}>Muestra lo que haces y conecta con nuevos clientes.</Text>
    </View>
    <View style={{alignItems:"center",gap:4}}><Ionicons name="radio-outline" size={26} color={colors.ink}/><Text style={{color:colors.ink,fontSize:11,fontWeight:"700"}}>Transmitir</Text></View>
   </Pressable>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,gap:9,alignItems:"center",paddingVertical:4}}>
    {FILTERS.map(item=><Animated.View key={item} style={{opacity:item===filter?1:unselectedOpacity}}>
     <Pressable accessibilityRole="button" accessibilityLabel={"Filtrar directos: "+item} accessibilityState={{selected:item===filter}} onPress={()=>setFilter(item)}
      style={{paddingHorizontal:17,paddingVertical:10,borderRadius:28,backgroundColor:item===filter?colors.ink:colors.card,borderWidth:1,borderColor:item===filter?colors.ink:colors.line}}>
      <Text style={{color:item===filter?colors.paper:colors.ink,fontSize:14,fontWeight:item===filter?"800":"600"}}>{item}</Text>
     </Pressable>
    </Animated.View>)}
   </ScrollView>
   <View style={{paddingHorizontal:16,gap:14}}>
    <Text style={s.muted}>Vistas de ejemplo · No son transmisiones reales.</Text>
    <StreamGrid rooms={rooms}/>
    {rooms.length===0&&<Text style={s.muted}>No hay transmisiones de ejemplo para este filtro.</Text>}
   </View>
  </Animated.ScrollView>
  <View style={{position:"absolute",top:inset.top+4,left:8,right:8,zIndex:20}}>
   <FeedTopBar overlay videoMode tab={tab} onTab={setTab} plusLabel="Iniciar live" onPlus={()=>router.push("/live")} onSearch={()=>router.push({pathname:"/search",params:{mode:"live"}})}/>
  </View>
 </View>;
}
