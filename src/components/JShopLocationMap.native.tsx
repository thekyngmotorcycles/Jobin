import {Ionicons} from "@expo/vector-icons";
import Mapbox, {type Camera as CameraType} from "@rnmapbox/maps";
import {useEffect,useMemo,useRef,useState} from "react";
import {Pressable,Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {mapboxAccessToken,mapboxConfigured} from "../lib/mapbox-config";
import type {MapPoint} from "../lib/jshop-location-core";
import {geodesicCircle,type JShopRadiusMiles} from "../lib/jshop-geo";
import {JShopLocationMap as OriginalMap} from "./JShopLocationTileMap";

if(mapboxConfigured)Mapbox.setAccessToken(mapboxAccessToken);

/** Native Mapbox on the new APK. The previous tile map remains available until a public token is configured. */
export function JShopLocationMap({center,zoom,radiusMiles,showRadius=true,fluid=false,minimal=false,onCenter,onZoom,onViewport}:{
 center:MapPoint;zoom:number;radiusMiles:JShopRadiusMiles;showRadius?:boolean;fluid?:boolean;minimal?:boolean;
 onCenter:(center:MapPoint)=>void;onZoom:(zoom:number)=>void;
 onViewport?:(size:{width:number;height:number})=>void;
}){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const camera=useRef<CameraType>(null);
 const [mapSize,setMapSize]=useState({width:320,height:300});
 const circleSize=Math.max(50,Math.min(mapSize.width,mapSize.height)*0.70);
 const lastObserved=useRef({center,zoom});
 const ignoreIdleUntil=useRef(0);
 const searchArea=useMemo(()=>({type:"Feature" as const,properties:{radiusMiles},geometry:{
  type:"Polygon" as const,coordinates:[geodesicCircle(center,radiusMiles)]
 }}),[center.lat,center.lon,radiusMiles]);
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
 if(!mapboxConfigured)return <OriginalMap center={center} zoom={zoom} radiusMiles={radiusMiles} showRadius={showRadius} fluid={fluid} minimal={minimal} onCenter={onCenter} onZoom={onZoom} onViewport={onViewport}/>;
 return <View onLayout={event=>{const width=Math.round(event.nativeEvent.layout.width),height=Math.round(event.nativeEvent.layout.height);if(width>0&&height>0&&(width!==mapSize.width||height!==mapSize.height)){const next={width,height};setMapSize(next);onViewport?.(next);}}}
  style={{width:"100%",height:fluid?undefined:246,flex:fluid?1:undefined,minHeight:fluid?0:undefined,overflow:"hidden",borderRadius:19,borderWidth:1,borderColor:t.line,backgroundColor:t.cream}}>
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
   {showRadius&&!minimal&&<Mapbox.ShapeSource id="jshop-buy-radius" shape={searchArea}>
    <Mapbox.FillLayer id="jshop-buy-radius-fill" style={{fillColor:t.yellow,fillOpacity:0.17}}/>
    <Mapbox.LineLayer id="jshop-buy-radius-border" style={{lineColor:t.yellow,lineWidth:2.5,lineOpacity:0.9}}/>
   </Mapbox.ShapeSource>}
  </Mapbox.MapView>
  {showRadius&&minimal&&<View pointerEvents="none" style={{position:"absolute",left:"50%",top:"50%",width:circleSize,height:circleSize,borderWidth:2,borderColor:t.yellow,borderRadius:9999,backgroundColor:t.yellow+"27",transform:[{translateX:-circleSize/2},{translateY:-circleSize/2}]}}/>}
  <View pointerEvents="none" style={{position:"absolute",left:"50%",top:"50%",marginLeft:minimal?-9:-15,marginTop:minimal?-9:-32,alignItems:"center"}}>
   {minimal?<View style={{width:18,height:18,borderRadius:9,backgroundColor:t.surface,alignItems:"center",justifyContent:"center"}}><View style={{width:11,height:11,borderRadius:6,backgroundColor:t.ink,borderWidth:2,borderColor:t.yellow}}/></View>:<Ionicons name="location" size={31} color={t.ink}/>}
   {!minimal&&<View style={{height:5,width:5,backgroundColor:t.yellow,borderRadius:3,marginTop:-17,marginBottom:14}}/>}
  </View>
  <View style={{display:minimal?"none":"flex",position:"absolute",top:9,right:9,gap:8}}>
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
