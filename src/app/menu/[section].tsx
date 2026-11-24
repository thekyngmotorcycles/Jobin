import {useMemo,useState} from "react";
import {JOBIN_SETTINGS_GROUPS,SETTINGS_LOGOUT_ROUTE,matchesLogout} from "../../lib/jobin-settings-catalog";
import {SettingsMenuRow} from "../../components/SettingsMenuRow";
import {menuChrome} from "../../theme/menu-chrome";
import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams} from "expo-router";
import {Pressable,ScrollView,Text,TextInput,View,useWindowDimensions} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {HOME_MENU_ITEMS} from "../../components/HomeSideMenu";
import {useUi} from "../../components/ui";
import {useTheme} from "../../state/ThemeProvider";
import {THEME_PREFERENCES} from "../../theme/palettes";
import {JOBEEN_TYPE} from "../../theme/typography";
import {JOBEEN_CONTROL,royalHiveLayout} from "../../theme/control-metrics";
export default function MenuSection(){
 const [query,setQuery]=useState("");const {width}=useWindowDimensions();const layout=royalHiveLayout(width);
 const filtered=useMemo(()=>JOBIN_SETTINGS_GROUPS.map(group=>({...group,items:group.items.filter(entry=>(entry.title+" "+entry.description).toLowerCase().includes(query.trim().toLowerCase()))})).filter(group=>group.items.length>0),[query]);
 const {section}=useLocalSearchParams<{section:string}>();const {s,colors}=useUi();const {theme,preference,setTheme}=useTheme();const chrome=menuChrome(theme,colors);
 const item=HOME_MENU_ITEMS.find(entry=>entry.slug===section);
 if(!item)return <SafeAreaView style={[s.screen,{backgroundColor:chrome.surface}]}><Text style={s.h2}>Sección no encontrada</Text></SafeAreaView>;
 return <SafeAreaView edges={["bottom"]} style={[s.screen,{backgroundColor:chrome.surface}]}>
  <Stack.Screen options={{title:section==="centro-privacidad"?"Privacidad":section==="modo-oscuro"?"Apariencia":item.label}}/>
  <ScrollView contentContainerStyle={{padding:layout.margin,gap:16,maxWidth:720,width:"100%",alignSelf:"center"}}>
   {section==="configuracion"&&<View style={{gap:18}}>
    <View style={{flexDirection:"row",alignItems:"center",backgroundColor:chrome.action,borderRadius:JOBEEN_CONTROL.inputRadius,borderWidth:1,borderColor:colors.outline,paddingHorizontal:14,gap:10}}>
     <Ionicons name="search-outline" size={22} color={colors.muted}/>
     <TextInput accessibilityLabel="Buscar configuración" value={query} onChangeText={setQuery} placeholder="Buscar configuración" placeholderTextColor={colors.muted} style={{flex:1,minHeight:JOBEEN_CONTROL.inputHeight,color:colors.ink,fontSize:JOBEEN_TYPE.input}}/>
    </View>
    {filtered.map(group=><View key={group.title} style={{gap:2,marginBottom:8}}>
     <Text accessibilityRole="header" style={s.h3}>{group.title}</Text>
     {group.items.map(entry=><SettingsMenuRow key={entry.id} icon={entry.icon} title={entry.title}
      onPress={()=>{if(entry.route){router.push(entry.route as any);}else{router.push({pathname:"/settings/[item]",params:{item:entry.id}});}}}/>)}
    </View>)}
    {matchesLogout(query)&&<SettingsMenuRow variant="action" tone="danger" icon="log-out-outline" title="Cerrar sesión" onPress={()=>router.push(SETTINGS_LOGOUT_ROUTE as never)}/>}
    {filtered.length===0&&!matchesLogout(query)&&<Text style={s.muted}>No encontramos opciones con ese nombre.</Text>}
   </View>}
   {section==="centro-privacidad"&&<View style={{gap:2}}>
    <SettingsMenuRow title="Privacidad de la JCard" icon="id-card-outline" onPress={()=>router.push("/professional")}/>
    <SettingsMenuRow title="Solicitudes de mensajes" icon="chatbubble-outline" onPress={()=>router.push("/message-requests")}/>
   </View>}
   {section==="normas-politicas"&&<View style={{gap:2}}>
    <SettingsMenuRow title="Términos y condiciones (borrador)" icon="document-text-outline" onPress={()=>router.push("/terms")}/>
    <SettingsMenuRow title="Seguridad y apelaciones" icon="shield-checkmark-outline" onPress={()=>router.push("/safety")}/>
   </View>}
   {section==="modo-oscuro"&&<View style={s.panel}><Text style={s.h3}>Tema de la aplicación</Text>
    {THEME_PREFERENCES.map(option=><Pressable key={option.id} accessibilityRole="radio" accessibilityState={{checked:preference===option.id}} onPress={()=>setTheme(option.id)}
     style={{flexDirection:"row",alignItems:"center",paddingVertical:13,gap:12,minHeight:JOBEEN_CONTROL.touchTarget}}>
     <Ionicons name={preference===option.id?"radio-button-on":"radio-button-off"} size={24} color={colors.ink}/>
     <Text style={s.text}>{option.label}</Text>
    </Pressable>)}
   </View>}
   {!["configuracion","centro-privacidad","modo-oscuro","normas-politicas"].includes(section??"")&&<View style={s.panel}>
    <Text style={s.h3}>Próximamente</Text>
    <Text style={s.muted}>Esta función todavía no está disponible.</Text>
   </View>}
  </ScrollView>
 </SafeAreaView>;
}
