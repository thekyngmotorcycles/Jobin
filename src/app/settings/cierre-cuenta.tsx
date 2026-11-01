import {ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useUi} from "../../components/ui";
export default function CloseAccount(){
 const {s}=useUi();
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:24,gap:20,maxWidth:700,width:"100%",alignSelf:"center"}}>
  <Text style={[s.h2,{fontFamily:undefined,fontStyle:"normal",fontWeight:"700"}]}>Desactivar o eliminar cuenta</Text>
  <Text style={s.muted}>Esta sección te permitirá gestionar la desactivación temporal o eliminación permanente de tu cuenta.</Text>
  <View style={s.panel}><Text style={s.h3}>Todavía no disponible</Text><Text style={s.muted}>Estas acciones requieren confirmaciones de identidad y medidas para proteger tus datos. Por ahora no se realizará ningún cambio en tu cuenta desde esta página.</Text></View>
 </ScrollView></SafeAreaView>;
}
