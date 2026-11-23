import {useMemo,useState} from "react";
import {JOBIN_SETTINGS_GROUPS} from "../../lib/jobin-settings-catalog";
import {SettingsMenuRow} from "../../components/SettingsMenuRow";
import {menuChrome} from "../../theme/menu-chrome";
import {Ionicons} from "@expo/vector-icons";
import {router,useLocalSearchParams} from "expo-router";
import {Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {HOME_MENU_ITEMS} from "../../components/HomeSideMenu";
import {useUi} from "../../components/ui";
import {useTheme} from "../../state/ThemeProvider";
import {THEME_PREFERENCES} from "../../theme/palettes";
import {JOBEEN_CONTROL} from "../../theme/control-metrics";
export default function MenuSection(){
 const [query,setQuery]=useState("");
 const filtered=useMemo(()=>JOBIN_SETTINGS_GROUPS.map(group=>({...group,items:group.items.filter(entry=>(entry.title+" "+entry.description).toLowerCase().includes(query.trim().toLowerCase()))})).filter(group=>group.items.length>0),[query]);
 const {section}=useLocalSearchParams<{section:string}>();const {s,colors}=useUi();const {theme,preference,setTheme}=useTheme();const chrome=menuChrome(theme,colors);
 const item=HOME_MENU_ITEMS.find(entry=>entry.slug===section);
 if(!item)return <SafeAreaView style={[s.screen,{backgroundColor:chrome.surface}]}><Text style={s.h2}>Sección no encontrada</Text></SafeAreaView>;
 return <SafeAreaView edges={["bottom"]} style={[s.screen,{backgroundColor:chrome.surface}]}>
  <ScrollView contentContainerStyle={{padding:24,gap:22,maxWidth:720,width:"100%",alignSelf:"center"}}>
   {section!=="configuracion"&&<Text style={s.muted}>{item.description}</Text>}
   {section==="configuracion"&&<View style={{gap:18}}>
    <View style={{flexDirection:"row",alignItems:"center",backgroundColor:chrome.action,borderRadius:20,borderWidth:1,borderColor:chrome.border,paddingHorizontal:14,gap:10}}>
     <Ionicons name="search-outline" size={22} color={colors.muted}/>
     <TextInput accessibilityLabel="Buscar configuración" value={query} onChangeText={setQuery} placeholder="Buscar configuración" placeholderTextColor={colors.muted} style={{flex:1,minHeight:52,color:colors.ink,fontSize:16}}/>
    </View>
    {filtered.map(group=><View key={group.title} style={{gap:10,marginBottom:8}}>
     <Text accessibilityRole="header" style={[s.h3,{fontSize:22}]}>{group.title}</Text>
     <Text style={s.muted}>{group.description}</Text>
     {group.items.map(entry=><SettingsMenuRow key={entry.id} settingId={entry.id} title={entry.title} description={entry.description}
      onPress={()=>{if(entry.route){router.push(entry.route as any);}else{router.push({pathname:"/settings/[item]",params:{item:entry.id}});}}}/>)}
    </View>)}
    {filtered.length===0&&<Text style={s.muted}>No encontramos opciones con ese nombre.</Text>}
   </View>}
   {section==="centro-privacidad"&&<Pressable accessibilityRole="button" onPress={()=>router.push("/professional")} style={s.panel}><Text style={s.text}>Visibilidad del correo y teléfono en mi JCard</Text><Text style={s.muted}>Configura estos datos desde Editar JCard.</Text></Pressable>}
   {section==="modo-oscuro"&&<View style={s.panel}><Text style={s.h3}>Tema de la aplicación</Text>
    {THEME_PREFERENCES.map(option=><Pressable key={option.id} accessibilityRole="radio" accessibilityState={{checked:preference===option.id}} onPress={()=>setTheme(option.id)}
     style={{flexDirection:"row",alignItems:"center",paddingVertical:13,gap:12,minHeight:JOBEEN_CONTROL.touchTarget}}>
     <Ionicons name={preference===option.id?"radio-button-on":"radio-button-off"} size={24} color={colors.ink}/>
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
