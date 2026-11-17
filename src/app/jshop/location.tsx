import {Ionicons} from "@expo/vector-icons";
import {router,Stack} from "expo-router";
import {useEffect,useRef,useState} from "react";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {JShopLocationMap} from "../../components/JShopLocationMap";
import {confirmJShopPlace,findJShopPlaces,placeAtMapCenter} from "../../lib/jshop-geocode";
import {mapboxConfigured} from "../../lib/mapbox-config";
import {readJShopLocation,readRecentJShopLocations,saveJShopLocation} from "../../lib/jshop-location";
import {jshopAccountId} from "../../lib/jshop-local";
import {JSHOP_RADIUS_MILES,mapZoomForRadius,type JShopRadiusMiles} from "../../lib/jshop-geo";
import type {JShopPlace,MapPoint} from "../../lib/jshop-location-core";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function JShopLocationPicker(){
 const {theme,colors}=useTheme();const t=jobeenTokens(theme);const insets=useSafeAreaInsets();
 const [owner,setOwner]=useState("guest");
 const [chosen,setChosen]=useState<JShopPlace|null>(null);
 const [center,setCenter]=useState<MapPoint>({lat:0,lon:0});
 const [mapMoved,setMapMoved]=useState(false);
 const [zoom,setZoom]=useState(2);
 const [radiusMiles,setRadiusMiles]=useState<JShopRadiusMiles>(10);
 const [query,setQuery]=useState("");
 const [matches,setMatches]=useState<JShopPlace[]>([]);
 const [recent,setRecent]=useState<JShopPlace[]>([]);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const suppressAuto=useRef(false);
 const requestIndex=useRef(0);

 useEffect(()=>{let active=true;void(async()=>{
  const id=await jshopAccountId().catch(()=>"guest");
  const [saved,prior]=await Promise.all([readJShopLocation(id),readRecentJShopLocations(id)]);
  if(!active)return;
  setOwner(id);setRecent(prior);
  if(saved){
   setChosen(saved);setCenter({lat:saved.lat,lon:saved.lon});
   setRadiusMiles(saved.radiusMiles??10);
   setZoom(mapZoomForRadius(saved,saved.radiusMiles??10));
   suppressAuto.current=true;setQuery(saved.label);
  }
 })();return()=>{active=false;};},[]);

 useEffect(()=>{
  if(suppressAuto.current){suppressAuto.current=false;return;}
  if(!mapboxConfigured||query.trim().length<3){setMatches([]);return;}
  let active=true;const current=++requestIndex.current;
  const timer=setTimeout(()=>{
   void findJShopPlaces(query).then(found=>{
    if(active&&current===requestIndex.current){setMatches(found.slice(0,5));setError("");}
   }).catch(e=>{if(active&&current===requestIndex.current)setError(e instanceof Error?e.message:"No se encontraron sugerencias.");});
  },450);
  return()=>{active=false;clearTimeout(timer);};
 },[query]);

 function choose(place:JShopPlace){
  setChosen(place);setMapMoved(false);
  setCenter({lat:place.lat,lon:place.lon});setZoom(mapZoomForRadius(place,radiusMiles));
  suppressAuto.current=true;setQuery(place.label);
  setMatches([]);setError("");
 }
 function setRadius(next:JShopRadiusMiles){
  setRadiusMiles(next);
  if(chosen||mapMoved)setZoom(mapZoomForRadius(center,next));
 }
 async function search(){
  if(loading||busy)return;
  setLoading(true);setError("");
  try{
   const found=await findJShopPlaces(query);
   if(found.length===1)choose(found[0]);
   else setMatches(found);
   if(!found.length)setError("No encontramos esa localidad. Probá con ciudad, estado y país.");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo buscar la ubicación.");}
  finally{setLoading(false);}
 }
 function moveCenter(point:MapPoint){
  const changed=Math.abs(point.lat-center.lat)>0.00001||Math.abs(point.lon-center.lon)>0.00001;
  if(!changed)return;
  setCenter(point);setChosen(null);setMapMoved(true);
  suppressAuto.current=true;setQuery("");
  setMatches([]);
 }
 async function chooseMapCenter(){
  if(busy||loading||(!mapMoved&&!chosen))return;
  setLoading(true);setError("");
  try{const place=await placeAtMapCenter(center.lat,center.lon);choose({...place,zoom});}
  catch(e){setError(e instanceof Error?e.message:"No se pudo identificar el punto seleccionado.");}
  finally{setLoading(false);}
 }
 async function apply(){
  if(busy||(!chosen&&!mapMoved))return;
  setBusy(true);setError("");
  try{
   const place=chosen??await placeAtMapCenter(center.lat,center.lon);
   // Mapbox requires a permanent geocoding result before persisting coordinates.
   const confirmed=await confirmJShopPlace({...place,lat:center.lat,lon:center.lon});
   await saveJShopLocation(owner,{...confirmed,radiusMiles});
   router.back();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar la zona de búsqueda.");}
  finally{setBusy(false);}
 }
 async function clear(){
  if(busy)return;
  setBusy(true);setError("");
  try{await saveJShopLocation(owner,null);router.back();}
  catch(e){setError(e instanceof Error?e.message:"No se pudo eliminar la ubicación.");}
  finally{setBusy(false);}
 }
 const enabled=!!chosen||mapMoved;
 return <>
  <Stack.Screen options={{headerShown:false,presentation:"transparentModal",animation:"slide_from_bottom"}}/>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined}
   style={{flex:1,backgroundColor:colors.scrim,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sin guardar" onPress={()=>router.back()} style={{flex:1}}/>
   <View accessibilityViewIsModal style={{backgroundColor:t.bg,borderTopLeftRadius:27,borderTopRightRadius:27,
    maxHeight:"94%",minHeight:500,paddingBottom:Math.max(12,insets.bottom),overflow:"hidden"}}>
    <View style={{width:40,height:5,borderRadius:3,alignSelf:"center",backgroundColor:t.line,marginTop:11,marginBottom:9}}/>
    <View style={{paddingHorizontal:18,paddingBottom:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
     <Text accessibilityRole="header" style={{fontSize:20,fontWeight:"800",color:t.ink}}>Elige una ubicación</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>router.back()}
      style={{width:42,height:42,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="close" size={24} color={t.ink}/>
     </Pressable>
    </View>
    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
     contentContainerStyle={{paddingHorizontal:16,paddingBottom:12,gap:13}}>
     <View style={{flexDirection:"row",gap:9,alignItems:"center"}}>
      <View style={{flex:1,minHeight:48,borderRadius:17,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,paddingHorizontal:12,flexDirection:"row",gap:9,alignItems:"center"}}>
       <Ionicons name="search-outline" color={t.ink2} size={20}/>
       <TextInput accessibilityLabel="Ciudad donde buscar artículos" value={query}
        onChangeText={value=>{setQuery(value);setChosen(null);setMapMoved(false);setMatches([]);}}
        onSubmitEditing={()=>void search()} returnKeyType="search" placeholder="Ej. Miami, Florida"
        placeholderTextColor={t.ink2} style={{flex:1,minHeight:44,fontSize:14,color:t.ink}}/>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Buscar ciudad" disabled={loading||busy} onPress={()=>void search()}
       style={({pressed})=>({minHeight:48,paddingHorizontal:15,justifyContent:"center",borderRadius:16,backgroundColor:t.ink,opacity:loading?0.45:pressed?0.7:1})}>
       {loading?<ActivityIndicator color={t.bg}/>:<Text style={{color:t.bg,fontWeight:"800"}}>Buscar</Text>}
      </Pressable>
     </View>
     {matches.length>0&&<View style={{backgroundColor:t.surface,borderRadius:16,borderWidth:1,borderColor:t.line,padding:4}}>
      {matches.map((place,i)=><Pressable key={place.city+"-"+i} accessibilityRole="button"
       accessibilityLabel={"Seleccionar "+place.label} onPress={()=>choose(place)}
       style={{padding:10,minHeight:44,flexDirection:"row",alignItems:"center",gap:9}}>
       <Ionicons name="location-outline" size={19} color={t.ink}/>
       <Text numberOfLines={2} style={{flex:1,color:t.ink,fontSize:13}}>{place.label}</Text>
      </Pressable>)}
     </View>}
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8}}>
      <View style={{flex:1,gap:3}}>
       <Text numberOfLines={1} style={{color:t.ink,fontWeight:"800",fontSize:15}}>{chosen?.city??(mapMoved?"Punto seleccionado en el mapa":"Elegí una ciudad")}</Text>
       <Text numberOfLines={1} style={{color:t.ink2,fontSize:12}}>{chosen?.label??"Arrastrá el mapa para mover el centro"}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Confirmar ciudad del punto central" disabled={!enabled||loading}
       onPress={()=>void chooseMapCenter()} style={({pressed})=>({minHeight:43,paddingHorizontal:10,
        borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:t.cream,
        flexDirection:"row",gap:5,opacity:!enabled?0.45:pressed?0.7:1})}>
       <Ionicons name="locate-outline" size={18} color={t.ink}/>
       <Text style={{fontSize:12,color:t.ink,fontWeight:"700"}}>Elegir punto</Text>
      </Pressable>
     </View>
     <JShopLocationMap center={center} zoom={zoom} radiusMiles={radiusMiles}
      onCenter={moveCenter} onZoom={setZoom}/>
     <View style={{gap:10}}>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
       <Text style={{fontSize:15,fontWeight:"800",color:t.ink}}>Radio de búsqueda</Text>
       <Text style={{fontSize:13,fontWeight:"800",color:t.ink}}>{radiusMiles} millas</Text>
      </View>
      <View accessibilityRole="radiogroup" style={{flexDirection:"row",gap:8}}>
       {JSHOP_RADIUS_MILES.map(miles=><Pressable key={miles} accessibilityRole="radio"
        accessibilityLabel={miles+" millas a la redonda"} accessibilityState={{checked:radiusMiles===miles}}
        onPress={()=>setRadius(miles)}
        style={({pressed})=>({flex:1,minHeight:44,alignItems:"center",justifyContent:"center",borderRadius:15,
         borderWidth:1,borderColor:radiusMiles===miles?t.yellow:t.line,
         backgroundColor:radiusMiles===miles?t.cream:t.surface,opacity:pressed?0.7:1})}>
        <Text style={{color:t.ink,fontSize:13,fontWeight:radiusMiles===miles?"800":"600"}}>{miles} mi</Text>
       </Pressable>)}
      </View>
      <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>El área amarilla del mapa indica dónde se buscarán artículos. Podés mover el mapa para cambiar el centro.</Text>
     </View>
     {!!recent.length&&<View style={{gap:7}}>
      <Text style={{fontSize:14,fontWeight:"800",color:t.ink}}>Ubicaciones recientes</Text>
      {recent.slice(0,3).map(place=><Pressable key={place.city} accessibilityRole="button"
       onPress={()=>{setRadiusMiles(place.radiusMiles??10);choose({...place,radiusMiles:place.radiusMiles??10});setZoom(mapZoomForRadius(place,place.radiusMiles??10));}}
       style={{minHeight:40,flexDirection:"row",alignItems:"center",gap:9}}>
       <Ionicons name="time-outline" size={19} color={t.ink2}/>
       <Text numberOfLines={1} style={{flex:1,color:t.ink}}>{place.city}</Text>
       <Text style={{color:t.ink2,fontSize:12}}>{place.radiusMiles??10} mi</Text>
      </Pressable>)}
     </View>}
     {!!error&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:t.ink}}>{error}</Text>}
     <Text style={{color:t.ink2,fontSize:11,lineHeight:17}}>La distancia se calcula desde el marcador central. Los anuncios se incluyen solo si su ubicación publicada está dentro del radio seleccionado.</Text>
    </ScrollView>
    <View style={{paddingHorizontal:16,paddingTop:10,borderTopWidth:1,borderColor:t.line,gap:5}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Guardar resultados de la zona seleccionada"
      disabled={!enabled||busy} onPress={()=>void apply()}
      style={({pressed})=>({height:50,borderRadius:17,backgroundColor:t.ink,alignItems:"center",
       justifyContent:"center",opacity:!enabled||busy?0.45:pressed?0.7:1})}>
      <Text style={{color:t.bg,fontSize:15,fontWeight:"800"}}>{busy?"Guardando...":"Guardar resultados"}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="Buscar en todas las ubicaciones" disabled={busy}
      onPress={()=>void clear()} style={{minHeight:40,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:13,fontWeight:"700",color:t.ink2}}>Todas las ubicaciones</Text>
     </Pressable>
    </View>
   </View>
  </KeyboardAvoidingView>
 </>;
}
