import {useMemo,useState} from "react";
import {JOBIN_SETTINGS_GROUPS} from "../../lib/jobin-settings-catalog";
import {JobinSettingsIcon} from "../../components/JobinSettingsIcon";
import {Ionicons} from "@expo/vector-icons";
import {router,useLocalSearchParams} from "expo-router";
import {Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {HOME_MENU_ITEMS} from "../../components/HomeSideMenu";
import {JobinMenuIcon} from "../../components/JobinMenuIcon";
import {useUi} from "../../components/ui";
import {useTheme} from "../../state/ThemeProvider";
import {THEMES} from "../../theme/palettes";
export default function MenuSection(){
 const [query,setQuery]=useState("");
 const filtered=useMemo(()=>JOBIN_SETTINGS_GROUPS.map(group=>({...group,items:group.items.filter(entry=>(entry.title+" "+entry.description).toLowerCase().includes(query.trim().toLowerCase()))})).filter(group=>group.items.length>0),[query]);
 const {section}=useLocalSearchParams<{section:string}>();const {s,colors}=useUi();const {theme,setTheme}=useTheme();
 const item=HOME_MENU_ITEMS.find(entry=>entry.slug===section);
 if(!item)return <SafeAreaView style={s.screen}><Text style={s.h2}>Sección no encontrada</Text></SafeAreaView>;
 return <SafeAreaView edges={["bottom"]} style={s.screen}>
  <ScrollView contentContainerStyle={{padding:24,gap:22,maxWidth:720,width:"100%",alignSelf:"center"}}>
   <View style={{flexDirection:"row",alignItems:"center",gap:14}}>
    <JobinMenuIcon name={item.slug} size={35} color={colors.ink}/>
    <Text accessibilityRole="header" style={[s.h2,{flex:1}]}>{item.label}</Text>
   </View>
   <Text style={s.muted}>{item.description}</Text>
   {section==="configuracion"&&<View style={{gap:24}}>
    <View style={{flexDirection:"row",alignItems:"center",backgroundColor:colors.card,borderRadius:16,borderWidth:1,borderColor:colors.line,paddingHorizontal:14,gap:10}}>
     <Ionicons name="search-outline" size={22} color={colors.muted}/>
     <TextInput accessibilityLabel="Buscar configuración" value={query} onChangeText={setQuery} placeholder="Buscar configuración" placeholderTextColor={colors.muted} style={{flex:1,minHeight:52,color:colors.ink,fontSize:16}}/>
    </View>
    {filtered.map(group=><View key={group.title} style={{gap:9}}>
     <Text accessibilityRole="header" style={[s.h3,{fontSize:22}]}>{group.title}</Text>
     <Text style={s.muted}>{group.description}</Text>
     {group.items.map(entry=><Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={entry.title}
      onPress={()=>router.push(entry.route??({pathname:"/settings/[item]",params:{item:entry.id}} as const))}
      style={({pressed})=>({flexDirection:"row",alignItems:"center",gap:16,paddingVertical:14,opacity:pressed?.55:1})}>
      <JobinSettingsIcon id={entry.id} size={27} color={colors.ink}/>
      <View style={{flex:1,gap:3}}><Text style={[s.text,{fontWeight:"600",fontSize:16}]}>{entry.title}</Text><Text style={s.muted}>{entry.description}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted}/>
     </Pressable>)}
    </View>)}
    {filtered.length===0&&<Text style={s.muted}>No encontramos opciones con ese nombre.</Text>}
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
