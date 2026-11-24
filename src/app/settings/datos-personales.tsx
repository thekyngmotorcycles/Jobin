import {router} from "expo-router";
import {Text,View} from "react-native";
import {PageFrame,useUi} from "../../components/ui";
import {SettingsMenuRow} from "../../components/SettingsMenuRow";
export default function PersonalData(){
 const {s}=useUi();
 return <PageFrame kind="settings">
  <SettingsMenuRow title="Nombre y datos de la JCard" icon="id-card-outline" onPress={()=>router.push("/professional")}/>
  <View style={s.panel}>
   <Text accessibilityRole="header" style={s.h3}>Correo electrónico y teléfono</Text>
   <Text style={s.text}>Tus datos de acceso sirven para recuperar tu cuenta. La visibilidad en tu JCard se configura por separado.</Text>
   <Text style={s.muted}>Los cambios de credenciales y su verificación todavía no están disponibles aquí.</Text>
  </View>
 </PageFrame>;
}
