import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Screen, useUi } from "../../components/ui";
export default function Inbox(){const {s}=useUi();return <Screen title="Tus conversaciones." subtitle="Un lugar para cada oportunidad.">
 <View style={s.panel}><Text style={s.h2}>Todavía no hay mensajes</Text><Text style={s.muted}>Aquí aparecerán tus conversaciones, invitaciones a entrevistas y notificaciones de contrataciones.</Text>
 <Button title="Crear mi cuenta" onPress={()=>router.push("/account")}/></View></Screen>;}
