import {router} from "expo-router";
import {Text,View} from "react-native";
import {PageFrame,useUi} from "../../components/ui";
import {SettingsMenuRow} from "../../components/SettingsMenuRow";
export default function AccountType(){
 const {s}=useUi();
 return <PageFrame kind="settings">
  <View style={s.panel}>
   <Text accessibilityRole="header" style={s.h3}>Personal, empresa o ambas</Text>
   <Text style={s.text}>El tipo de cuenta se elige al registrarte. Todavía no puedes cambiarlo desde esta página.</Text>
  </View>
  <SettingsMenuRow title="Editar JCard" icon="id-card-outline" onPress={()=>router.push("/professional")}/>
 </PageFrame>;
}
