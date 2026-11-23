import {JOBEEN_TYPE} from "../../theme/typography";
import {JOBEEN_CONTROL} from "../../theme/control-metrics";
import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useLocalSearchParams} from "expo-router";
import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {JShopLocationMap} from "../../components/JShopLocationMap";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../../lib/message-session";
import {confirmJShopPlace,findJShopPlaces,placeAtMapCenter} from "../../lib/jshop-geocode";
import {mapboxConfigured} from "../../lib/mapbox-config";
import {readDefaultSaleLocation,readPendingArticleLocation,writeDefaultSaleLocation,writePendingArticleLocation,type SaleLocation} from "../../lib/jshop-selling-location";
import type {JShopPlace,MapPoint} from "../../lib/jshop-location-core";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";
import {jobeenModalTokens} from "../../theme/modals";

export default function SaleLocationPicker(){
 const {target,session}=useLocalSearchParams<{target?:string;session?:string}>();
 const article=target==="article"&&typeof session==="string"&&session.length>0&&session.length<120;
 const {theme}=useTheme(),t=jobeenTokens(theme),modal=jobeenModalTokens(theme),insets=useSafeAreaInsets();
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
 const sequence=useRef(0),revision=useRef(0),scopeRef=useRef<MessageScope|null>(null),saving=useRef(false);

 useEffect(()=>{let active=true;void(async()=>{
  const generation=++revision.current;scopeRef.current=null;setLoading(true);setOwner("");setChosen(null);setCenter({lat:0,lon:0});setZoom(2);setMoved(false);setQuery("");setResults([]);setTyping(false);setSearching(false);
  try{
   const scope=await captureMessageScope(),id=scope.owner;
   const fallback=await readDefaultSaleLocation(id,scope);
   const prior=article?await readPendingArticleLocation(id,session!,scope):null;
   await assertMessageScope(scope);if(!active||revision.current!==generation)return;
   scopeRef.current=scope;setOwner(id);
   const place=prior??fallback;
   if(place){
    setChosen(place);setCenter({lat:place.lat,lon:place.lon});setZoom(place.zoom||11);
    setQuery(place.label);
   }
  }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo cargar la ubicación de venta.");}
  finally{if(active)setLoading(false);}
 })();return()=>{active=false;revision.current++;sequence.current++;scopeRef.current=null;setChosen(null);setResults([]);setQuery("");};},[article,session]);

 useEffect(()=>{
  const scope=scopeRef.current;
  if(!scope||!mapboxConfigured||!typing||query.trim().length<3){setResults([]);setSearching(false);return;}
  const n=++sequence.current;let alive=true;
  const timer=setTimeout(()=>{setSearching(true);void (async()=>{await captureMessageScope(scope);if(!alive||scopeRef.current!==scope||n!==sequence.current)return [];const data=await findJShopPlaces(query);await assertMessageScope(scope);return data;})().then(data=>{
   if(alive&&scopeRef.current===scope&&n===sequence.current)setResults(data.slice(0,5));
  }).catch(e=>{if(alive&&scopeRef.current===scope&&n===sequence.current)setError(e instanceof Error?e.message:"No se pudo buscar.");}).finally(()=>{if(alive&&scopeRef.current===scope&&n===sequence.current)setSearching(false);});},700);
  return()=>{alive=false;clearTimeout(timer);};
 },[query,typing]);

 async function searchOnSubmit(){
  const scope=scopeRef.current;if(!scope||searching||saving.current||!query.trim())return;
  const n=++sequence.current,valid=()=>scopeRef.current===scope&&sequence.current===n;
  setSearching(true);setError("");
  try{
   await captureMessageScope(scope);if(!valid())return;const found=await findJShopPlaces(query);await assertMessageScope(scope);if(!valid())return;
   if(found.length===1)choose(found[0]);
   else if(found.length===0)setError("No se encontró la ubicación. Prueba ciudad y país.");
   else setResults(found);
  }catch(e){if(valid())setError(e instanceof Error?e.message:"No se pudo buscar esa ciudad.");}
  finally{if(valid())setSearching(false);}
 }
 function choose(place:SaleLocation){
  if(!scopeRef.current||saving.current)return;sequence.current++;
  setChosen(place);setMoved(false);setTyping(false);setSearching(false);setCenter({lat:place.lat,lon:place.lon});
  setZoom(Math.max(7,Math.min(15,place.zoom||11)));
  setQuery(place.label);setResults([]);setError("");
 }
 function move(point:MapPoint){
  if(!scopeRef.current||saving.current)return;
  if(Math.abs(point.lat-center.lat)<0.00001&&Math.abs(point.lon-center.lon)<0.00001)return;
  sequence.current++;setCenter(point);setChosen(null);setMoved(true);setTyping(false);setSearching(false);
  setQuery("");setResults([]);setError("");
 }
 async function save(){
  const scope=scopeRef.current,generation=revision.current;
  if(!scope||scope.owner!==owner||saving.current||typing||(!chosen&&!moved))return;
  const valid=()=>scopeRef.current===scope&&revision.current===generation;
  saving.current=true;setBusy(true);setError("");sequence.current++;setResults([]);
  try{
   await captureMessageScope(scope);if(!valid())return;
   const lat=Number(center.lat.toFixed(2)),lon=Number(center.lon.toFixed(2));
   const point=chosen??(mapboxConfigured?{city:"",label:"",lat,lon,zoom}:await placeAtMapCenter(lat,lon));
   await assertMessageScope(scope);if(!valid())return;
   const verified=await confirmJShopPlace({...point,lat,lon,zoom});
   await assertMessageScope(scope);if(!valid())return;
   const selected:SaleLocation={city:verified.city,label:verified.city,lat,lon,zoom};
   if(article)await writePendingArticleLocation(owner,session!,selected,scope);
   else await writeDefaultSaleLocation(owner,selected,scope);
   await assertMessageScope(scope);if(valid())router.back();
  }catch(e){if(valid())setError(e instanceof Error?e.message:"No se pudo guardar la ubicación de venta.");}
  finally{saving.current=false;setBusy(false);}
 }
 const ready=!!chosen||moved;
 return <>
  <Stack.Screen options={{headerShown:false,presentation:"transparentModal",animation:"slide_from_bottom"}}/>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined}
   style={{flex:1,backgroundColor:modal.scrim,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sin guardar" onPress={()=>router.back()} style={{flex:1}}/>
   <View accessibilityViewIsModal style={{height:"92%",minHeight:0,backgroundColor:modal.surface,
    borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet,overflow:"hidden",paddingBottom:Math.max(12,insets.bottom)}}>
    <View style={{width:40,height:5,borderRadius:3,alignSelf:"center",backgroundColor:t.line,marginTop:10,marginBottom:6}}/>
    <View style={{paddingHorizontal:16,paddingBottom:8,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
     <Text accessibilityRole="header" numberOfLines={1} style={{flex:1,fontSize:JOBEEN_TYPE.modalTitle,fontWeight:"800",color:modal.text}}>
      {article?"Ubicación del artículo":"Ubicación de venta"}
     </Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>router.back()}
      style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="close" size={24} color={t.ink}/>
     </Pressable>
    </View>
    <View style={{paddingHorizontal:14,paddingBottom:10}}>
     <View style={{minHeight:JOBEEN_CONTROL.inputHeight,borderRadius:JOBEEN_CONTROL.inputRadius,backgroundColor:t.surface,borderWidth:1,
      borderColor:t.outline,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:13}}>
      <Ionicons name="search-outline" size={20} color={t.ink2}/>
      <TextInput accessibilityLabel="Buscar ciudad de venta" value={query}
       placeholder="Buscar ciudad o zona" placeholderTextColor={t.ink2} autoCorrect={false}
       editable={!busy&&!loading} onChangeText={v=>{sequence.current++;setSearching(false);setTyping(true);setQuery(v);setChosen(null);setMoved(false);setResults([]);setError("");}}
       returnKeyType="search" onSubmitEditing={()=>{if(!mapboxConfigured)void searchOnSubmit();}}
       style={{flex:1,minWidth:0,color:t.ink,fontSize:JOBEEN_TYPE.input,minHeight:JOBEEN_CONTROL.inputHeight}}/>
      {searching?<ActivityIndicator size="small" color={t.ink2}/>:!mapboxConfigured&&<Pressable accessibilityRole="button" accessibilityLabel="Buscar ciudad" onPress={()=>void searchOnSubmit()} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}><Ionicons name="arrow-forward" size={20} color={t.ink}/></Pressable>}
     </View>
    </View>
    <View style={{flex:1,minHeight:0,paddingHorizontal:14}}>
     <JShopLocationMap center={center} zoom={zoom} radiusMiles={5} showRadius={false}
      fluid minimal onCenter={move} onZoom={value=>{if(!saving.current)setZoom(value);}}/>
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
      {chosen?.label??(moved?"Zona marcada en el mapa":"Elige una ciudad o mové el mapa")}
     </Text>
     <Text style={{fontSize:11,lineHeight:16,color:t.ink2}} numberOfLines={2}>
      Elige una zona aproximada: los compradores podrán ver la ubicación del anuncio.
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
