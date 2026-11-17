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
import type {JShopPlace,MapPoint} from "../../lib/jshop-location-core";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";

export default function JShopLocationPicker(){
 const {theme,colors}=useTheme();const t=jobeenTokens(theme);const insets=useSafeAreaInsets();
 const [owner,setOwner]=useState("guest");
 const [chosen,setChosen]=useState<JShopPlace|null>(null);
 const [center,setCenter]=useState<MapPoint>({lat:0,lon:0});
 const [zoom,setZoom]=useState(2);
 const [query,setQuery]=useState("");
 const [matches,setMatches]=useState<JShopPlace[]>([]);
 const [recent,setRecent]=useState<JShopPlace[]>([]);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const suppressAuto=useRef(false);
 useEffect(()=>{let active=true;void(async()=>{
  const id=await jshopAccountId().catch(()=>"guest");
  const [saved,prior]=await Promise.all([readJShopLocation(id),readRecentJShopLocations(id)]);
  if(!active)return;
  setOwner(id);setRecent(prior);
  if(saved){setChosen(saved);setCenter({lat:saved.lat,lon:saved.lon});setZoom(saved.zoom);setQuery(saved.city);}
 })();return()=>{active=false;};},[]);
 // Mapbox supports type-ahead globally (unlike the public Nominatim fallback).
 useEffect(()=>{
  if(suppressAuto.current){suppressAuto.current=false;return;}
  if(!mapboxConfigured||query.trim().length<3){setMatches([]);return;}
  let active=true;
  const timer=setTimeout(()=>{
   void findJShopPlaces(query).then(found=>{if(active){setMatches(found);setError("");}})
    .catch(e=>{if(active)setError(e instanceof Error?e.message:"No se pudieron sugerir lugares.");});
  },500);
  return()=>{active=false;clearTimeout(timer);};
 },[query]);
 function choose(place:JShopPlace){
  setChosen(place);setCenter({lat:place.lat,lon:place.lon});setZoom(Math.max(3,Math.min(15,place.zoom)));
  suppressAuto.current=true;setQuery(place.city);setMatches([]);setError("");
 }
 async function search(){
  if(loading||busy)return;
  setLoading(true);setError("");
  try{
   const found=await findJShopPlaces(query);
   setMatches(found);
   if(!found.length)setError("No encontramos esa ubicación. Escribe ciudad, localidad y país.");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo buscar la ubicación.");}
  finally{setLoading(false);}
 }
 async function chooseMapCenter(){
  if(busy||loading)return;
  setLoading(true);setError("");
  try{const place=await placeAtMapCenter(center.lat,center.lon);choose({...place,zoom});}
  catch(e){setError(e instanceof Error?e.message:"No se pudo identificar el punto seleccionado.");}
  finally{setLoading(false);}
 }
 async function apply(place:JShopPlace|null){
  if(busy)return;setBusy(true);setError("");
  try{const confirmed=place?await confirmJShopPlace(place):null;await saveJShopLocation(owner,confirmed);router.back();}
  catch(e){setError(e instanceof Error?e.message:"No se pudo guardar la ubicación.");}
  finally{setBusy(false);}
 }
 return <>
  <Stack.Screen options={{headerShown:false,presentation:"transparentModal",animation:"slide_from_bottom"}}/>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined}
   style={{flex:1,backgroundColor:colors.scrim,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar selector de ubicación" onPress={()=>router.back()} style={{flex:1}}/>
   <View accessibilityViewIsModal style={{backgroundColor:t.bg,borderTopLeftRadius:27,borderTopRightRadius:27,
    maxHeight:"92%",minHeight:480,paddingBottom:Math.max(12,insets.bottom),overflow:"hidden"}}>
    <View style={{width:40,height:5,borderRadius:3,alignSelf:"center",backgroundColor:t.line,marginTop:11,marginBottom:9}}/>
    <View style={{paddingHorizontal:18,paddingBottom:12,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
     <Text accessibilityRole="header" style={{fontSize:20,fontWeight:"800",color:t.ink}}>Elige una ubicación</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>router.back()} style={{width:42,height:42,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="close" size={24} color={t.ink}/>
     </Pressable>
    </View>
    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
     contentContainerStyle={{paddingHorizontal:16,paddingBottom:15,gap:14}}>
     <View style={{flexDirection:"row",gap:9,alignItems:"center"}}>
      <View style={{flex:1,minHeight:48,borderRadius:17,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,paddingHorizontal:12,flexDirection:"row",gap:9,alignItems:"center"}}>
       <Ionicons name="search-outline" color={t.ink2} size={20}/>
       <TextInput accessibilityLabel="Ciudad donde buscar artículos" value={query} onChangeText={value=>{setQuery(value);setMatches([]);}} onSubmitEditing={()=>void search()}
        returnKeyType="search" placeholder="Ciudad, localidad o barrio" placeholderTextColor={t.ink2}
        style={{flex:1,minHeight:44,fontSize:14,color:t.ink}}/>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Buscar ciudad" disabled={loading} onPress={()=>void search()}
       style={({pressed})=>({minHeight:48,paddingHorizontal:14,justifyContent:"center",borderRadius:16,backgroundColor:t.ink,opacity:loading?0.45:pressed?0.7:1})}>
       {loading?<ActivityIndicator color={t.bg}/>:<Text style={{color:t.bg,fontWeight:"800"}}>Buscar</Text>}
      </Pressable>
     </View>
     {matches.length>0&&<View style={{backgroundColor:t.surface,borderRadius:16,borderWidth:1,borderColor:t.line,padding:5}}>
      {matches.map((place,i)=><Pressable key={place.city+"-"+i} accessibilityRole="button"
       accessibilityLabel={"Seleccionar "+place.label} onPress={()=>choose(place)}
       style={{padding:10,minHeight:45,flexDirection:"row",alignItems:"center",gap:9}}>
       <Ionicons name="location-outline" size={19} color={t.ink}/>
       <Text numberOfLines={2} style={{flex:1,color:t.ink,fontSize:13}}>{place.label}</Text>
      </Pressable>)}
     </View>}
     <JShopLocationMap center={center} zoom={zoom}
      onCenter={point=>{setCenter(point);setChosen(null);}}
      onZoom={next=>{setZoom(next);setChosen(null);}}/>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10}}>
      <View style={{flex:1,gap:3}}>
       <Text numberOfLines={1} style={{color:t.ink,fontWeight:"800",fontSize:15}}>{chosen?.city??"Mueve el mapa para elegir una zona"}</Text>
       <Text numberOfLines={2} style={{color:t.ink2,fontSize:12}}>{chosen?.label??"El marcador central señala la ubicación que seleccionarás"}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Identificar ubicación del marcador" disabled={loading} onPress={()=>void chooseMapCenter()}
       style={({pressed})=>({minHeight:44,paddingHorizontal:11,alignItems:"center",justifyContent:"center",backgroundColor:t.cream,borderRadius:13,flexDirection:"row",gap:5,opacity:pressed?0.7:1})}>
       <Ionicons name="locate-outline" size={18} color={t.ink}/>
       <Text style={{fontSize:12,color:t.ink,fontWeight:"700"}}>Elegir punto</Text>
      </Pressable>
     </View>
     {!!recent.length&&<View style={{gap:8}}>
      <Text style={{fontSize:14,fontWeight:"800",color:t.ink}}>Ubicaciones recientes</Text>
      {recent.slice(0,4).map(place=><Pressable key={place.city} accessibilityRole="button"
       accessibilityLabel={"Buscar en "+place.city} onPress={()=>choose(place)}
       style={{minHeight:42,paddingHorizontal:5,flexDirection:"row",alignItems:"center",gap:10}}>
       <Ionicons name="time-outline" size={20} color={t.ink2}/>
       <Text numberOfLines={1} style={{flex:1,color:t.ink}}>{place.city}</Text>
       <Ionicons name="chevron-forward" size={18} color={t.ink2}/>
      </Pressable>)}
     </View>}
     {!!error&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:t.ink}}>{error}</Text>}
     <Text style={{fontSize:11,lineHeight:17,color:t.ink2}}>{mapboxConfigured?"Mapa y búsqueda de ciudades con Mapbox. Se guardan las ubicaciones confirmadas con geocodificación permanente.":"Mapa provisional con OpenStreetMap; falta configurar la clave pública de Mapbox."} JShop filtra anuncios por la ciudad indicada por el vendedor; no calcula distancias todavía.</Text>
    </ScrollView>
    <View style={{paddingHorizontal:16,paddingTop:12,borderTopWidth:1,borderColor:t.line,gap:9}}>
     <Pressable accessibilityRole="button" accessibilityLabel={chosen?"Aplicar ubicación "+chosen.city:"Selecciona una ciudad primero"} disabled={!chosen||busy}
      onPress={()=>void apply(chosen)} style={({pressed})=>({height:50,borderRadius:17,backgroundColor:t.ink,alignItems:"center",justifyContent:"center",opacity:!chosen||busy?0.45:pressed?0.7:1})}>
      <Text style={{color:t.bg,fontSize:15,fontWeight:"800"}}>{busy?"Guardando...":"Buscar artículos aquí"}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="Buscar en todas las ubicaciones" disabled={busy}
      onPress={()=>void apply(null)} style={{minHeight:42,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:13,fontWeight:"700",color:t.ink2}}>Todas las ubicaciones</Text>
     </Pressable>
    </View>
   </View>
  </KeyboardAvoidingView>
 </>;
}
