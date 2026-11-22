import {Ionicons} from "@expo/vector-icons";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {ActivityIndicator,Alert,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {BottomSheet} from "../components/social-ui";
import {JShopButton,JShopCategories,JShopEmpty,JShopIconButton,JShopItemCard,JShopTitle} from "../components/JShopUI";
import {readJShopDrafts} from "../lib/jshop-local";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../lib/message-session";
import {readJShopLocation,saveJShopLocation} from "../lib/jshop-location";
import type {JShopPlace} from "../lib/jshop-location-core";
import {loadJShopListings,loadJShopListingsNear,loadJShopFavoriteIds,setJShopFavorite} from "../lib/jshop-api";
import {DEFAULT_JSHOP_FILTERS,filterJShopListings,parseJShopPrice,type JShopDraft,type JShopListing,type JShopFilters,type JShopOrder} from "../lib/jshop-model";
import {useTabClearance} from "../theme/navigation";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

/** Live JShop catalogue and per-account drafts. */
export default function JShop(){
 const {theme}=useTheme();const t=jobeenTokens(theme);const {contentBottom}=useTabClearance();
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState<JShopFilters["category"]>("Todo");
 const [activeFilters,setActiveFilters]=useState<JShopFilters>(DEFAULT_JSHOP_FILTERS);
 const [pending,setPending]=useState<JShopFilters>(DEFAULT_JSHOP_FILTERS);
 const [filtersOpen,setFiltersOpen]=useState(false);
 const [drafts,setDrafts]=useState<JShopDraft[]>([]);
 const [remoteListings,setRemoteListings]=useState<JShopListing[]>([]);
 const [searchArea,setSearchArea]=useState<JShopPlace|null>(null);
 const [ownerId,setOwnerId]=useState("");
 const [favorites,setFavorites]=useState<string[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const scopeRef=useRef<MessageScope|null>(null),revision=useRef(0),favoriteBusy=useRef(false);
 useFocusEffect(useCallback(()=>{
  const generation=++revision.current;scopeRef.current=null;setLoading(true);setDrafts([]);setFavorites([]);setSearchArea(null);setOwnerId("");setRemoteListings([]);
  void(async()=>{try{
   const scope=await captureMessageScope(),userId=scope.owner;
   const [savedDrafts,savedFavorites,selectedPlace]=await Promise.all([readJShopDrafts(userId,scope),loadJShopFavoriteIds(userId,scope),readJShopLocation(userId,scope)]);
   await assertMessageScope(scope);if(revision.current!==generation)return;
   const listed=selectedPlace?await loadJShopListingsNear(selectedPlace,scope):await loadJShopListings(scope);
   await assertMessageScope(scope);if(revision.current!==generation)return;
   scopeRef.current=scope;setRemoteListings(listed);setOwnerId(userId);setSearchArea(selectedPlace);setDrafts(savedDrafts);setFavorites(savedFavorites);setError("");
   setActiveFilters(previous=>({...previous,location:""}));setPending(previous=>({...previous,location:""}));
  }catch(e){if(revision.current===generation){setError(e instanceof Error?e.message:"No se pudo cargar JShop.");setRemoteListings([]);}}
  finally{if(revision.current===generation)setLoading(false);}})();
  return()=>{revision.current++;scopeRef.current=null;setDrafts([]);setFavorites([]);setSearchArea(null);setOwnerId("");setRemoteListings([]);};
 },[]));
 const listings=filterJShopListings(remoteListings,{...activeFilters,category,query});
 async function clearSearchArea(){
  const scope=scopeRef.current;if(!scope||scope.owner!==ownerId)return;
  const generation=++revision.current,valid=()=>scopeRef.current===scope&&revision.current===generation;
  setLoading(true);setError("");
  try{
   await saveJShopLocation(ownerId,null,scope);
   await assertMessageScope(scope);if(!valid())return;
   const fullCatalogue=await loadJShopListings(scope);await assertMessageScope(scope);
   if(valid()){setRemoteListings(fullCatalogue);setSearchArea(null);}
  }catch(e){if(valid())setError(e instanceof Error?e.message:"No se pudo restaurar el catálogo completo.");}
  finally{if(valid())setLoading(false);}
 }
 async function toggleFavorite(id:string){
  const scope=scopeRef.current,generation=revision.current;if(!scope||scope.owner!==ownerId||favoriteBusy.current)return;
  const valid=()=>scopeRef.current===scope&&revision.current===generation,saved=favorites.includes(id);
  favoriteBusy.current=true;
  try{await captureMessageScope(scope);if(!valid())return;
   await setJShopFavorite(ownerId,id,!saved,scope);await assertMessageScope(scope);
   if(valid()){setFavorites(current=>saved?current.filter(x=>x!==id):[...current,id]);setError("");}
  }catch(e){if(valid())setError(e instanceof Error?e.message:"No se pudo actualizar el favorito.");}
  finally{favoriteBusy.current=false;}
 }
 const filterCount=Number(activeFilters.condition!=="Todas")+Number(!!searchArea)+Number(!!activeFilters.minPrice.trim())+Number(!!activeFilters.maxPrice.trim())+Number(activeFilters.order!=="recent");
 const openFilters=()=>{setPending({...activeFilters});setFiltersOpen(true);};
 const applyFilters=()=>{
  const min=parseJShopPrice(pending.minPrice),max=parseJShopPrice(pending.maxPrice);
  if((pending.minPrice.trim()&&min===null)||(pending.maxPrice.trim()&&max===null)){Alert.alert("Precio inválido","Introduce precios mayores que cero.");return;}
  if(min!==null&&max!==null&&min>max){Alert.alert("Rango inválido","El precio mínimo debe ser menor que el máximo.");return;}
  setActiveFilters(pending);setFiltersOpen(false);
 };
 return <SafeAreaView edges={["top","left","right"]} style={{flex:1,backgroundColor:t.bg}}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:16,paddingTop:18,paddingBottom:contentBottom+20,gap:18,maxWidth:980,width:"100%",alignSelf:"center"}} showsVerticalScrollIndicator={false}>
   <JShopTitle title="JShop" right={<View style={{flexDirection:"row",gap:7}}>
    <JShopIconButton icon="heart-outline" label="Mis guardados" onPress={()=>router.push("/jshop/favorites")}/>
    <JShopIconButton icon="location-outline" label="Elegir ubicación de búsqueda" selected={!!searchArea} onPress={()=>router.push("/jshop/location")}/>
   </View>}/>
   <View style={{flexDirection:"row",gap:9,alignItems:"center"}}>
    <View style={{flex:1,minHeight:48,borderRadius:18,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:9}}>
     <Ionicons name="search-outline" color={t.ink2} size={20}/>
     <TextInput accessibilityLabel="Buscar artículos o vendedores" autoCapitalize="none" returnKeyType="search" placeholder="Buscar artículos o vendedores" placeholderTextColor={t.ink2} value={query} onChangeText={setQuery} style={{flex:1,color:t.ink,fontSize:14,minHeight:46}}/>
     {!!query&&<Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={()=>setQuery("")} style={{padding:5}}><Ionicons name="close-circle" size={19} color={t.ink2}/></Pressable>}
    </View>
    <JShopIconButton icon="options-outline" label={"Filtros"+(filterCount?" ("+filterCount+")":"")} selected={filterCount>0} onPress={openFilters}/>
   </View>
   <JShopCategories value={category} onChange={setCategory}/>
   <View style={{flexDirection:"row",gap:10}}>
    <View style={{flex:1}}><JShopButton title="Vender" icon="add-circle-outline" onPress={()=>router.push("/jshop/publish")}/></View>
    <View style={{flex:1}}><JShopButton title="Mis anuncios" icon="albums-outline" secondary onPress={()=>router.push("/jshop/mine")}/></View>
   </View>
   <View style={{gap:8}}>
    <JShopTitle title="Explorar artículos" subtitle={searchArea?searchArea.city:filterCount?"Filtros activos: "+filterCount:"Explora por categoría, precio y ubicación"}/>
    {listings.length>0?<View style={{gap:10}}>
     {listings.map(item=><JShopItemCard key={item.id} item={item} onOpen={()=>router.push({pathname:"/jshop/item/[id]",params:{id:item.id}})} onFavorite={item.sellerId===ownerId?undefined:()=>void toggleFavorite(item.id)} saved={favorites.includes(item.id)}/>)}
    </View>:<JShopEmpty icon={query||category!=="Todo"||filterCount?"search-outline":"bag-handle-outline"}
      title={searchArea?"No hay artículos en esta zona":query||category!=="Todo"||filterCount?"No hay artículos con estos filtros":"Todavía no hay artículos publicados"}
      description={searchArea?"No encontramos anuncios cerca de "+searchArea.city+". Prueba moviendo el mapa o cambiando la zona.":query||category!=="Todo"||filterCount?"Prueba otra búsqueda o quita los filtros para explorar los anuncios publicados.":"Sé el primero en publicar un artículo. Los anuncios se mostrarán aquí cuando los vendedores los publiquen."}
      action={query||category!=="Todo"||filterCount?{title:"Limpiar filtros",onPress:()=>{setQuery("");setCategory("Todo");setActiveFilters(DEFAULT_JSHOP_FILTERS);setPending(DEFAULT_JSHOP_FILTERS);void clearSearchArea();}} :{title:"Crear anuncio",onPress:()=>router.push("/jshop/publish")}}/>}
   </View>
   {!!drafts.length&&<View style={{gap:12}}>
    <JShopTitle title="Continuar mis borradores" subtitle={drafts.length+" sin publicar"} right={<Pressable accessibilityRole="button" onPress={()=>router.push("/jshop/mine")}><Text style={{color:t.ink,fontWeight:"700"}}>Ver todos</Text></Pressable>}/>
    <View style={{gap:10}}>
     {drafts.slice(0,4).map(item=><JShopItemCard key={item.id} item={item} onOpen={()=>router.push({pathname:"/jshop/item/[id]",params:{id:item.id}})}/>)}
    </View>
   </View>}
   {!!favorites.length&&<Pressable accessibilityRole="button" onPress={()=>router.push("/jshop/favorites")} style={{borderWidth:1,borderColor:t.line,borderRadius:18,padding:13,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:t.surface}}>
    <Ionicons name="heart-outline" size={21} color={t.ink}/><Text style={{flex:1,fontSize:13,color:t.ink}}>Artículos guardados: {favorites.length}</Text><Ionicons name="chevron-forward" color={t.ink2} size={18}/>
   </Pressable>}
   {loading&&<ActivityIndicator color={t.yellow}/>}
   {!!error&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:t.ink2}}>{error}</Text>}
  </ScrollView>
  <BottomSheet visible={filtersOpen} onClose={()=>setFiltersOpen(false)} title="Filtrar artículos">
   <View style={{gap:18,paddingTop:8}}>
    <Text style={{color:t.ink,fontWeight:"700"}}>Condición</Text>
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
     {(["Todas","Nuevo","Usado"] as const).map(option=><Pressable key={option} accessibilityRole="button" accessibilityState={{selected:pending.condition===option}} onPress={()=>setPending(x=>({...x,condition:option}))}
      style={{minHeight:44,paddingHorizontal:15,justifyContent:"center",borderRadius:18,backgroundColor:pending.condition===option?t.ink:t.cream}}>
      <Text style={{color:pending.condition===option?t.bg:t.ink,fontWeight:"700"}}>{option}</Text>
     </Pressable>)}
    </View>
    <View style={{gap:8}}>
     <Text style={{color:t.ink,fontWeight:"700"}}>Ubicación de búsqueda</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Elegir ubicación en el mapa" onPress={()=>{setFiltersOpen(false);router.push("/jshop/location");}}
      style={{minHeight:49,borderWidth:1,borderColor:t.line,borderRadius:16,backgroundColor:t.surface,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:10}}>
      <Ionicons name="location-outline" color={t.ink} size={21}/>
      <Text numberOfLines={1} style={{color:t.ink,flex:1}}>{searchArea?searchArea.city:"Todas las ubicaciones"}</Text>
      <Ionicons name="chevron-forward" color={t.ink2} size={18}/>
     </Pressable>
     {searchArea&&<Pressable accessibilityRole="button" onPress={()=>void clearSearchArea()}
       style={{minHeight:42,justifyContent:"center"}}>
      <Text style={{color:t.ink2,fontSize:13}}>Quitar zona de búsqueda</Text>
     </Pressable>}
    </View>
    <Text style={{color:t.ink,fontWeight:"700"}}>Precio</Text>
    <View style={{flexDirection:"row",gap:10}}>
     {([{field:"minPrice",label:"Mínimo"},{field:"maxPrice",label:"Máximo"}] as const).map(input=><TextInput key={input.field} accessibilityLabel={"Precio "+input.label.toLowerCase()} keyboardType="decimal-pad" placeholder={input.label} placeholderTextColor={t.ink2} value={pending[input.field]} onChangeText={v=>setPending(x=>({...x,[input.field]:v}))}
      style={{flex:1,minHeight:48,borderWidth:1,borderColor:t.line,borderRadius:16,paddingHorizontal:12,color:t.ink,backgroundColor:t.surface}}/>)}
    </View>
    <Text style={{color:t.ink,fontWeight:"700"}}>Ordenar por</Text>
    {([{id:"recent",label:"Más recientes"},{id:"price_low",label:"Menor precio"},{id:"price_high",label:"Mayor precio"}] as const).map(order=><Pressable key={order.id} accessibilityRole="radio" accessibilityState={{checked:pending.order===order.id}} onPress={()=>setPending(x=>({...x,order:order.id as JShopOrder}))} style={{minHeight:44,flexDirection:"row",alignItems:"center",gap:10}}>
     <Ionicons name={pending.order===order.id?"radio-button-on":"radio-button-off"} size={22} color={t.ink}/><Text style={{color:t.ink}}>{order.label}</Text>
    </Pressable>)}
    <View style={{flexDirection:"row",gap:10,paddingTop:5}}>
     <View style={{flex:1}}><JShopButton title="Limpiar" secondary onPress={()=>setPending(DEFAULT_JSHOP_FILTERS)}/></View>
     <View style={{flex:1}}><JShopButton title="Aplicar" onPress={applyFilters}/></View>
    </View>
   </View>
  </BottomSheet>
 </SafeAreaView>;
}
