import {router} from "expo-router";
import {Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useUi} from "../../components/ui";
import {requireSupabase} from "../../lib/supabase";
export default function PersonalData(){
 const {s,colors}=useUi();const user=requireSupabase().auth.getUser;
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:24,gap:22,maxWidth:700,width:"100%",alignSelf:"center"}}>
  <Text style={[s.h2,{fontFamily:undefined,fontStyle:"normal",fontWeight:"700"}]}>Información personal</Text>
  <Text style={s.muted}>Tu correo y teléfono son necesarios para acceder y recuperar tu cuenta. Puedes decidir si se muestran en tu JCard.</Text>
  <Pressable accessibilityRole="button" onPress={()=>router.push("/professional")} style={s.panel}><Text style={s.h3}>Nombre y datos de la JCard</Text><Text style={s.muted}>Edita tu información profesional y la visibilidad de tus datos de contacto.</Text></Pressable>
  <View style={s.panel}><Text style={s.h3}>Correo electrónico y teléfono</Text><Text style={s.muted}>Por seguridad, los cambios en los métodos de acceso y su verificación se configurarán aquí más adelante. No se modificarán tus credenciales desde esta pantalla.</Text></View>
 </ScrollView></SafeAreaView>;
}
