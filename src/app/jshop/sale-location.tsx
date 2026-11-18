import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams} from "expo-router";
import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {JShopLocationMap} from "../../components/JShopLocationMap";
import {jshopAccountId} from "../../lib/jshop-local";
import {confirmJShopPlace,findJShopPlaces,placeAtMapCenter} from "../../lib/jshop-geocode";
import {mapboxConfigured} from "../../lib/mapbox-config";
import {readDefaultSaleLocation,readPendingArticleLocation,writeDefaultSaleLocation,writePendingArticleLocation,type SaleLocation} from "../../lib/jshop-selling-location";
import type {JShopPlace,MapPoint} from "../../lib/jshop-location-core";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function SaleLocationPicker(){
 const {target,session}=useLocalSearchParams<{target?:string;session?:string}>();
 const article=target==="article"&&typeof session==="string"&&session.length>0&&session.length<120;
 const {theme,colors}=useTheme(),t=jobeenTokens(theme),insets=useSafeAreaInsets();
 const [owner,setOwner]=useState("");
 const [chosen,setChosen]=useState<SaleLocation|null>(null);
 const [center,setCenter]=useState<MapPoint>({lat:0,lon:0});
 const [zoom,setZoom]=useState(2);
 const [moved,setMoved]=useState(false);
 const [query,setQuery]=useState("");
 const [results,setResults]=useState<JShopPlace[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [searching,setSearching]=useState(false);
 const [typing,setTyping]=useState(false);
 const [error,setError]=useState("");
 const sequence=useRef(0);

 useEffect(()=>{let active=true;void(async()=>{
  try{
   const id=await jshopAccountId();
   const fallback=await readDefaultSaleLocation(id);
   const prior=article?await readPendingArticleLocation(id,session!):null;
   if(!active)return;
   setOwner(id);
   const place=prior??fallback;
   if(place){
    setChosen(place);setCenter({lat:place.lat,lon:place.lon});setZoom(place.zoom||11);
    setQuery(place.label);
   }
  }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo cargar la ubicación de venta.");}
  finally{if(active)setLoading(false);}
 })();return()=>{active=false;};},[article,session]);

 useEffect(()=>{
  if(!mapboxConfigured||!typing||query.trim().length<3){setResults([]);setSearching(false);return;}
  const n=++sequence.current;let alive=true;
  const timer=setTimeout(()=>{setSearching(true);void findJShopPlaces(query).then(data=>{
   if(alive&&n===sequence.current)setResults(data.slice(0,5));
  }).catch(e=>{if(alive&&n===sequence.current)setError(e instanceof Error?e.message:"No se pudo buscar.");}).finally(()=>{if(alive&&n===sequence.current)setSearching(false);});},700);
  return()=>{alive=false;clearTimeout(timer);};
 },[query,typing]);

 async function searchOnSubmit(){
  if(searching||!query.trim())return;
  setSearching(true);setError("");
  try{
   const found=await findJShopPlaces(query);
   if(found.length===1)choose(found[0]);
   else if(found.length===0)setError("No se encontró la ubicación. Probá ciudad y país.");
   else setResults(found);
  }catch(e){setError(e instanceof Error?e.message:"No se pudo buscar esa ciudad.");}
  finally{setSearching(false);}
 }
 function choose(place:SaleLocation){
  setChosen(place);setMoved(false);setTyping(false);setSearching(false);setCenter({lat:place.lat,lon:place.lon});
  setZoom(Math.max(7,Math.min(15,place.zoom||11)));
  setQuery(place.label);setResults([]);setError("");
 }
 function move(point:MapPoint){
  if(Math.abs(point.lat-center.lat)<0.00001&&Math.abs(point.lon-center.lon)<0.00001)return;
  setCenter(point);setChosen(null);setMoved(true);setTyping(false);setSearching(false);
  setQuery("");setResults([]);setError("");
 }
 async function save(){
  if(!owner||busy||(!chosen&&!moved))return;
  setBusy(true);setError("");
  try{
   const point=chosen??(mapboxConfigured?{city:"",label:"",lat:center.lat,lon:center.lon,zoom}:await placeAtMapCenter(center.lat,center.lon));
   const verified=await confirmJShopPlace({...point,lat:center.lat,lon:center.lon,zoom});
   const selected:SaleLocation={city:verified.city,label:verified.label,lat:center.lat,lon:center.lon,zoom};
   if(article)await writePendingArticleLocation(owner,session!,selected);
   else await writeDefaultSaleLocation(owner,selected);
   router.back();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar la ubicación de venta.");}
  finally{setBusy(false);}
 }
 const ready=!!chosen||moved;
 return <>
  <Stack.Screen options={{headerShown:false,presentation:"transparentModal",animation:"slide_from_bottom"}}/>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined}
   style={{flex:1,backgroundColor:colors.scrim,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sin guardar" onPress={()=>router.back()} style={{flex:1}}/>
   <View accessibilityViewIsModal style={{height:"92%",minHeight:0,backgroundColor:t.bg,
    borderTopLeftRadius:27,borderTopRightRadius:27,overflow:"hidden",paddingBottom:Math.max(12,insets.bottom)}}>
    <View style={{width:40,height:5,borderRadius:3,alignSelf:"center",backgroundColor:t.line,marginTop:10,marginBottom:6}}/>
    <View style={{paddingHorizontal:16,paddingBottom:8,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
     <Text accessibilityRole="header" numberOfLines={1} style={{flex:1,fontSize:20,fontWeight:"800",color:t.ink}}>
      {article?"Ubicación del artículo":"Ubicación de venta"}
     </Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>router.back()}
      style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="close" size={24} color={t.ink}/>
     </Pressable>
    </View>
    <View style={{paddingHorizontal:14,paddingBottom:10}}>
     <View style={{minHeight:48,borderRadius:17,backgroundColor:t.surface,borderWidth:1,
      borderColor:t.line,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:13}}>
      <Ionicons name="search-outline" size={20} color={t.ink2}/>
      <TextInput accessibilityLabel="Buscar ciudad de venta" value={query}
       placeholder="Buscar ciudad o zona" placeholderTextColor={t.ink2} autoCorrect={false}
       onChangeText={v=>{sequence.current++;setSearching(false);setTyping(true);setQuery(v);setChosen(null);setMoved(false);setResults([]);setError("");}}
       returnKeyType="search" onSubmitEditing={()=>{if(!mapboxConfigured)void searchOnSubmit();}}
       style={{flex:1,minWidth:0,color:t.ink,fontSize:14,minHeight:46}}/>
      {searching?<ActivityIndicator size="small" color={t.ink2}/>:!mapboxConfigured&&<Pressable accessibilityRole="button" accessibilityLabel="Buscar ciudad" onPress={()=>void searchOnSubmit()} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}><Ionicons name="arrow-forward" size={20} color={t.ink}/></Pressable>}
     </View>
    </View>
    <View style={{flex:1,minHeight:0,paddingHorizontal:14}}>
     <JShopLocationMap center={center} zoom={zoom} radiusMiles={5} showRadius={false}
      fluid minimal onCenter={move} onZoom={setZoom}/>
     {typing&&results.length>0&&<View style={{position:"absolute",top:0,left:14,right:14,zIndex:10,
      maxHeight:230,backgroundColor:t.surface,borderRadius:16,borderWidth:1,borderColor:t.line,overflow:"hidden"}}>
      <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
       {results.map((place,i)=><Pressable key={place.label+"-"+i} accessibilityRole="button"
        accessibilityLabel={"Elegir "+place.label} onPress={()=>choose(place)}
        style={{minHeight:48,flexDirection:"row",alignItems:"center",gap:10,padding:10}}>
        <Ionicons name="location-outline" size={20} color={t.ink2}/>
        <Text numberOfLines={2} style={{flex:1,fontSize:13,color:t.ink}}>{place.label}</Text>
       </Pressable>)}
      </ScrollView>
     </View>}
    </View>
    <View style={{paddingHorizontal:16,paddingTop:10,gap:6}}>
     <Text numberOfLines={1} style={{color:t.ink,fontWeight:"800",fontSize:14}}>
      {chosen?.label??(moved?"Zona marcada en el mapa":"Elegí una ciudad o mové el mapa")}
     </Text>
     <Text style={{fontSize:11,lineHeight:16,color:t.ink2}} numberOfLines={2}>
      Elegí una zona aproximada: los compradores podrán ver la ubicación del anuncio.
     </Text>
     {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontSize:12,lineHeight:17}}>{error}</Text>}
    </View>
    <View style={{paddingHorizontal:16,paddingTop:11,marginTop:9,borderTopWidth:1,borderColor:t.line}}>
     <Pressable accessibilityRole="button" accessibilityLabel={article?"Usar ubicación para este artículo":"Guardar ubicación de venta"}
      disabled={!ready||!owner||busy||loading||searching||typing} onPress={()=>void save()}
      style={({pressed})=>({height:52,borderRadius:17,backgroundColor:t.ink,
       alignItems:"center",justifyContent:"center",opacity:!ready||!owner||busy||loading||searching||typing?0.45:pressed?0.75:1})}>
      <Text style={{color:t.bg,fontSize:15,fontWeight:"800"}}>{busy?"Guardando...":article?"Usar esta ubicación":"Guardar ubicación"}</Text>
     </Pressable>
    </View>
   </View>
  </KeyboardAvoidingView>
 </>;
}
