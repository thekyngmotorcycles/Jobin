import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useMemo,useRef,useState} from "react";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {ActivityIndicator,Alert,Pressable,Text,TextInput,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {businessCategoryArt} from "../lib/business-category-art";
import {listSavedJCards,removeSavedJCard,setSavedJCardFavorite,type SavedJCard} from "../lib/saved-jcards";

/** Saved JCards point to visible public profiles, never to stale contact snapshots. */
export function SavedJCardsGallery({owner}:{owner:string}){
 const {theme}=useTheme();const colors=jobeenTokens(theme);
 const [items,setItems]=useState<SavedJCard[]>([]);
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<"all"|"favorites">("all");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState("");
 const scopeRef=useRef<MessageScope|null>(null),revision=useRef(0),activeRef=useRef(false),busyRef=useRef(false);
 const [ready,setReady]=useState(false);
 const refresh=useCallback(async(expected?:MessageScope)=>{
  const generation=++revision.current;
  const valid=()=>activeRef.current&&revision.current===generation;
  setItems([]);setReady(false);setLoading(true);setError("");
  try{
   const scope=await captureMessageScope(expected??scopeRef.current??undefined);
   if(scope.owner!==owner||!valid())return;
   scopeRef.current=scope;
   const next=await listSavedJCards(owner,scope);
   await assertMessageScope(scope);
   if(valid()){setItems(next);setReady(true);}
  }catch(e){if(valid()){setItems([]);setError(e instanceof Error?e.message:"No pudimos cargar tus JCards.");}}
  finally{if(valid())setLoading(false);}
 },[owner]);
 useFocusEffect(useCallback(()=>{
  activeRef.current=true;scopeRef.current=null;setQuery("");setFilter("all");void refresh();
  return()=>{activeRef.current=false;revision.current++;scopeRef.current=null;setReady(false);setItems([]);};
 },[refresh]));
 const visible=useMemo(()=>ready?items.filter(item=>{
  if(filter==="favorites"&&!item.favorite)return false;
  const key=(item.title+" "+item.subtitle).toLocaleLowerCase("es");
  return key.includes(query.trim().toLocaleLowerCase("es"));
 }):[],[items,filter,query,ready]);
 const validAction=(item:SavedJCard,scope:MessageScope)=>activeRef.current&&scopeRef.current===scope&&scope.owner===owner&&ready&&items.some(row=>row.targetId===item.targetId&&row.side===item.side);
 const mutate=async(item:SavedJCard,scope:MessageScope,operation:"favorite"|"remove")=>{
  if(busyRef.current||!validAction(item,scope))return;
  busyRef.current=true;setBusy(item.targetId+item.side);
  try{
   await captureMessageScope(scope);
   if(!validAction(item,scope))return;
   if(operation==="favorite")await setSavedJCardFavorite(item.targetId,item.side,!item.favorite,owner,scope);
   else await removeSavedJCard(item.targetId,item.side,owner,scope);
   if(activeRef.current&&scopeRef.current===scope)await refresh(scope);
  }catch(e){if(activeRef.current&&scopeRef.current===scope){setItems([]);setReady(false);setError(e instanceof Error?e.message:"No se pudo actualizar la tarjeta.");}}
  finally{busyRef.current=false;if(activeRef.current)setBusy("");}
 };
 const changeFavorite=(item:SavedJCard)=>{const scope=scopeRef.current;if(scope)void mutate(item,scope,"favorite");};
 const confirmRemove=(item:SavedJCard)=>{
  const scope=scopeRef.current;if(!scope||!validAction(item,scope))return;
  const generation=revision.current;
  Alert.alert("Quitar JCard","¿Quitar esta tarjeta de tu colección?",[{text:"Cancelar",style:"cancel"},{text:"Quitar",style:"destructive",onPress:()=>{if(revision.current===generation)void mutate(item,scope,"remove");}}]);
 };
 const openCard=async(item:SavedJCard)=>{
  const scope=scopeRef.current,generation=revision.current;
  if(!scope||!item.available||!validAction(item,scope))return;
  try{await captureMessageScope(scope);if(revision.current===generation&&validAction(item,scope))router.push({pathname:"/jcard",params:{user:item.targetId,card:item.side}});}
  catch{if(activeRef.current&&scopeRef.current===scope){setItems([]);setReady(false);setError("La sesión cambió. Vuelve a cargar tus JCards.");}}
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
   <Pressable accessibilityRole="button" onPress={()=>void refresh()} style={{minHeight:48,justifyContent:"center"}}><Text style={{color:colors.ink,fontWeight:"700"}}>Volver a intentar</Text></Pressable>
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
     <Pressable accessibilityRole="button" disabled={!item.available} accessibilityLabel={"Abrir "+item.title} onPress={()=>void openCard(item)}
      style={{minHeight:114,padding:12,gap:6,justifyContent:"center",opacity:item.available?1:0.7}}>
      <Ionicons name={!item.available?"eye-off-outline":item.side==="business"?businessCategoryArt(item.subtitle).icon:"person-circle-outline"} size={24} color={colors.ink}/>
      <Text numberOfLines={2} style={{fontSize:14,fontWeight:"700",color:colors.ink}}>{item.title}</Text>
      <Text numberOfLines={2} style={{fontSize:11,color:colors.ink2}}>{item.subtitle}</Text>
     </Pressable>
     <View style={{borderTopWidth:1,borderTopColor:colors.line,flexDirection:"row",justifyContent:"space-around",alignItems:"center",minHeight:48}}>
      <Pressable accessibilityRole="button" accessibilityLabel={item.favorite?"Quitar de favoritas":"Marcar como favorita"} disabled={!!busy} onPress={()=>void changeFavorite(item)} style={{width:48,height:48,justifyContent:"center",alignItems:"center"}}>
       <Ionicons name={item.favorite?"star":"star-outline"} size={21} color={colors.ink}/>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={"Quitar de mis JCards: "+item.title} disabled={!!busy} onPress={()=>confirmRemove(item)}
       style={{width:48,height:48,justifyContent:"center",alignItems:"center"}}>
       <Ionicons name="trash-outline" size={20} color={colors.ink}/>
      </Pressable>
     </View>
    </View>
   </View>)}
  </View>}
 </View>;
}
