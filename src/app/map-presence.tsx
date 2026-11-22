import {Ionicons} from "@expo/vector-icons";
import {router,Stack,useFocusEffect} from "expo-router";
import {useCallback,useRef,useState} from "react";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {JShopLocationMap} from "../components/JShopLocationMap";
import {findJShopPlaces,confirmJShopPlace} from "../lib/jshop-geocode";
import type {JShopPlace,MapPoint} from "../lib/jshop-location-core";
import {myMapPresence,saveMapPresence,setMapPresenceVisible,type MapPresence} from "../lib/map-discovery";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

export default function MapPresenceSettings(){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const [kind,setKind]=useState<"company"|"professional"|null>(null);
 const [allowedKinds,setAllowedKinds]=useState<("company"|"professional")[]>([]);
 const [presence,setPresence]=useState<MapPresence|null>(null);
 const [city,setCity]=useState(""),[service,setService]=useState("");
 const [center,setCenter]=useState<MapPoint>({lat:15,lon:-10}),[zoom,setZoom]=useState(2);
 const [selectedZone,setSelectedZone]=useState(false);
 const [places,setPlaces]=useState<JShopPlace[]>([]);
 const [loading,setLoading]=useState(true),[searching,setSearching]=useState(false),[saving,setSaving]=useState(false);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 const scopeRef=useRef<MessageScope|null>(null),revision=useRef(0),cityRevision=useRef(0),busy=useRef(false);
 useFocusEffect(useCallback(()=>{
  const generation=++revision.current;
  scopeRef.current=null;cityRevision.current++;setLoading(true);setSearching(false);setKind(null);setAllowedKinds([]);setPresence(null);setCity("");setService("");setCenter({lat:15,lon:-10});setZoom(2);setSelectedZone(false);setPlaces([]);setError("");setSuccess("");
  void(async()=>{try{
   const scope=await captureMessageScope(),next=await myMapPresence(scope);
   await assertMessageScope(scope);if(revision.current!==generation)return;
   scopeRef.current=scope;setKind(next.kind);setAllowedKinds(next.allowedKinds);setPresence(next.presence);
   if(next.presence){setCity(next.presence.city);setService(next.presence.service);setCenter({lat:next.presence.latitude,lon:next.presence.longitude});setZoom(11);setSelectedZone(true);}
  }catch(e){if(revision.current===generation)setError(e instanceof Error?e.message:"No se pudo cargar tu zona profesional.");}
  finally{if(revision.current===generation)setLoading(false);}})();
  return()=>{revision.current++;cityRevision.current++;scopeRef.current=null;setPresence(null);setPlaces([]);setCity("");setService("");setSelectedZone(false);};
 },[]));
 async function searchCity(){
  const scope=scopeRef.current;if(!scope||busy.current||searching||city.trim().length<2)return;
  const generation=++cityRevision.current,valid=()=>scopeRef.current===scope&&cityRevision.current===generation;
  setError("");setSuccess("");setSearching(true);setPlaces([]);
  try{await captureMessageScope(scope);if(!valid())return;
   const matches=await findJShopPlaces(city);await assertMessageScope(scope);
   if(valid()){setPlaces(matches.slice(0,5));if(!matches.length)setError("No se encontró esa ciudad.");}}
  catch(e){if(valid())setError(e instanceof Error?e.message:"No se pudo buscar la ciudad.");}
  finally{if(valid())setSearching(false);}
 }
 function choose(place:JShopPlace){
  if(!scopeRef.current||busy.current)return;
  cityRevision.current++;setSearching(false);setCenter({lat:place.lat,lon:place.lon});setCity(place.city);setZoom(11);
  setPlaces([]);setSelectedZone(true);setSuccess("");setError("");
 }
 async function save(){
  const scope=scopeRef.current,generation=revision.current;
  if(!scope||!kind||!allowedKinds.includes(kind)||busy.current)return;
  const valid=()=>scopeRef.current===scope&&revision.current===generation;
  setError("");setSuccess("");
  if(!selectedZone){setError("Selecciona primero una ciudad y ajusta tu zona en el mapa.");return;}
  busy.current=true;setSaving(true);cityRevision.current++;setSearching(false);setPlaces([]);
  try{
   await captureMessageScope(scope);if(!valid())return;
   // Never send precise personal coordinates to the geocoding provider.
   const lat=kind==="professional"?Number(center.lat.toFixed(2)):center.lat;
   const lon=kind==="professional"?Number(center.lon.toFixed(2)):center.lon;
   const point=await confirmJShopPlace({lat,lon,city:city.trim(),label:city.trim(),zoom});
   await assertMessageScope(scope);if(!valid())return;
   await saveMapPresence({kind,city:city.trim(),service:service.trim(),center:{lat:point.lat,lon:point.lon}},scope);
   const next=await myMapPresence(scope);if(valid()){setPresence(next.presence);setSuccess("Tu zona de servicio ya aparece en el mapa.");}
  }catch(e){if(valid())setError(e instanceof Error?e.message:"No se pudo guardar tu ubicación.");}
  finally{busy.current=false;setSaving(false);}
 }
 async function changeVisibility(){
  const scope=scopeRef.current,generation=revision.current;
  if(!scope||!presence||presence.owner_id!==scope.owner||busy.current)return;
  const valid=()=>scopeRef.current===scope&&revision.current===generation;
  busy.current=true;setSaving(true);setError("");setSuccess("");
  try{await captureMessageScope(scope);if(!valid())return;
   await setMapPresenceVisible(!presence.is_visible,scope);
   const next=await myMapPresence(scope);
   if(valid()){setPresence(next.presence);setSuccess(next.presence?.is_visible?"Tu perfil vuelve a aparecer en el mapa.":"Tu perfil ya no aparece en el mapa.");}}
  catch(e){if(valid())setError(e instanceof Error?e.message:"No se pudo cambiar la visibilidad.");}
  finally{busy.current=false;setSaving(false);}
 }
 return <>
  <Stack.Screen options={{title:"Mi zona profesional"}}/>
  <SafeAreaView edges={["bottom"]} style={{flex:1,backgroundColor:t.bg}}>
   <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,paddingBottom:40,gap:15}}>
    <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
     <Text style={{fontSize:20,color:t.ink,fontWeight:"800"}}>Aparecer en el mapa</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Volver a explorar" onPress={()=>router.back()}
      style={{padding:8}}><Ionicons name="close" size={24} color={t.ink}/></Pressable>
    </View>
    <Text style={{color:t.ink2,fontSize:13,lineHeight:20}}>Es opcional. Publicaremos únicamente la zona profesional que elijas, no la ubicación de venta de JShop ni tu posición GPS. Puedes desactivarla cuando quieras.</Text>
    {loading&&<ActivityIndicator color={t.yellow}/>}
    {!loading&&!kind&&<View style={{padding:15,borderRadius:16,backgroundColor:t.cream,gap:8}}>
     <Text style={{fontSize:14,fontWeight:"700",color:t.ink}}>Primero completa tu JCard profesional.</Text>
     <Text style={{fontSize:12,color:t.ink2}}>Esta función está disponible para empresas y personas que hayan registrado una profesión.</Text>
     <Pressable onPress={()=>router.push("/(tabs)/profile")} accessibilityRole="button" style={{minHeight:42,justifyContent:"center"}}>
      <Text style={{fontWeight:"800",color:t.ink}}>Abrir mi perfil</Text>
     </Pressable>
    </View>}
    {!loading&&presence&&<Pressable accessibilityRole="switch" accessibilityState={{checked:presence.is_visible}}
      accessibilityLabel="Mostrar mi perfil en el mapa" disabled={saving} onPress={()=>void changeVisibility()}
      style={{minHeight:56,padding:13,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:16,
       flexDirection:"row",alignItems:"center",gap:10}}>
      <Ionicons name={presence.is_visible?"eye-outline":"eye-off-outline"} size={23} color={t.ink}/>
      <Text style={{color:t.ink,fontSize:14,fontWeight:"700",flex:1}}>{presence.is_visible?"Visible en el mapa":"Oculto en el mapa"}</Text>
      <Ionicons name={presence.is_visible?"toggle":"toggle-outline"} size={32} color={t.ink}/>
     </Pressable>}
    {!loading&&kind&&<>
     {allowedKinds.length>1&&<View style={{flexDirection:"row",gap:8}}>
      {allowedKinds.map(option=><Pressable key={option} accessibilityRole="button"
       accessibilityLabel={option==="company"?"Mostrar como empresa":"Mostrar como profesional"}
       accessibilityState={{selected:kind===option}} onPress={()=>{if(!busy.current)setKind(option);}}
       style={{flex:1,minHeight:44,alignItems:"center",justifyContent:"center",borderRadius:14,
        backgroundColor:kind===option?t.ink:t.cream}}>
       <Text style={{color:kind===option?t.surface:t.ink,fontWeight:"700"}}>{option==="company"?"Empresa":"Profesional"}</Text>
      </Pressable>)}
     </View>}
     <Text style={{color:t.ink,fontSize:13,fontWeight:"700"}}>Actividad profesional</Text>
     <TextInput accessibilityLabel="Servicio o profesión" value={service} editable={!saving} onChangeText={setService}
      placeholder={kind==="company"?"Ej. Aire acondicionado comercial":"Ej. Electricista residencial"} placeholderTextColor={t.ink2}
      maxLength={120} style={{minHeight:49,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:15,paddingHorizontal:13,color:t.ink}}/>
     <Text style={{color:t.ink,fontSize:13,fontWeight:"700"}}>Ciudad o zona donde trabajas</Text>
     <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
      <TextInput accessibilityLabel="Ciudad de servicio" value={city} editable={!saving} onChangeText={text=>{cityRevision.current++;setSearching(false);setCity(text);setPlaces([]);setSelectedZone(false);}}
       onSubmitEditing={()=>void searchCity()} returnKeyType="search" placeholder="Miami, Florida" placeholderTextColor={t.ink2}
       maxLength={100} style={{flex:1,minHeight:49,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:15,paddingHorizontal:13,color:t.ink}}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Buscar ciudad" onPress={()=>void searchCity()} disabled={searching}
       style={{height:46,width:46,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:t.cream}}>
       {searching?<ActivityIndicator color={t.ink}/>:<Ionicons name="search" size={21} color={t.ink}/>}
      </Pressable>
     </View>
     {places.map((p,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={"Elegir "+p.label} onPress={()=>choose(p)}
      style={{minHeight:46,padding:9,borderRadius:10,backgroundColor:t.surface,borderBottomWidth:1,borderColor:t.line}}>
      <Text numberOfLines={2} style={{color:t.ink,fontSize:13}}>{p.label}</Text>
     </Pressable>)}
     <Text style={{color:t.ink2,fontSize:12,lineHeight:18}}>Ajusta el centro del mapa a tu zona general de trabajo. {kind==="professional"?"La posición pública se aproxima al kilómetro para proteger tu privacidad.":"No selecciones una dirección privada."}</Text>
     <View style={{height:285,borderRadius:20,overflow:"hidden"}}>
      <JShopLocationMap center={center} zoom={zoom} radiusMiles={10} showRadius={false}
       onCenter={point=>{if(!busy.current){setCenter(point);setSelectedZone(true);}}} onZoom={value=>{if(!busy.current)setZoom(value);}}/>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Guardar zona profesional" disabled={saving||!selectedZone||service.trim().length<2||city.trim().length<2}
      onPress={()=>void save()} style={{minHeight:52,borderRadius:16,backgroundColor:t.ink,alignItems:"center",justifyContent:"center",
       opacity:saving||!selectedZone||service.trim().length<2||city.trim().length<2?0.45:1}}>
      {saving?<ActivityIndicator color={t.surface}/>:<Text style={{color:t.surface,fontSize:15,fontWeight:"800"}}>Guardar zona profesional</Text>}
     </Pressable>
    </>}
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:t.ink,fontSize:13}}>{error}</Text>}
    {!!success&&<Text accessibilityLiveRegion="polite" style={{color:t.okText,fontSize:13}}>{success}</Text>}
   </ScrollView>
   </KeyboardAvoidingView>
  </SafeAreaView>
 </>;
}
