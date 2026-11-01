import {router} from "expo-router";
import {Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useUi} from "../../components/ui";
export default function AccountType(){
 const {s}=useUi();
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:24,gap:20,maxWidth:700,width:"100%",alignSelf:"center"}}>
  <Text style={[s.h2,{fontFamily:undefined,fontStyle:"normal",fontWeight:"700"}]}>Tipo de cuenta</Text>
  <Text style={s.muted}>Jobin permite perfiles personales, de empresa o ambos. El tipo se elige al registrarte.</Text>
  <View style={s.panel}><Text style={s.h3}>Personal, empresa o ambas</Text><Text style={s.muted}>Los cambios de tipo de cuenta se habilitarán cuando podamos conservar correctamente tus datos y verificaciones. No es necesario volver a registrarte.</Text></View>
  <Pressable accessibilityRole="button" onPress={()=>router.push("/professional")} style={s.panel}><Text style={s.h3}>Editar JCard</Text><Text style={s.muted}>Actualiza la información visible de tu perfil.</Text></Pressable>
 </ScrollView></SafeAreaView>;
}
