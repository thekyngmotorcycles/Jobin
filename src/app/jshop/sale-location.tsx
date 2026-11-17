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
 const [error,setError]=useState("");
 const suppress=useRef(false),sequence=useRef(0);

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
    suppress.current=true;setQuery(place.label);
   }
  }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo cargar la ubicación de venta.");}
  finally{if(active)setLoading(false);}
 })();return()=>{active=false;};},[article,session]);

 useEffect(()=>{
  if(suppress.current){suppress.current=false;return;}
  if(!mapboxConfigured||query.trim().length<3){setResults([]);return;}
  const n=++sequence.current;let alive=true;
  const timer=setTimeout(()=>{void findJShopPlaces(query).then(data=>{
   if(alive&&n===sequence.current)setResults(data.slice(0,5));
  }).catch(e=>{if(alive&&n===sequence.current)setError(e instanceof Error?e.message:"No se pudo buscar.");});},450);
  return()=>{alive=false;clearTimeout(timer);};
 },[query]);

 function choose(place:SaleLocation){
  setChosen(place);setMoved(false);setCenter({lat:place.lat,lon:place.lon});
  setZoom(Math.max(7,Math.min(15,place.zoom||11)));
  suppress.current=true;setQuery(place.label);setResults([]);setError("");
 }
 async function search(){
  if(busy||searching)return;
  setSearching(true);setError("");
  try{
   const found=await findJShopPlaces(query);
   if(found.length===1)choose(found[0]);else setResults(found);
   if(!found.length)setError("No encontramos la ubicación. Probá ciudad, estado y país.");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo buscar esta ubicación.");}
  finally{setSearching(false);}
 }
 function move(point:MapPoint){
  if(Math.abs(point.lat-center.lat)<0.00001&&Math.abs(point.lon-center.lon)<0.00001)return;
  setCenter(point);setChosen(null);setMoved(true);
  suppress.current=true;setQuery("");setResults([]);
 }
 async function save(){
  if(!owner||busy||(!chosen&&!moved))return;
  setBusy(true);setError("");
  try{
   const point=chosen??await placeAtMapCenter(center.lat,center.lon);
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
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1,backgroundColor:colors.scrim,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sin guardar" onPress={()=>router.back()} style={{flex:1}}/>
   <View accessibilityViewIsModal style={{maxHeight:"93%",minHeight:480,backgroundColor:t.bg,borderTopLeftRadius:27,borderTopRightRadius:27,overflow:"hidden",paddingBottom:Math.max(12,insets.bottom)}}>
    <View style={{width:40,height:5,borderRadius:3,alignSelf:"center",backgroundColor:t.line,marginTop:11,marginBottom:9}}/>
    <View style={{paddingHorizontal:18,paddingBottom:12,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
     <View style={{flex:1,gap:3}}>
      <Text accessibilityRole="header" style={{fontSize:20,fontWeight:"800",color:t.ink}}>{article?"Ubicación de este artículo":"Mi ubicación de venta"}</Text>
      <Text style={{fontSize:12,color:t.ink2}}>{article?"No cambiará tu ubicación predeterminada":"Se utilizará inicialmente para tus próximos artículos"}</Text>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>router.back()} style={{width:42,height:42,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="close" size={24} color={t.ink}/>
     </Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled contentContainerStyle={{paddingHorizontal:16,gap:13,paddingBottom:20}} showsVerticalScrollIndicator={false}>
     <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
      <View style={{flex:1,minHeight:49,borderRadius:17,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:12}}>
       <Ionicons name="search-outline" size={20} color={t.ink2}/>
       <TextInput accessibilityLabel="Ciudad o zona de venta" value={query} placeholder="Ciudad, por ejemplo Miami, Florida"
        onChangeText={v=>{setQuery(v);setChosen(null);setMoved(false);setResults([]);}}
        onSubmitEditing={()=>void search()} returnKeyType="search" placeholderTextColor={t.ink2} style={{flex:1,color:t.ink,fontSize:14,minHeight:46}}/>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Buscar ubicación" disabled={busy||searching} onPress={()=>void search()}
       style={{height:49,justifyContent:"center",paddingHorizontal:15,borderRadius:16,backgroundColor:t.ink,opacity:searching?0.5:1}}>
       {searching?<ActivityIndicator color={t.bg}/>:<Text style={{color:t.bg,fontWeight:"800"}}>Buscar</Text>}
      </Pressable>
     </View>
     {results.length>0&&<View style={{backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:16,padding:5}}>
      {results.map((place,i)=><Pressable key={place.label+"-"+i} accessibilityRole="button" accessibilityLabel={"Elegir "+place.label}
       onPress={()=>choose(place)} style={{minHeight:44,flexDirection:"row",alignItems:"center",gap:10,padding:9}}>
       <Ionicons name="location-outline" size={19} color={t.ink}/>
       <Text numberOfLines={2} style={{flex:1,fontSize:13,color:t.ink}}>{place.label}</Text>
      </Pressable>)}
     </View>}
     <JShopLocationMap center={center} zoom={zoom} radiusMiles={5} showRadius={false} onCenter={move} onZoom={setZoom}/>
     <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
      <View style={{flex:1,gap:3}}>
       <Text numberOfLines={1} style={{color:t.ink,fontSize:15,fontWeight:"800"}}>{chosen?.city??(moved?"Punto del mapa seleccionado":"Seleccioná una ciudad o zona")}</Text>
       <Text numberOfLines={2} style={{fontSize:12,color:t.ink2}}>{chosen?.label??"Arrastrá el mapa para modificar la ubicación."}</Text>
      </View>
      <Pressable accessibilityRole="button" disabled={!ready||searching} onPress={()=>{void(async()=>{
       setSearching(true);try{const p=await placeAtMapCenter(center.lat,center.lon);choose({...p,lat:center.lat,lon:center.lon,zoom});}
       catch(e){setError(e instanceof Error?e.message:"No se pudo identificar el punto.");}
       finally{setSearching(false);}
      })();}} style={{minHeight:42,borderRadius:13,backgroundColor:t.cream,paddingHorizontal:10,alignItems:"center",justifyContent:"center"}}>
       <Text style={{fontSize:12,color:t.ink,fontWeight:"700"}}>Elegir punto</Text>
      </Pressable>
     </View>
     <Text style={{fontSize:12,lineHeight:18,color:t.ink2}}>Elegí una ubicación aproximada donde ofrecés el artículo. No señales tu domicilio particular; la zona del anuncio será visible para compradores.</Text>
     {!!error&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:t.ink}}>{error}</Text>}
    </ScrollView>
    <View style={{paddingHorizontal:16,paddingTop:11,borderTopWidth:1,borderColor:t.line}}>
     <Pressable accessibilityRole="button" accessibilityLabel={article?"Usar ubicación para este artículo":"Guardar ubicación de venta"}
      disabled={!ready||!owner||busy||loading} onPress={()=>void save()}
      style={({pressed})=>({height:51,borderRadius:17,backgroundColor:t.ink,justifyContent:"center",alignItems:"center",opacity:!ready||!owner||busy?0.45:pressed?0.7:1})}>
      <Text style={{fontSize:15,fontWeight:"800",color:t.bg}}>{busy?"Guardando...":article?"Usar esta ubicación":"Guardar ubicación de venta"}</Text>
     </Pressable>
    </View>
   </View>
  </KeyboardAvoidingView>
 </>;
}
