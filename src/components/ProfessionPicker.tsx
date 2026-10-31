import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useUi } from "./ui";
import type { ProfessionalCatalog } from "../lib/professional-types";
export function ProfessionPicker({catalog,value,onChange}:{catalog:ProfessionalCatalog|null;value:string;onChange:(code:string)=>void}) {
 const {s,colors}=useUi();const [query,setQuery]=useState("");
 const visible=useMemo(()=>catalog?.professions.filter(p=>p.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))??[],[catalog,query]);
 return <View style={{gap:10}}>
  <TextInput accessibilityLabel="Buscar profesión" placeholder="Buscar profesión u oficio" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={{color:colors.ink,borderColor:colors.line,borderWidth:1,padding:12,borderRadius:10}}/>
  {!catalog?<Text style={s.muted}>El catálogo todavía no está disponible.</Text>:
  <ScrollView style={{maxHeight:240}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
   {catalog.categories.map(category=>{
    const professions=visible.filter(p=>p.category===category.code);
    if(!professions.length)return null;
    return <View key={category.code} style={{gap:4,marginBottom:12}}>
     <Text style={s.eyebrow}>{category.label}</Text>
     {professions.map(p=><Pressable key={p.code} accessibilityRole="button" accessibilityState={{selected:value===p.code}} onPress={()=>onChange(p.code)} style={{padding:12,minHeight:44,borderRadius:8,backgroundColor:value===p.code?colors.ink:colors.accent}}>
      <Text style={{color:value===p.code?colors.inverse:colors.ink,fontSize:13}}>{p.label}</Text>
     </Pressable>)}
    </View>;
   })}
   {visible.length===0&&<Text style={s.muted}>No hay profesiones que coincidan.</Text>}
  </ScrollView>}
 </View>;
}
