import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useMemo,useState} from "react";
import {ActivityIndicator,Alert,Pressable,Text,TextInput,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {listSavedJCards,removeSavedJCard,setSavedJCardFavorite,type SavedJCard} from "../lib/saved-jcards";

/** Saved JCards point to visible public profiles, never to stale contact snapshots. */
export function SavedJCardsGallery(){
 const {theme}=useTheme();const colors=jobeenTokens(theme);
 const [items,setItems]=useState<SavedJCard[]>([]);
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<"all"|"favorites">("all");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState("");
 const refresh=useCallback(async()=>{
  const next=await listSavedJCards();setItems(next);setError("");
 },[]);
 useFocusEffect(useCallback(()=>{
  let active=true;
  setLoading(true);
  void listSavedJCards().then(result=>{if(active){setItems(result);setError("");}})
   .catch(e=>{if(active)setError(e instanceof Error?e.message:"No pudimos cargar tus JCards.");})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]));
 const visible=useMemo(()=>items.filter(item=>{
  if(filter==="favorites"&&!item.favorite)return false;
  const key=(item.title+" "+item.subtitle).toLocaleLowerCase("es");
  return key.includes(query.trim().toLocaleLowerCase("es"));
 }),[items,filter,query]);
 const changeFavorite=async(item:SavedJCard)=>{
  if(busy)return;setBusy(item.targetId+item.side);
  try{await setSavedJCardFavorite(item.targetId,item.side,!item.favorite);await refresh();}
  catch(e){Alert.alert("Mis JCards",e instanceof Error?e.message:"No se pudo actualizar la tarjeta.");}
  finally{setBusy("");}
 };
 const remove=async(item:SavedJCard)=>{
  if(busy)return;setBusy(item.targetId+item.side);
  try{await removeSavedJCard(item.targetId,item.side);await refresh();}
  catch(e){Alert.alert("Mis JCards",e instanceof Error?e.message:"No se pudo quitar la tarjeta.");}
  finally{setBusy("");}
 };
 return <View style={{gap:14}}>
  <View style={{gap:5}}>
   <Text accessibilityRole="header" style={{color:colors.ink,fontSize:20,fontWeight:"800"}}>Mis JCards</Text>
   <Text style={{color:colors.ink2,fontSize:13,lineHeight:19}}>Guarda JCards públicas para acceder a los datos que sus propietarios mantienen visibles.</Text>
  </View>
  <TextInput accessibilityLabel="Buscar en mis JCards" placeholder="Buscar negocio o profesional…" placeholderTextColor={colors.ink2}
   value={query} onChangeText={setQuery} style={{minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:13,paddingHorizontal:14,color:colors.ink,backgroundColor:colors.surface,fontSize:14}}/>
  <View style={{flexDirection:"row",gap:8}}>
   {([{key:"all",label:"Todas"},{key:"favorites",label:"Favoritas"}] as const).map(option=>
    <Pressable key={option.key} accessibilityRole="button" accessibilityState={{selected:filter===option.key}} onPress={()=>setFilter(option.key)}
     style={{minHeight:44,justifyContent:"center",paddingHorizontal:16,borderRadius:12,borderWidth:1,borderColor:filter===option.key?colors.yellow:colors.line,backgroundColor:filter===option.key?colors.cream:colors.surface}}>
     <Text style={{color:colors.ink,fontSize:13,fontWeight:filter===option.key?"700":"500"}}>{option.label}</Text>
    </Pressable>)}
  </View>
  {loading&&<ActivityIndicator color={colors.ink}/>}
  {!!error&&<View style={{gap:8}}><Text accessibilityLiveRegion="polite" style={{color:colors.ink}}>{error}</Text>
   <Pressable accessibilityRole="button" onPress={()=>{setLoading(true);void refresh().catch(e=>setError(String(e))).finally(()=>setLoading(false));}} style={{minHeight:48,justifyContent:"center"}}><Text style={{color:colors.ink,fontWeight:"700"}}>Volver a intentar</Text></Pressable>
  </View>}
  {!loading&&!error&&visible.length===0&&<View style={{borderRadius:20,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,paddingHorizontal:20,paddingVertical:28,alignItems:"center",gap:10}}>
   <View style={{width:66,height:66,borderRadius:20,backgroundColor:colors.cream,alignItems:"center",justifyContent:"center"}}><Ionicons name="albums-outline" size={32} color={colors.ink}/></View>
   <Text style={{fontSize:16,fontWeight:"700",textAlign:"center",color:colors.ink}}>{items.length===0?"Todavía no guardaste ninguna JCard":"No hay JCards con estos filtros"}</Text>
   <Text style={{fontSize:13,lineHeight:20,textAlign:"center",color:colors.ink2}}>
    {items.length===0?"En un perfil público, abre sus opciones y selecciona Guardar JCard. No necesitas permiso del propietario.":"Prueba cambiar la búsqueda o el filtro de favoritas."}
   </Text>
  </View>}
  {!loading&&!error&&visible.length>0&&<View style={{flexDirection:"row",flexWrap:"wrap",marginHorizontal:-5}}>
   {visible.map(item=><View key={item.targetId+item.side} style={{width:"50%",paddingHorizontal:5,paddingBottom:12}}>
    <View style={{flex:1,borderRadius:16,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,overflow:"hidden"}}>
     <Pressable accessibilityRole="button" disabled={!item.available} accessibilityLabel={"Abrir "+item.title} onPress={()=>router.push({pathname:"/jcard",params:{user:item.targetId,card:item.side}})}
      style={{minHeight:114,padding:12,gap:6,justifyContent:"center",opacity:item.available?1:0.7}}>
      <Ionicons name={item.available?item.side==="business"?"business-outline":"person-circle-outline":"eye-off-outline"} size={24} color={colors.ink}/>
      <Text numberOfLines={2} style={{fontSize:14,fontWeight:"700",color:colors.ink}}>{item.title}</Text>
      <Text numberOfLines={2} style={{fontSize:11,color:colors.ink2}}>{item.subtitle}</Text>
     </Pressable>
     <View style={{borderTopWidth:1,borderTopColor:colors.line,flexDirection:"row",justifyContent:"space-around",alignItems:"center",minHeight:48}}>
      <Pressable accessibilityRole="button" accessibilityLabel={item.favorite?"Quitar de favoritas":"Marcar como favorita"} disabled={!!busy} onPress={()=>void changeFavorite(item)} style={{width:48,height:48,justifyContent:"center",alignItems:"center"}}>
       <Ionicons name={item.favorite?"star":"star-outline"} size={21} color={colors.ink}/>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={"Quitar de mis JCards: "+item.title} disabled={!!busy} onPress={()=>Alert.alert("Quitar JCard","¿Quitar esta tarjeta de tu colección?",[{text:"Cancelar",style:"cancel"},{text:"Quitar",style:"destructive",onPress:()=>void remove(item)}])}
       style={{width:48,height:48,justifyContent:"center",alignItems:"center"}}>
       <Ionicons name="trash-outline" size={20} color={colors.ink}/>
      </Pressable>
     </View>
    </View>
   </View>)}
  </View>}
 </View>;
}
