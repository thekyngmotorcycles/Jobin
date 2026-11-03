import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useUi } from "./ui";
import { Ionicons } from "@expo/vector-icons";
import type {ComponentProps} from "react";
import {ProfessionGlyph} from "./ProfessionGlyph";
import type { ProfessionalCatalog } from "../lib/professional-types";
export function ProfessionPicker({catalog,value,onChange}:{catalog:ProfessionalCatalog|null;value:string;onChange:(code:string)=>void}) {
 const {s,colors}=useUi();const [query,setQuery]=useState("");
 const professionLabel=(code:string,label:string)=>code==="tecnico_hvac_aire_acondicionado"?"Técnico HVAC":code==="refrigeracion"?"Técnico en Refrigeración":label;
 const visible=useMemo(()=>catalog?.professions.filter(p=>professionLabel(p.code,p.label).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))??[],[catalog,query]);
 return <View style={{gap:10}}>
  <TextInput accessibilityLabel="Buscar profesión" placeholder="Buscar profesión u oficio" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,borderRadius:10}}/>
  {!catalog?<Text style={s.muted}>El catálogo todavía no está disponible.</Text>:
  <ScrollView style={{maxHeight:240}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
   {visible.map(p=><Pressable key={p.code} accessibilityRole="button" accessibilityState={{selected:value===p.code}} onPress={()=>onChange(p.code)} style={{padding:12,minHeight:44,borderRadius:8,marginBottom:6,backgroundColor:value===p.code?colors.ink:colors.accent}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:12}}><ProfessionGlyph profession={p.code} fallback={p.icon as ComponentProps<typeof Ionicons>["name"]} size={22} color={value===p.code?colors.inverse:colors.ink}/><Text style={{color:value===p.code?colors.inverse:colors.ink,fontSize:13,flex:1}}>{professionLabel(p.code,p.label)}</Text></View>
   </Pressable>)}
   {visible.length===0&&<Text style={s.muted}>No hay profesiones que coincidan.</Text>}
  </ScrollView>}
 </View>;
}
