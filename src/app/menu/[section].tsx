import {Ionicons} from "@expo/vector-icons";
import {router,useLocalSearchParams} from "expo-router";
import {Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {HOME_MENU_ITEMS} from "../../components/HomeSideMenu";
import {useUi} from "../../components/ui";
import {useTheme} from "../../state/ThemeProvider";
import {THEMES} from "../../theme/palettes";
export default function MenuSection(){
 const {section}=useLocalSearchParams<{section:string}>();const {s,colors}=useUi();const {theme,setTheme}=useTheme();
 const item=HOME_MENU_ITEMS.find(entry=>entry.slug===section);
 if(!item)return <SafeAreaView style={s.screen}><Text style={s.h2}>Sección no encontrada</Text></SafeAreaView>;
 return <SafeAreaView edges={["bottom"]} style={s.screen}>
  <ScrollView contentContainerStyle={{padding:24,gap:22,maxWidth:720,width:"100%",alignSelf:"center"}}>
   <View style={{flexDirection:"row",alignItems:"center",gap:14}}>
    <Ionicons name={item.icon} size={35} color={colors.ink}/>
    <Text accessibilityRole="header" style={[s.h2,{flex:1}]}>{item.label}</Text>
   </View>
   <Text style={s.muted}>{item.description}</Text>
   {section==="configuracion"&&<View style={{gap:12}}>
    <Pressable accessibilityRole="button" onPress={()=>router.push("/settings")} style={[s.panel,{flexDirection:"row",alignItems:"center"}]}>
     <Ionicons name="settings-outline" size={22} color={colors.ink}/><Text style={[s.text,{flex:1}]}>Configuración general</Text><Ionicons name="chevron-forward" size={20} color={colors.ink}/>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={()=>router.push("/professional")} style={[s.panel,{flexDirection:"row",alignItems:"center"}]}>
     <Ionicons name="person-outline" size={22} color={colors.ink}/><Text style={[s.text,{flex:1}]}>Editar mi JCard</Text><Ionicons name="chevron-forward" size={20} color={colors.ink}/>
    </Pressable>
   </View>}
   {section==="centro-privacidad"&&<Pressable accessibilityRole="button" onPress={()=>router.push("/professional")} style={s.panel}><Text style={s.text}>Visibilidad del correo y teléfono en mi JCard</Text><Text style={s.muted}>Configura estos datos desde Editar JCard.</Text></Pressable>}
   {section==="modo-oscuro"&&<View style={s.panel}><Text style={s.h3}>Tema de la aplicación</Text>
    {THEMES.map(option=><Pressable key={option.id} accessibilityRole="radio" accessibilityState={{checked:theme===option.id}} onPress={()=>setTheme(option.id)}
     style={{flexDirection:"row",alignItems:"center",paddingVertical:13,gap:12}}>
     <Ionicons name={theme===option.id?"radio-button-on":"radio-button-off"} size={24} color={colors.ink}/>
     <Text style={s.text}>{option.label}</Text>
    </Pressable>)}
   </View>}
   {!["configuracion","centro-privacidad","modo-oscuro"].includes(section??"")&&<View style={s.panel}>
    <Text style={s.h3}>Espacio de configuración</Text>
    <Text style={s.muted}>La página ya está creada. Configuraremos sus controles y funciones cuando trabajemos en esta sección.</Text>
   </View>}
  </ScrollView>
 </SafeAreaView>;
}
