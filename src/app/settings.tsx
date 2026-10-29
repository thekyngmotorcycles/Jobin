import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, Chips, Screen, useUi } from "../components/ui";
import { useTheme, type ThemeName } from "../state/ThemeProvider";
export default function Settings(){
 const {s}=useUi();const {theme,setTheme}=useTheme();
 return <Screen title="A tu manera." subtitle="Configuración de cuenta y apariencia.">
 <View style={s.panel}><Text style={s.h2}>Apariencia</Text>
 <Chips<ThemeName> values={["light","dark","pink"]} value={theme} onChange={setTheme} label="Tema de la aplicación"/>
 <Text style={s.muted}>Light: blanco y negro. Dark: negro y blanco. Pink: rosado y blanco. Tu elección se guarda en este dispositivo.</Text></View>
 <View style={s.panel}><Button secondary title="Editar mi perfil" onPress={()=>router.navigate("/profile")}/>
 <Button secondary title="Cuenta personal o compañía" onPress={()=>router.push("/account")}/>
 <Button secondary title="Mi compañía e historial laboral" onPress={()=>router.push("/company")}/>
 <Button secondary title="Servicios" onPress={()=>router.push("/services")}/>
 <Button secondary title="Comunidades" onPress={()=>router.push("/communities")}/></View>
 </Screen>;
}
