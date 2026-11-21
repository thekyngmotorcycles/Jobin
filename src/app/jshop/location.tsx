import {Ionicons} from "@expo/vector-icons";
import {router,Stack} from "expo-router";
import {useEffect,useRef,useState} from "react";
import * as Location from "expo-location";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {JShopLocationMap} from "../../components/JShopLocationMap";
import {confirmJShopPlace,findJShopPlaces,placeAtMapCenter} from "../../lib/jshop-geocode";
import {mapboxConfigured} from "../../lib/mapbox-config";
import {readJShopLocation,readRecentJShopLocations,saveJShopLocation} from "../../lib/jshop-location";
import {jshopAccountId} from "../../lib/jshop-local";
import {mapRadiusForViewport,mapZoomForRadius} from "../../lib/jshop-geo";
import type {JShopPlace,MapPoint} from "../../lib/jshop-location-core";
import {useTheme} from "../../state/ThemeProvider";
import {jobeenTokens} from "../../theme/jobeen";
import {jobeenModalTokens} from "../../theme/modals";
import {JOBEEN_TYPE} from "../../theme/typography";
type MapSize={width:number;height:number};
export default function JShopLocationPicker(){
 const {theme}=useTheme(),t=jobeenTokens(theme),modal=jobeenModalTokens(theme),insets=useSafeAreaInsets();
 const [owner,setOwner]=useState("guest"),[chosen,setChosen]=useState<JShopPlace|null>(null);
 const [center,setCenter]=useState<MapPoint>({lat:0,lon:-25}),[zoom,setZoom]=useState(2);
 const [viewport,setViewport]=useState<MapSize>({width:320,height:300});
 const [moved,setMoved]=useState(false),[query,setQuery]=useState(""),[typing,setTyping]=useState(false);
 const [matches,setMatches]=useState<JShopPlace[]>([]),[searching,setSearching]=useState(false);
 const [busy,setBusy]=useState(false),[locating,setLocating]=useState(false),[error,setError]=useState(""),[initializing,setInitializing]=useState(true);
 const input=useRef<TextInput>(null),searchSeq=useRef(0),manualChoice=useRef(false),gpsRequest=useRef(0);
 const radiusMiles=mapRadiusForViewport(center,zoom,viewport.width,viewport.height);
 /** A persisted buying area always wins. GPS is automatic only after a prior OS permission. */
 useEffect(()=>{let active=true;void(async()=>{
  try{
   const id=await jshopAccountId().catch(()=>"guest");
   const [saved,recent]=await Promise.all([readJShopLocation(id),readRecentJShopLocations(id)]);
   if(!active)return;
   setOwner(id);
   const place=saved??recent[0]??null;
   if(place){
    setChosen(place);setCenter({lat:place.lat,lon:place.lon});
    setZoom(place.zoom>2?place.zoom:mapZoomForRadius(place,place.radiusMiles??10,300));
    setQuery(place.label);
   }else{
    // Checking an existing permission does not display the system permission prompt.
    void(async()=>{
     try{
      const permission=await Location.getForegroundPermissionsAsync();
      if(!active||manualChoice.current||!permission.granted)return;
      const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      if(!active||manualChoice.current)return;
      setCenter({lat:position.coords.latitude,lon:position.coords.longitude});
      setZoom(11);setMoved(true);setChosen(null);setTyping(false);setQuery("");
     }catch{/* The user can still search by city or move the map manually. */}
    })();
   }
  }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo abrir la ubicación.");}
  finally{if(active)setInitializing(false);}
 })();return()=>{active=false;};},[]);
 /** Use device position only on explicit tap when foreground access is not yet granted. */
 async function centerOnDevice(){
  if(locating||busy)return;
  manualChoice.current=true;
  const request=++gpsRequest.current;
  setLocating(true);setError("");
  try{
   let permission=await Location.getForegroundPermissionsAsync();
   if(!permission.granted)permission=await Location.requestForegroundPermissionsAsync();
   if(!permission.granted)throw new Error("No se autorizó la ubicación. Puedes elegir una ciudad manualmente o habilitarla en los ajustes del teléfono.");
   if(!await Location.hasServicesEnabledAsync())throw new Error("Activá la ubicación del teléfono e intentá nuevamente.");
   const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
   if(request!==gpsRequest.current)return;
   const {latitude,longitude}=position.coords;
   if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw Error("No se pudo obtener la posición del dispositivo.");
   input.current?.blur();
   setCenter({lat:latitude,lon:longitude});setZoom(11);
   setChosen(null);setMoved(true);setTyping(false);setMatches([]);setQuery("");setError("");
  }catch(e){if(request===gpsRequest.current)setError(e instanceof Error?e.message:"No se pudo obtener tu ubicación. Puedes buscar una ciudad manualmente.");}
  finally{if(request===gpsRequest.current)setLocating(false);}
 }
 useEffect(()=>{
  if(!typing||query.trim().length<(mapboxConfigured?3:2)){setMatches([]);return;}
  let active=true;const n=++searchSeq.current;
  const timer=setTimeout(()=>{void(async()=>{
   setSearching(true);
   try{const found=await findJShopPlaces(query);
    if(active&&n===searchSeq.current){setMatches(found.slice(0,5));setError("");}}
   catch(e){if(active&&n===searchSeq.current)setError(e instanceof Error?e.message:"No se encontraron sugerencias.");}
   finally{if(active&&n===searchSeq.current)setSearching(false);}
  })();},420);
  return()=>{active=false;clearTimeout(timer);};
 },[query,typing]);
 function choose(place:JShopPlace){
  manualChoice.current=true;gpsRequest.current++;input.current?.blur();setChosen(place);setMoved(false);setTyping(false);setMatches([]);
  setCenter({lat:place.lat,lon:place.lon});setZoom(mapZoomForRadius(place,10,Math.max(200,viewport.height)));
  setQuery(place.label);setError("");
 }
 function moveCenter(point:MapPoint){
  if(Math.abs(point.lat-center.lat)<0.00004&&Math.abs(point.lon-center.lon)<0.00004)return;
  manualChoice.current=true;gpsRequest.current++;input.current?.blur();setCenter(point);setChosen(null);setMoved(true);setTyping(false);setMatches([]);setError("");
 }
 async function submitSearch(){
  if(searching||busy||query.trim().length<2)return;
  setSearching(true);setError("");
  try{const found=await findJShopPlaces(query);
   if(found.length)choose(found[0]);
   else setError("No encontramos esa ubicación. Prueba ciudad, estado y país.");}
  catch(e){setError(e instanceof Error?e.message:"No se pudo buscar la ubicación.");}
  finally{setSearching(false);}
 }
 async function apply(){
  if(busy||typing||(!chosen&&!moved))return;
  setBusy(true);setError("");
  try{const place=chosen??(mapboxConfigured?{city:"",label:"",lat:center.lat,lon:center.lon,zoom}:await placeAtMapCenter(center.lat,center.lon));
   const confirmed=await confirmJShopPlace({...place,lat:center.lat,lon:center.lon,zoom});
   await saveJShopLocation(owner,{...confirmed,lat:center.lat,lon:center.lon,zoom,radiusMiles});
   router.back();}
  catch(e){setError(e instanceof Error?e.message:"No se pudo guardar la zona de búsqueda.");}
  finally{setBusy(false);}
 }
 const ready=!typing&&(!!chosen||moved);
 return <>
  <Stack.Screen options={{headerShown:false,presentation:"transparentModal",animation:"slide_from_bottom"}}/>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined}
   style={{flex:1,backgroundColor:modal.scrim,justifyContent:"flex-end"}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sin guardar" onPress={()=>router.back()} style={{flex:1}}/>
   <View accessibilityViewIsModal style={{height:"96%",backgroundColor:modal.surface,borderTopLeftRadius:modal.radius.sheet,
    borderTopRightRadius:modal.radius.sheet,overflow:"hidden",paddingBottom:Math.max(10,insets.bottom)}}>
    <View style={{width:40,height:5,borderRadius:3,alignSelf:"center",backgroundColor:t.line,marginTop:9,marginBottom:5}}/>
    <View style={{paddingHorizontal:16,paddingBottom:5,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
     <Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.modalTitle,fontWeight:"800",color:modal.text}}>Ubicación</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>router.back()}
      style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="close" size={24} color={t.ink}/>
     </Pressable>
    </View>
    <View style={{paddingHorizontal:14,paddingBottom:9}}>
     <View style={{height:48,borderRadius:16,backgroundColor:t.surface,borderColor:t.line,borderWidth:1,
      flexDirection:"row",alignItems:"center",paddingHorizontal:12,gap:9}}>
      <Ionicons name="search-outline" size={20} color={t.ink2}/>
      <TextInput ref={input} accessibilityLabel="Buscar ubicación" value={query}
       onChangeText={value=>{manualChoice.current=true;gpsRequest.current++;setTyping(true);setQuery(value);setChosen(null);
        setMoved(false);setMatches([]);setError("");}}
       onSubmitEditing={()=>void submitSearch()} returnKeyType="search"
       placeholder="Buscar ciudad o zona" placeholderTextColor={t.ink2}
       style={{flex:1,minHeight:44,color:t.ink,fontSize:14}}/>
      {searching&&<ActivityIndicator size="small" color={t.ink2}/>}
      {!!query&&typing&&<Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda"
       onPress={()=>{setQuery("");setMatches([]);input.current?.focus();}}
       style={{padding:4}}><Ionicons name="close-circle" size={19} color={t.ink2}/></Pressable>}
     </View>
    </View>
    <View style={{flex:1,minHeight:0,paddingHorizontal:12}}>
     <JShopLocationMap center={center} zoom={zoom} radiusMiles={radiusMiles}
      fluid minimal onCenter={moveCenter} onZoom={setZoom} onViewport={setViewport}/>
     <Pressable accessibilityRole="button" accessibilityLabel="Usar mi ubicación actual"
      accessibilityHint="Centra el mapa en la ubicación aproximada del teléfono"
      disabled={locating||busy||initializing} onPress={()=>void centerOnDevice()}
      style={({pressed})=>({position:"absolute",top:12,right:24,width:46,height:46,borderRadius:15,
       alignItems:"center",justifyContent:"center",backgroundColor:t.surface,
       borderWidth:1,borderColor:t.line,opacity:locating||busy||initializing?0.6:pressed?0.7:1,
       elevation:3,shadowColor:t.ink,shadowOpacity:0.12,shadowRadius:4,shadowOffset:{width:0,height:2}})}>
      {locating?<ActivityIndicator size="small" color={t.ink}/>:<Ionicons name="navigate-outline" size={23} color={t.ink}/>}
     </Pressable>
     {typing&&matches.length>0&&<View style={{position:"absolute",top:0,left:12,right:12,zIndex:10,
      maxHeight:230,backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:16,overflow:"hidden"}}>
      <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
       {matches.map((place,index)=><Pressable key={place.label+"-"+index} accessibilityRole="button"
        accessibilityLabel={"Seleccionar "+place.label} onPress={()=>choose(place)}
        style={{minHeight:48,paddingHorizontal:12,paddingVertical:9,flexDirection:"row",alignItems:"center",gap:9}}>
        <Ionicons name="location-outline" color={t.ink2} size={19}/>
        <Text numberOfLines={2} style={{flex:1,color:t.ink,fontSize:13}}>{place.label}</Text>
       </Pressable>)}
      </ScrollView>
     </View>}
    </View>
    {!!error&&<Text accessibilityLiveRegion="polite" numberOfLines={2} style={{color:t.ink2,
     fontSize:12,paddingHorizontal:16,paddingTop:7}}>{error}</Text>}
    <View style={{paddingHorizontal:14,paddingTop:11,paddingBottom:2}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Aplicar ubicación de búsqueda"
      disabled={!ready||busy||initializing} onPress={()=>void apply()}
      style={({pressed})=>({minHeight:50,borderRadius:16,backgroundColor:t.ink,alignItems:"center",
       justifyContent:"center",opacity:!ready||busy||initializing?0.45:pressed?0.75:1})}>
      <Text style={{fontSize:16,color:t.bg,fontWeight:"800"}}>{busy?"Guardando...":"Aplicar"}</Text>
     </Pressable>
    </View>
   </View>
  </KeyboardAvoidingView>
 </>;
}
