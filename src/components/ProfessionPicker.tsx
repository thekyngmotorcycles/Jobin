import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useUi } from "./ui";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ProfessionGlyph } from "./ProfessionGlyph";
import type { ProfessionalCatalog } from "../lib/professional-types";

const normalize=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g," ").trim();
const distance=(a:string,b:string,limit=2)=>{
 if(Math.abs(a.length-b.length)>limit)return limit+1;
 let prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const next=[i];
  for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
  prev=next;
  if(Math.min(...prev)>limit)return limit+1;
 }
 return prev[b.length];
};
const score=(label:string,query:string)=>{
 const name=normalize(label);
 if(!query)return 0;
 if(name===query)return 0;
 if(name.startsWith(query))return 1;
 if(name.includes(query))return 2;
 const words=name.split(" "),terms=query.split(" ").filter(Boolean);
 if(terms.every(term=>words.some(word=>word.startsWith(term))))return 3;
 if(terms.every(term=>words.some(word=>term.length>=4&&distance(term,word,term.length>6?2:1)<= (term.length>6?2:1))))return 4;
 return Infinity;
};
const professionLabel=(code:string,label:string)=>code==="tecnico_hvac_aire_acondicionado"?"Técnico HVAC":code==="refrigeracion"?"Técnico en Refrigeración":label;

export function ProfessionPicker({catalog,value,onChange}:{catalog:ProfessionalCatalog|null;value:string;onChange:(code:string)=>void}) {
 const {s,colors}=useUi();
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState<string|null>(null);
 const [categoriesOpen,setCategoriesOpen]=useState(false);
 const [categoryQuery,setCategoryQuery]=useState("");
 const [professionListOpen,setProfessionListOpen]=useState(!value);
 const q=normalize(query);
 const categories=useMemo(()=>[...(catalog?.categories??[])].sort((a,b)=>a.label.localeCompare(b.label,"es")),[catalog]);
 const visible=useMemo(()=>{
  const matches=(catalog?.professions??[]).filter(p=>!category||p.category===category).map(p=>({
   profession:p,
   rank:Math.min(score(professionLabel(p.code,p.label),q),score(p.code.replace(/_/g," "),q))
  })).filter(item=>Number.isFinite(item.rank));
  return matches.sort((a,b)=>a.rank-b.rank||professionLabel(a.profession.code,a.profession.label).localeCompare(professionLabel(b.profession.code,b.profession.label),"es"));
 },[catalog,category,q]);
 const selected=catalog?.professions.find(p=>p.code===value);
 const displayed=visible.slice(0,35);
 return <View style={{gap:10}}>
  <Text style={[s.eyebrow,{fontSize:12}]}>1. Elegí una categoría</Text>
  <Pressable accessibilityRole="button" accessibilityState={{expanded:categoriesOpen}} onPress={()=>setCategoriesOpen(open=>!open)} style={{minHeight:48,paddingHorizontal:12,borderWidth:1,borderColor:colors.line,borderRadius:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
   <Text style={{color:colors.ink,flex:1}}>{category?categories.find(c=>c.code===category)?.label??"Categoría":"Todas las categorías"}</Text>
   <Ionicons name={categoriesOpen?"chevron-up":"chevron-down"} size={20} color={colors.ink}/>
  </Pressable>
  {categoriesOpen&&<View style={{gap:8,borderWidth:1,borderColor:colors.line,borderRadius:10,padding:10}}>
   <TextInput accessibilityLabel="Buscar categoría" placeholder="Filtrar categorías…" placeholderTextColor={colors.muted} value={categoryQuery} onChangeText={setCategoryQuery} style={{color:colors.ink,borderWidth:1,borderColor:colors.line,borderRadius:8,padding:10}}/>
   <ScrollView style={{maxHeight:220}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
    {[{code:"",label:"Todas las categorías"},...categories].filter(item=>normalize(item.label).includes(normalize(categoryQuery))).map(item=><Pressable key={item.code||"all"} accessibilityRole="button" accessibilityState={{selected:(category??"")===item.code}} onPress={()=>{setCategory(item.code||null);setCategoriesOpen(false);setCategoryQuery("");}} style={{padding:12,minHeight:44,borderRadius:8,backgroundColor:(category??"")===item.code?colors.ink:colors.paper}}>
     <Text style={{color:(category??"")===item.code?colors.inverse:colors.ink}}>{item.label}</Text>
    </Pressable>)}
   </ScrollView>
  </View>}
  <Pressable accessibilityRole="button" accessibilityState={{expanded:professionListOpen}} onPress={()=>setProfessionListOpen(v=>!v)} style={{minHeight:48,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:12,borderWidth:1,borderColor:colors.line,borderRadius:10}}><Text style={{color:colors.ink,flex:1}}>{selected?"Profesión: "+professionLabel(selected.code,selected.label):"2. Buscá y seleccioná tu profesión"}</Text><Ionicons name={professionListOpen?"chevron-up":"chevron-down"} size={20} color={colors.ink}/></Pressable>
  {professionListOpen&&<>
  <View style={{flexDirection:"row",alignItems:"center",borderColor:colors.line,borderWidth:1,borderRadius:10,paddingHorizontal:10}}>
   <Ionicons name="search-outline" size={19} color={colors.muted}/>
   <TextInput accessibilityLabel="Buscar profesión" placeholder="Ej.: electricista, futbolista, mecanico…" placeholderTextColor={colors.muted} autoCorrect={false} value={query} onChangeText={setQuery} style={{color:colors.ink,flex:1,padding:12}}/>
   {!!query&&<Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={()=>setQuery("")} style={{padding:7}}><Ionicons name="close-circle" size={20} color={colors.muted}/></Pressable>}
  </View>
  {!!selected&&<Text style={{color:colors.ink,fontSize:13}}>Seleccionada: {professionLabel(selected.code,selected.label)}</Text>}
  {!catalog?<Text style={s.muted}>El catálogo todavía no está disponible.</Text>:<>
   <Text style={s.muted}>{visible.length} {visible.length===1?"profesión encontrada":"profesiones encontradas"}{visible.length>35?" · Mostrando las primeras 35; escribí para precisar":""}</Text>
   <ScrollView style={{maxHeight:270}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
    {displayed.map(({profession:p})=><Pressable key={p.code} accessibilityRole="button" accessibilityState={{selected:value===p.code}} onPress={()=>{onChange(p.code);setProfessionListOpen(false);setCategoriesOpen(false);setQuery("");setCategoryQuery("");}} style={{padding:12,minHeight:48,borderRadius:8,marginBottom:5,backgroundColor:value===p.code?colors.ink:colors.accent}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
      <ProfessionGlyph profession={p.code} fallback={p.icon as ComponentProps<typeof Ionicons>["name"]} size={22} color={value===p.code?colors.inverse:colors.ink}/>
      <View style={{flex:1,gap:2}}><Text style={{color:value===p.code?colors.inverse:colors.ink,fontSize:14}}>{professionLabel(p.code,p.label)}</Text>{!category&&<Text style={{color:value===p.code?colors.inverse:colors.muted,fontSize:11}}>{categories.find(c=>c.code===p.category)?.label??p.category}</Text>}</View>
      {value===p.code&&<Ionicons name="checkmark-circle" size={21} color={colors.inverse}/>}
     </View>
    </Pressable>)}
    {!visible.length&&<Text style={s.muted}>Sin resultados. Probá con otra palabra o elegí «Todas» las categorías.</Text>}
   </ScrollView>
  </>}
  </>}
 </View>;
}
