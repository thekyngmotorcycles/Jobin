import {Ionicons} from "@expo/vector-icons";
import {router,useLocalSearchParams} from "expo-router";
import {useMemo,useState} from "react";
import {Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {JOBIN_SETTINGS_GROUPS} from "../../lib/jobin-settings-catalog";
import {JobinSettingsIcon} from "../../components/JobinSettingsIcon";
import {useUi} from "../../components/ui";
export default function JobinSettings(){
 const {item}=useLocalSearchParams<{item:string}>();const {s,colors}=useUi();
 const found=useMemo(()=>JOBIN_SETTINGS_GROUPS.flatMap(group=>group.items).find(entry=>entry.id===item),[item]);
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:22,gap:20,maxWidth:760,width:"100%",alignSelf:"center"}}>
  <View style={{flexDirection:"row",alignItems:"center",gap:16}}><JobinSettingsIcon id={item??""} size={35} color={colors.ink}/><Text accessibilityRole="header" style={[s.h2,{flex:1}]}>{found?.title??"Configuración"}</Text></View>
  <Text style={s.muted}>{found?.description??"Esta sección todavía no está disponible."}</Text>
  <View style={s.panel}><Text style={s.h3}>Próximamente</Text><Text style={s.muted}>Esta página está preparada para que diseñemos y configuremos sus opciones. Todavía no modifica datos de tu cuenta.</Text></View>
  <Pressable accessibilityRole="button" onPress={()=>router.back()} style={{paddingVertical:12}}><Text style={s.text}>Volver a Configuración</Text></Pressable>
 </ScrollView></SafeAreaView>;
}
