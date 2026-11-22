import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {Pressable,View} from "react-native";
import {countPendingProfileAlerts} from "../lib/activity-notifications";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {useJobinNotices} from "../state/NoticeProvider";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

const REFRESH_INTERVAL_MS=30_000;

export function NotificationBell(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const {unreadActivity}=useJobinNotices();
 const [count,setCount]=useState(0);
 useFocusEffect(useCallback(()=>{
  let active=true,running=false,scope:MessageScope|null=null,invalidated=false;
  setCount(0);
  const refresh=()=>{
   if(!active||running||invalidated)return;
   running=true;
   void(async()=>{
    try{
     if(!scope)scope=await captureMessageScope();
     if(!active)return;
     const n=await countPendingProfileAlerts(scope);
     await assertMessageScope(scope);
     if(active)setCount(n);
    }catch{
     if(active)setCount(0);
     // Once captured, never rebind a focused instance to a different session.
     if(scope){try{await assertMessageScope(scope);}catch{invalidated=true;}}
    }finally{running=false;}
   })();
  };
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
