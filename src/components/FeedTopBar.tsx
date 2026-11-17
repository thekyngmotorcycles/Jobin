import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { FEED_TABS, type FeedTab } from "../lib/feed";
import { useJobinNotices } from "../state/NoticeProvider";
import { useUi } from "./ui";
import { TopNavigationFade } from "./TopNavigationFade";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {JobinTabIcon} from "./JobinTabIcon";

export function FeedTopBar({tab,onTab,onLeading,leading,onSearch,overlay=false,videoMode=false}:{
 tab:FeedTab;onTab:(tab:FeedTab)=>void;onLeading:()=>void;leading:"live"|"videos";onSearch:()=>void;overlay?:boolean;videoMode?:boolean;
}){
 const {colors}=useUi();const {theme}=useTheme();const jt=jobeenTokens(theme);const {unreadActivity}=useJobinNotices();
 const ink=colors.navIcon;
 const tabs=videoMode?FEED_TABS:FEED_TABS.filter(item=>item!=="Following");
 function icon(name:"notifications-outline"|"search-outline",label:string,onPress:()=>void,badge=false){
  return <Pressable key={name} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{width:40,height:48,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name={name} size={27} color={ink}/>
   {badge&&<View accessibilityLabel="Actividad sin leer" style={{position:"absolute",right:2,top:2}}><Ionicons name="heart" size={13} color={colors.reaction}/></View>}
  </Pressable>;
 }
 return <View style={{height:58,justifyContent:"center",backgroundColor:colors.transparent}}>
  <TopNavigationFade/>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:8}}>
   <Pressable accessibilityRole="button" accessibilityLabel={leading==="live"?"Explorar Lives":"Volver a Videos"} onPress={onLeading} style={{width:54,height:48,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:2}}>
    {leading==="live"?<><Ionicons name="radio-outline" size={20} color={ink}/><Text style={{fontSize:11,fontWeight:"900",color:ink}}>LIVE</Text></>:<JobinTabIcon name="videos" size={28} color={ink}/>}
   </Pressable>
   {!videoMode&&icon("notifications-outline","Notificaciones",()=>router.push("/notifications"),unreadActivity>0)}
   <View style={{flex:1,flexDirection:"row",justifyContent:"center",gap:videoMode?8:12}}>
    {tabs.map(item=><Pressable key={item} accessibilityRole="tab" accessibilityState={{selected:tab===item}} onPress={()=>onTab(item)} style={({pressed})=>({minHeight:44,justifyContent:"center",paddingHorizontal:8,borderRadius:12,backgroundColor:tab===item?(theme==="light"?jt.cream:colors.line):colors.transparent,borderBottomWidth:tab===item?2:0,borderBottomColor:theme==="light"?jt.yellow:ink,opacity:pressed?0.72:1})}>
     <Text style={{color:tab===item?ink:colors.muted,fontSize:videoMode?14:15,fontWeight:tab===item?"800":"500"}}>{videoMode&&item==="Following"?"Siguiendo":item}</Text>
    </Pressable>)}
   </View>
   {icon("search-outline","Buscar",onSearch)}
  </View>
 </View>;
}
