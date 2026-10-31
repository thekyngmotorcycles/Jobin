import { THEMES } from "../theme/palettes";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, Chips, Screen, useUi } from "../components/ui";
import { useTheme, type ThemeName } from "../state/ThemeProvider";
export default function Settings(){
 const {s,fs}=useUi();const {theme,setTheme}=useTheme();
 return <Screen demo={false} plainHeading showBadge={false} title="A tu manera." subtitle="Configuración de cuenta y apariencia.">
 <View style={s.panel}><Text style={[s.h3,{fontSize:fs(25)}]}>Apariencia</Text>
 <Chips<ThemeName> values={THEMES.map(t=>t.id)} getLabel={value=>THEMES.find(t=>t.id===value)!.label} value={theme} onChange={setTheme} label="Tema de la aplicación"/>
 <Text style={s.muted}>Light: blanco y negro. Dark: negro y blanco. Pink: rosado y blanco. Navy Green: verde claro y verde oscuro. Camel: beige y marrón oscuro. Tu elección se guarda en este dispositivo.</Text></View>
 <View style={s.panel}><Button secondary title="Editar mi perfil" onPress={()=>router.navigate("/profile")}/>
 <Button secondary title="Cuenta personal o compañía" onPress={()=>router.push("/account")}/>
 <Button secondary title="Mi compañía e historial laboral" onPress={()=>router.push("/company")}/>
 <Button secondary title="Seguridad, sanciones y apelaciones" onPress={()=>router.push("/safety")}/>
 <Button secondary title="Términos y Condiciones · Borrador" onPress={()=>router.push("/terms")}/>
 <Button secondary title="Servicios" onPress={()=>router.push("/services")}/>
 <Button secondary title="Comunidades" onPress={()=>router.push("/communities")}/></View>
 </Screen>;
}
