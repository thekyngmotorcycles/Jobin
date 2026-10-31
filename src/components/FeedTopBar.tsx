import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { FEED_TABS, type FeedTab } from "../lib/feed";
import { useJobinNotices } from "../state/NoticeProvider";
import { useUi } from "./ui";
import { TopNavigationFade } from "./TopNavigationFade";

export function FeedTopBar({tab,onTab,onPlus,plusLabel,onSearch,overlay=false,videoMode=false}:{
 tab:FeedTab;onTab:(tab:FeedTab)=>void;onPlus:()=>void;plusLabel:string;onSearch:()=>void;overlay?:boolean;videoMode?:boolean;
}){
 const {colors}=useUi();const {unreadActivity}=useJobinNotices();
 const ink=colors.navIcon;
 const tabs=videoMode?FEED_TABS:FEED_TABS.filter(item=>item!=="Following");
 function icon(name:"add"|"notifications-outline"|"search-outline",label:string,onPress:()=>void,badge=false){
  return <Pressable key={name} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{width:40,height:48,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name={name} size={27} color={ink}/>
   {badge&&<View accessibilityLabel="Actividad sin leer" style={{position:"absolute",right:2,top:2}}><Ionicons name="heart" size={13} color={colors.reaction}/></View>}
  </Pressable>;
 }
 return <View style={{height:58,justifyContent:"center",backgroundColor:colors.transparent}}>
  <TopNavigationFade/>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:8}}>
   {icon("add",plusLabel,onPlus)}
   {!videoMode&&icon("notifications-outline","Notificaciones",()=>router.push("/notifications"),unreadActivity>0)}
   <View style={{flex:1,flexDirection:"row",justifyContent:"center",gap:videoMode?8:12}}>
    {tabs.map(item=><Pressable key={item} accessibilityRole="tab" accessibilityState={{selected:tab===item}} onPress={()=>onTab(item)} style={{minHeight:44,justifyContent:"center",borderBottomWidth:tab===item?2:0,borderBottomColor:ink}}>
     <Text style={{color:tab===item?ink:colors.muted,fontSize:videoMode?14:15,fontWeight:tab===item?"800":"500"}}>{item}</Text>
    </Pressable>)}
   </View>
   {icon("search-outline","Buscar",onSearch)}
  </View>
 </View>;
}
