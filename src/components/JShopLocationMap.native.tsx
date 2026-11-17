import {Ionicons} from "@expo/vector-icons";
import Mapbox, {type Camera as CameraType} from "@rnmapbox/maps";
import {useEffect,useRef} from "react";
import {Pressable,Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {mapboxAccessToken,mapboxConfigured} from "../lib/mapbox-config";
import type {MapPoint} from "../lib/jshop-location-core";
import {JShopLocationMap as OriginalMap} from "./JShopLocationMap";

if(mapboxConfigured)Mapbox.setAccessToken(mapboxAccessToken);

/** Native Mapbox on the new APK. The previous tile map remains available until a public token is configured. */
export function JShopLocationMap({center,zoom,onCenter,onZoom}:{
 center:MapPoint;zoom:number;onCenter:(center:MapPoint)=>void;onZoom:(zoom:number)=>void;
}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const camera=useRef<CameraType>(null);
 const lastObserved=useRef({center,zoom});
 const ignoreIdleUntil=useRef(0);
 useEffect(()=>{
  if(!mapboxConfigured)return;
  const previous=lastObserved.current;
  const moved=Math.abs(center.lat-previous.center.lat)>0.00003||
   Math.abs(center.lon-previous.center.lon)>0.00003||Math.abs(zoom-previous.zoom)>0.02;
  if(!moved)return;
  ignoreIdleUntil.current=Date.now()+900;
  camera.current?.setCamera({centerCoordinate:[center.lon,center.lat],zoomLevel:zoom,animationDuration:500});
  lastObserved.current={center,zoom};
 },[center.lat,center.lon,zoom]);
 if(!mapboxConfigured)return <OriginalMap center={center} zoom={zoom} onCenter={onCenter} onZoom={onZoom}/>;
 return <View style={{width:"100%",height:246,overflow:"hidden",borderRadius:19,borderWidth:1,borderColor:t.line,backgroundColor:t.cream}}>
  <Mapbox.MapView style={{flex:1}} styleURL={Mapbox.StyleURL.Light} compassEnabled={false}
   scaleBarEnabled={false} logoEnabled attributionEnabled
   onMapIdle={state=>{
    if(Date.now()<ignoreIdleUntil.current)return;
    const coordinate=state.properties.center,newZoom=state.properties.zoom;
    if(!coordinate||!Number.isFinite(coordinate[0])||!Number.isFinite(coordinate[1])||!Number.isFinite(newZoom))return;
    const next={lat:coordinate[1],lon:coordinate[0]},previous=lastObserved.current;
    if(Math.abs(next.lat-previous.center.lat)<0.00004&&Math.abs(next.lon-previous.center.lon)<0.00004&&Math.abs(newZoom-previous.zoom)<0.02)return;
    lastObserved.current={center:next,zoom:newZoom};
    onCenter(next);
    if(Math.abs(newZoom-zoom)>0.02)onZoom(newZoom);
   }}>
   <Mapbox.Camera ref={camera} defaultSettings={{centerCoordinate:[center.lon,center.lat],zoomLevel:zoom}}
    minZoomLevel={2} maxZoomLevel={18}/>
  </Mapbox.MapView>
  <View pointerEvents="none" style={{position:"absolute",left:"50%",top:"50%",marginLeft:-15,marginTop:-32,alignItems:"center"}}>
   <Ionicons name="location" size={31} color={t.ink}/>
   <View style={{height:5,width:5,backgroundColor:t.yellow,borderRadius:3,marginTop:-17,marginBottom:14}}/>
  </View>
  <View style={{position:"absolute",top:9,right:9,gap:8}}>
   {([{label:"Acercar mapa",icon:"add",delta:1},{label:"Alejar mapa",icon:"remove",delta:-1}] as const).map(action=>
    <Pressable key={action.label} accessibilityRole="button" accessibilityLabel={action.label}
     onPress={()=>onZoom(Math.max(3,Math.min(17,Math.round(zoom)+action.delta)))}
     style={({pressed})=>({width:43,height:43,borderRadius:13,alignItems:"center",justifyContent:"center",
      backgroundColor:t.surface,borderWidth:1,borderColor:t.line,opacity:pressed?0.7:1})}>
     <Ionicons name={action.icon} size={24} color={t.ink}/>
    </Pressable>)}
  </View>
  <View pointerEvents="none" style={{position:"absolute",bottom:8,left:8,backgroundColor:t.surface,borderRadius:7,paddingHorizontal:7,paddingVertical:4}}>
   <Text style={{fontSize:10,color:t.ink2}}>Arrastra o amplía con dos dedos</Text>
  </View>
 </View>;
}
