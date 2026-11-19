import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {Pressable,View} from "react-native";
import {countPendingProfileAlerts} from "../lib/activity-notifications";
import {useJobinNotices} from "../state/NoticeProvider";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

const REFRESH_INTERVAL_MS=30_000;

export function NotificationBell(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const {unreadActivity}=useJobinNotices();
 const [count,setCount]=useState(0);
 useFocusEffect(useCallback(()=>{
  let active=true;
  const refresh=()=>{void countPendingProfileAlerts().then(n=>{if(active)setCount(n);})
   .catch(()=>{/* Preserve the last confirmed badge until the next refresh. */});};
  refresh();
  // The profile can remain open while new alerts arrive. Refresh only while
  // focused, rather than running polling in the background.
  const interval=setInterval(refresh,REFRESH_INTERVAL_MS);
  return()=>{active=false;clearInterval(interval);};
 },[]));
 const hasAlerts=count+unreadActivity>0;
 return <Pressable accessibilityRole="button" accessibilityLabel={"Notificaciones"+(hasAlerts?", avisos pendientes":"")}
  onPress={()=>router.push("/notifications")}
  style={{width:44,height:44,alignItems:"center",justifyContent:"center",borderRadius:22}}>
  <Ionicons name="notifications-outline" size={24} color={t.ink}/>
  {hasAlerts&&<View pointerEvents="none"
   style={{position:"absolute",right:6,top:5,width:11,height:11,borderRadius:6,
    backgroundColor:t.yellow,borderWidth:1.5,borderColor:t.bg}}/>}
 </Pressable>;
}
