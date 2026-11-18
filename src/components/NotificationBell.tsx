import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useState} from "react";
import {Pressable,Text,View} from "react-native";
import {countUnreadActivityNotifications} from "../lib/activity-notifications";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

export function NotificationBell(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [count,setCount]=useState(0);
 useFocusEffect(useCallback(()=>{
  let active=true;
  void countUnreadActivityNotifications().then(n=>{if(active)setCount(n);}).catch(()=>{if(active)setCount(0);});
  return()=>{active=false;};
 },[]));
 return <Pressable accessibilityRole="button" accessibilityLabel={"Notificaciones"+(count?", "+count+" sin leer":"")}
  onPress={()=>router.push("/notifications")} style={{width:44,height:44,alignItems:"center",justifyContent:"center",borderRadius:22}}>
  <Ionicons name={count>0?"notifications":"notifications-outline"} size={24} color={t.ink}/>
  {count>0&&<View style={{position:"absolute",right:0,top:0,minWidth:18,height:18,borderRadius:10,backgroundColor:t.yellow,
   borderWidth:1,borderColor:t.bg,paddingHorizontal:3,alignItems:"center",justifyContent:"center"}}>
   <Text style={{fontSize:10,color:t.ink,fontWeight:"800"}}>{count>99?"99+":count}</Text>
  </View>}
 </Pressable>;
}
