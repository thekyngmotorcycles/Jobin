import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUi } from "./ui";

const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim();
const near=(a:string,b:string)=>{
 if(Math.abs(a.length-b.length)>2)return false;
 let row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const next=[i];
  for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));
  row=next;
 }
 return row[b.length]<=(a.length>6?2:1);
};
export function SpecialtyPicker({options,selected,onChange,loading=false}:{options:string[];selected:string[];onChange:(values:string[])=>void;loading?:boolean}) {
 const {s,colors}=useUi();
 const [query,setQuery]=useState("");
 const [showAll,setShowAll]=useState(false);
 const q=normalize(query);
 const filtered=useMemo(()=>options.filter(item=>{
  if(!q)return true;
  const name=normalize(item);
  return name.includes(q)||q.split(/\s+/).every(term=>name.split(/\s+/).some(word=>word.startsWith(term)||(term.length>=4&&near(term,word))));
 }),[options,q]);
 const visible=showAll||q?filtered:filtered.slice(0,12);
 const toggle=(item:string)=>onChange(selected.includes(item)?selected.filter(x=>x!==item):selected.length<20?[...selected,item]:selected);
 return <View style={{gap:9}}>
  <Text style={s.muted}>{selected.length}/20 especialidades seleccionadas</Text>
  {!!selected.length&&<View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>
   {selected.map(item=><Pressable key={item} accessibilityRole="checkbox" accessibilityState={{checked:true}} accessibilityLabel={"Quitar "+item} onPress={()=>toggle(item)} style={{borderRadius:14,borderWidth:1,borderColor:colors.line,padding:8,backgroundColor:colors.accent}}><Text style={{color:colors.ink,fontSize:12}}>✓ {item} ×</Text></Pressable>)}
  </View>}
  {options.length>8&&<View style={{flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:colors.line,borderRadius:10,paddingHorizontal:10}}>
   <Ionicons name="search-outline" size={18} color={colors.muted}/>
   <TextInput accessibilityLabel="Buscar especialidad" placeholder="Buscar especialidad (admite errores)" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={{flex:1,padding:10,color:colors.ink}}/>
   {!!query&&<Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda de especialidades" onPress={()=>setQuery("")}><Ionicons name="close-circle" size={20} color={colors.muted}/></Pressable>}
  </View>}
  {!options.length?<Text style={s.muted}>{loading?"Cargando especialidades…":"Sin especialidades disponibles para esta profesión."}</Text>:
   <ScrollView style={{maxHeight:300}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
     {visible.map(item=><Pressable key={item} accessibilityRole="checkbox" accessibilityState={{checked:selected.includes(item)}} onPress={()=>toggle(item)} style={{borderWidth:1,borderColor:colors.line,borderRadius:12,paddingHorizontal:10,paddingVertical:10,minHeight:44,backgroundColor:selected.includes(item)?colors.accent:colors.paper}}><Text style={{color:colors.ink,fontSize:13}}>{selected.includes(item)?"✓ ":""}{item}</Text></Pressable>)}
    </View>
    {!visible.length&&<Text style={s.muted}>No encontramos esa especialidad. Probá con otra palabra.</Text>}
    {!q&&!showAll&&filtered.length>12&&<Pressable accessibilityRole="button" onPress={()=>setShowAll(true)} style={{padding:12,alignItems:"center"}}><Text style={{color:colors.ink,textDecorationLine:"underline"}}>Ver todas ({filtered.length})</Text></Pressable>}
    {!q&&showAll&&filtered.length>12&&<Pressable accessibilityRole="button" onPress={()=>setShowAll(false)} style={{padding:12,alignItems:"center"}}><Text style={{color:colors.ink,textDecorationLine:"underline"}}>Mostrar menos</Text></Pressable>}
   </ScrollView>}
 </View>;
}
