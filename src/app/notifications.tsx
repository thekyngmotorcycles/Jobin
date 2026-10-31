import { useEffect } from "react";
import { Text, View } from "react-native";
import { Screen, useUi } from "../components/ui";
import { useJobinNotices } from "../state/NoticeProvider";
export default function Notifications(){
 const {notices,markActivityRead}=useJobinNotices();const {s}=useUi();
 useEffect(()=>{markActivityRead();},[]);
 return <Screen title="Notificaciones" subtitle="Actividad de tu cuenta">
  {notices.length===0?<Text style={s.muted}>No tienes notificaciones nuevas.</Text>:notices.map(n=><View key={n.id} style={s.panel}><Text style={s.h3}>{n.title}</Text><Text style={s.muted}>{n.detail}</Text></View>)}
 </Screen>;
}
