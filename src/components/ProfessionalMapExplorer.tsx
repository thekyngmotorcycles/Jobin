import {Ionicons} from "@expo/vector-icons";
import * as Location from "expo-location";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useEffect,useRef,useState} from "react";
import {ActivityIndicator,Keyboard,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {ProfessionalMap} from "./ProfessionalMap";
import {PublicProfileAvatar} from "./PublicProfileAvatar";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import type {MapPoint,JShopPlace} from "../lib/jshop-location-core";
import {findJShopPlaces} from "../lib/jshop-geocode";
import {discoverMapProfiles,type DiscoveredProfile,type DiscoveryKind} from "../lib/map-discovery";
import {formatMapDistance} from "../lib/map-viewport";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";

export function ProfessionalMapExplorer({initialQuery="",onList}:{initialQuery?:string;onList:(query:string)=>void}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const [query,setQuery]=useState(initialQuery);
 const [activeQuery,setActiveQuery]=useState(initialQuery.trim());
 const [city,setCity]=useState("");
 const [placeResults,setPlaceResults]=useState<JShopPlace[]>([]);
 const [center,setCenter]=useState<MapPoint>({lat:15,lon:0});
 const [candidate,setCandidate]=useState<{point:MapPoint;zoom:number}|null>(null);
 const [zoom,setZoom]=useState(2);
 const [hasArea,setHasArea]=useState(false);
 const [radius,setRadius]=useState(30);
 const [kind,setKind]=useState<DiscoveryKind>("all");
 const [profiles,setProfiles]=useState<DiscoveredProfile[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [loading,setLoading]=useState(false);
 const [locating,setLocating]=useState(false);
 const [resolving,setResolving]=useState(false);
 const [error,setError]=useState("");
 const requestRef=useRef(0),areaRevision=useRef(0),focusRevision=useRef(0);
 const scopeRef=useRef<MessageScope|null>(null);
 const [scopeReady,setScopeReady]=useState(false);
 const selectedProfile=profiles.find(p=>p.id===selected);
 function invalidateArea(){
  areaRevision.current++;requestRef.current++;setProfiles([]);setSelected(null);setPlaceResults([]);setResolving(false);setLocating(false);setLoading(false);
 }
 useFocusEffect(useCallback(()=>{
  const generation=++focusRevision.current;
  scopeRef.current=null;setScopeReady(false);invalidateArea();setCenter({lat:15,lon:0});setZoom(2);setCity("");setHasArea(false);setCandidate(null);setError("");
  void(async()=>{try{const scope=await captureMessageScope();if(focusRevision.current===generation){scopeRef.current=scope;setScopeReady(true);}}
   catch{if(focusRevision.current===generation)setError("Inicia sesión para explorar el mapa.");}})();
  // No automatic GPS request or reuse of a JShop buyer/seller location.
  return()=>{focusRevision.current++;areaRevision.current++;requestRef.current++;scopeRef.current=null;setScopeReady(false);setProfiles([]);setSelected(null);setPlaceResults([]);setHasArea(false);setCandidate(null);};
 },[]));
 useEffect(()=>{
  const scope=scopeRef.current;if(!hasArea||!scopeReady||!scope){setProfiles([]);return;}
  const number=++requestRef.current;let active=true;
  setProfiles([]);setSelected(null);setLoading(true);setError("");
  const valid=()=>active&&number===requestRef.current&&scopeRef.current===scope;
  void discoverMapProfiles(center,radius,activeQuery,kind,scope).then(rows=>{
   if(valid())setProfiles(rows);
  }).catch(e=>{if(valid()){setProfiles([]);setError(e instanceof Error?e.message:"No se pudo cargar el mapa.");}})
  .finally(()=>{if(valid())setLoading(false);});
  return()=>{active=false;};
 },[center.lat,center.lon,radius,kind,activeQuery,hasArea,scopeReady]);
 async function searchCity(){
  const scope=scopeRef.current;if(!scope||resolving||city.trim().length<2)return;
  const revision=++areaRevision.current,valid=()=>scopeRef.current===scope&&areaRevision.current===revision;
  Keyboard.dismiss();setResolving(true);setError("");setPlaceResults([]);
  try{
   await captureMessageScope(scope);if(!valid())return;
   const matches=await findJShopPlaces(city.trim());await assertMessageScope(scope);
   if(valid()){setPlaceResults(matches.slice(0,5));if(!matches.length)setError("No encontramos esa zona. Prueba con otra ciudad.");}
  }catch(e){if(valid())setError(e instanceof Error?e.message:"No pudimos buscar la ciudad.");}
  finally{if(valid())setResolving(false);}
 }
 function choosePlace(place:JShopPlace){
  if(!scopeRef.current)return;
  invalidateArea();setCenter({lat:place.lat,lon:place.lon});setCandidate(null);setZoom(11);
  setCity(place.city);setHasArea(true);Keyboard.dismiss();
 }
 async function centerOnPhone(){
  const scope=scopeRef.current;if(!scope||locating)return;
  invalidateArea();const revision=areaRevision.current,valid=()=>scopeRef.current===scope&&areaRevision.current===revision;
  setLocating(true);setError("");
  try{
   await captureMessageScope(scope);if(!valid())return;
   let permission=await Location.getForegroundPermissionsAsync();
   if(!valid())return;
   if(!permission.granted)permission=await Location.requestForegroundPermissionsAsync();
   await assertMessageScope(scope);if(!valid())return;
   if(!permission.granted)throw Error("Ubicación no autorizada. Puedes buscar tu ciudad manualmente.");
   const location=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
   await assertMessageScope(scope);if(!valid())return;
   setCenter({lat:Number(location.coords.latitude.toFixed(2)),lon:Number(location.coords.longitude.toFixed(2))});
   setCandidate(null);setZoom(11);setHasArea(true);setPlaceResults([]);
  }catch(e){if(valid())setError(e instanceof Error?e.message:"No se pudo obtener la ubicación.");}
  finally{if(valid())setLocating(false);}
 }
 async function openProfile(profile:DiscoveredProfile){
  const scope=scopeRef.current,number=requestRef.current;if(!scope||!profiles.some(p=>p.id===profile.id))return;
  try{await captureMessageScope(scope);
   if(scopeRef.current===scope&&requestRef.current===number)router.push({pathname:"/jcard",params:{user:profile.id,card:profile.kind==="company"?"business":"personal"}});
  }catch{invalidateArea();}
 }
 const pick=(kind:DiscoveryKind,label:string)=><Pressable key={kind} accessibilityRole="button" accessibilityState={{selected:kind===kindFilter}}
  onPress={()=>{if(kind!==kindFilter){invalidateArea();setKind(kind);}}} style={{minHeight:40,paddingHorizontal:13,borderRadius:20,backgroundColor:kind===kindFilter?t.ink:t.cream,
   alignItems:"center",justifyContent:"center"}}>
  <Text style={{fontWeight:kind===kindFilter?"800":"600",fontSize:12,color:kind===kindFilter?t.surface:t.ink}}>{label}</Text>
 </Pressable>;
 // Alias in closures prevents accidental shadowing of the selected kind.
 const kindFilter=kind;
 return <View style={{flex:1,backgroundColor:t.bg}}>
  <View style={{paddingHorizontal:13,paddingTop:10,paddingBottom:10,gap:9,backgroundColor:t.surface,borderBottomWidth:1,borderColor:t.line}}>
   <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
    <Ionicons name="map-outline" size={22} color={t.ink}/>
    <Text style={{fontSize:17,fontWeight:"800",color:t.ink,flex:1}}>Explorar cerca de mí</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Ver resultados como lista" onPress={()=>onList(query)}
     style={{minHeight:42,flexDirection:"row",alignItems:"center",gap:6,paddingHorizontal:11,borderRadius:13,backgroundColor:t.cream}}>
     <Ionicons name="list-outline" size={18} color={t.ink}/><Text style={{fontWeight:"700",color:t.ink}}>Lista</Text>
    </Pressable>
   </View>
   <View style={{flexDirection:"row",alignItems:"center",gap:7}}>
    <TextInput accessibilityLabel="Buscar profesión o servicio" placeholder="Aire acondicionado, electricista..." placeholderTextColor={t.ink2}
     value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={()=>{if(activeQuery!==query.trim()){invalidateArea();setActiveQuery(query.trim());}}}
     style={{flex:1,minWidth:0,height:45,backgroundColor:t.bg,borderRadius:15,paddingHorizontal:13,color:t.ink}}/>
    <Pressable accessibilityRole="button" accessibilityLabel="Buscar servicio en el mapa"
     onPress={()=>{if(activeQuery!==query.trim()){invalidateArea();setActiveQuery(query.trim());}Keyboard.dismiss();}}
     style={{width:43,height:43,backgroundColor:t.ink,borderRadius:13,alignItems:"center",justifyContent:"center"}}>
     <Ionicons name="search" size={21} color={t.surface}/>
    </Pressable>
   </View>
   <View style={{flexDirection:"row",alignItems:"center",gap:7}}>
    <TextInput accessibilityLabel="Elegir ciudad o zona" placeholder="Ciudad o zona" placeholderTextColor={t.ink2}
     value={city} onChangeText={value=>{areaRevision.current++;setCity(value);setPlaceResults([]);setResolving(false);setLocating(false);}} onSubmitEditing={()=>void searchCity()}
     returnKeyType="search" style={{flex:1,minWidth:0,height:42,backgroundColor:t.bg,borderRadius:13,paddingHorizontal:12,color:t.ink}}/>
    <Pressable accessibilityRole="button" accessibilityLabel="Buscar ciudad" onPress={()=>void searchCity()}
     disabled={resolving} style={{width:42,height:42,alignItems:"center",justifyContent:"center",backgroundColor:t.cream,borderRadius:12}}>
     {resolving?<ActivityIndicator size="small" color={t.ink}/>:<Ionicons name="arrow-forward" size={20} color={t.ink}/>}
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Usar ubicación actual" onPress={()=>void centerOnPhone()}
     disabled={locating} style={{width:42,height:42,alignItems:"center",justifyContent:"center",backgroundColor:t.cream,borderRadius:12}}>
     {locating?<ActivityIndicator size="small" color={t.ink}/>:<Ionicons name="navigate" size={20} color={t.ink}/>}
    </Pressable>
   </View>
   {placeResults.length>0&&<ScrollView style={{maxHeight:165}} keyboardShouldPersistTaps="handled">
    {placeResults.map((place,i)=><Pressable key={place.label+i} accessibilityRole="button"
     accessibilityLabel={"Buscar cerca de "+place.label} onPress={()=>choosePlace(place)}
     style={{minHeight:43,flexDirection:"row",gap:8,alignItems:"center",borderBottomWidth:1,borderColor:t.line,padding:6}}>
     <Ionicons name="location-outline" size={17} color={t.ink2}/>
     <Text numberOfLines={1} style={{color:t.ink,fontSize:13,flex:1}}>{place.label}</Text>
    </Pressable>)}
   </ScrollView>}
   <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
    contentContainerStyle={{alignItems:"center",gap:8,paddingVertical:1}}>
    {pick("all","Todos")}{pick("company","Empresas")}{pick("professional","Profesionales")}
    <View style={{width:1,height:23,backgroundColor:t.line}}/>
    {[10,30,80].map(km=><Pressable key={km} accessibilityRole="button" accessibilityLabel={"Radio "+km+" kilómetros"}
     accessibilityState={{selected:radius===km}} onPress={()=>{if(radius!==km){invalidateArea();setRadius(km);}}}
     style={{paddingHorizontal:10,minHeight:40,borderRadius:15,justifyContent:"center",backgroundColor:radius===km?t.yellow:t.bg}}>
     <Text style={{fontSize:12,fontWeight:"600",color:t.ink}}>{km} km</Text>
    </Pressable>)}
   </ScrollView>
  </View>
  <View style={{flex:1,minHeight:180,position:"relative"}}>
   <ProfessionalMap center={center} zoom={zoom} profiles={profiles} onMove={(point,nextZoom)=>setCandidate({point,zoom:nextZoom})} onSelect={setSelected}/>
   {!hasArea&&<View pointerEvents="none" style={{position:"absolute",top:20,alignSelf:"center",maxWidth:"85%",backgroundColor:t.surface,
    borderWidth:1,borderColor:t.line,borderRadius:14,paddingHorizontal:15,paddingVertical:10}}>
    <Text style={{color:t.ink,fontSize:13,textAlign:"center"}}>Busca una ciudad o usa tu ubicación para descubrir perfiles registrados.</Text>
   </View>}
   {candidate&&hasArea&&<Pressable accessibilityRole="button" accessibilityLabel="Buscar profesionales en esta zona" onPress={()=>{
    invalidateArea();setCenter(candidate.point);setZoom(candidate.zoom);setCandidate(null);setHasArea(true);
   }} style={{position:"absolute",top:12,alignSelf:"center",backgroundColor:t.surface,borderRadius:22,paddingHorizontal:18,minHeight:43,
    borderWidth:1,borderColor:t.yellow,alignItems:"center",justifyContent:"center"}}>
    <Text style={{fontWeight:"800",fontSize:13,color:t.ink}}>Buscar en esta zona</Text>
   </Pressable>}
   {!!error&&<View style={{position:"absolute",top:candidate?62:12,left:16,right:16,backgroundColor:t.surface,borderRadius:13,padding:10}}>
    <Text style={{color:t.ink,fontSize:12}}>{error}</Text>
   </View>}
   {hasArea&&!loading&&!selectedProfile&&<View pointerEvents="none" style={{position:"absolute",bottom:12,left:12,right:12,padding:10,
    borderRadius:14,backgroundColor:t.surface,alignItems:"center",borderWidth:1,borderColor:t.line}}>
    <Text style={{fontSize:12,color:t.ink}}>{profiles.length?profiles.length+" perfiles registrados en esta zona":"Aún no hay perfiles registrados en esta zona"}</Text>
   </View>}
   {selectedProfile&&<View style={{position:"absolute",bottom:12,left:12,right:12,padding:13,borderRadius:18,backgroundColor:t.surface,
    borderWidth:1,borderColor:t.line,gap:8}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:11}}>
     <PublicProfileAvatar userId={selectedProfile.id} name={selectedProfile.name} size={45} respectJCardVisibility/>
     <View style={{flex:1,gap:3}}>
      <Text style={{fontWeight:"800",fontSize:15,color:t.ink}} numberOfLines={1}>{selectedProfile.name}</Text>
      <Text style={{fontSize:12,color:t.ink2}} numberOfLines={2}>{selectedProfile.service+" · "+selectedProfile.city}</Text>
      <Text style={{fontSize:11,color:t.ink2}}>{formatMapDistance(selectedProfile.distance_km)+" · "+(selectedProfile.kind==="company"?"Empresa":"Zona aproximada")}</Text>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar ficha" onPress={()=>setSelected(null)} style={{padding:8}}><Ionicons name="close" size={20} color={t.ink}/></Pressable>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={"Ver JCard de "+selectedProfile.name}
     onPress={()=>void openProfile(selectedProfile)}
     style={{minHeight:44,borderRadius:13,backgroundColor:t.ink,alignItems:"center",justifyContent:"center"}}>
     <Text style={{color:t.surface,fontWeight:"800"}}>Ver JCard</Text>
    </Pressable>
   </View>}
   {loading&&<View pointerEvents="none" style={{position:"absolute",bottom:18,right:18,backgroundColor:t.surface,borderRadius:24,padding:9}}>
    <ActivityIndicator color={t.ink}/></View>}
  </View>
  <Pressable accessibilityRole="button" accessibilityLabel="Configurar mi zona para aparecer en el mapa" onPress={()=>router.push("/map-presence")}
   style={{minHeight:47,borderTopWidth:1,borderColor:t.line,backgroundColor:t.surface,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8}}>
   <Ionicons name="location-outline" size={17} color={t.ink}/>
   <Text style={{fontSize:13,fontWeight:"700",color:t.ink}}>¿Ofreces servicios? Aparecer en el mapa</Text>
  </Pressable>
 </View>;
}
