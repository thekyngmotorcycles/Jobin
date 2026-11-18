import Mapbox,{type Camera as CameraType} from "@rnmapbox/maps";
import {useEffect,useMemo,useRef} from "react";
import {View} from "react-native";
import type {DiscoveredProfile} from "../lib/map-discovery";
import type {MapPoint} from "../lib/jshop-location-core";
import {mapboxAccessToken,mapboxConfigured} from "../lib/mapbox-config";
import {jobeenTokens} from "../theme/jobeen";
import {useTheme} from "../state/ThemeProvider";
import {ProfessionalMapFallback as TileFallback} from "./ProfessionalMapFallback";

if(mapboxConfigured)Mapbox.setAccessToken(mapboxAccessToken);
type Props={center:MapPoint;zoom:number;profiles:DiscoveredProfile[];onMove:(point:MapPoint)=>void;onSelect:(id:string)=>void};
export function ProfessionalMap({center,zoom,profiles,onMove,onSelect}:Props){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const camera=useRef<CameraType>(null);
 const previous=useRef({center,zoom});
 const ignoreUntil=useRef(0);
 const shape=useMemo(()=>({type:"FeatureCollection" as const,
  features:profiles.map(p=>({type:"Feature" as const,
   properties:{id:p.id,kind:p.kind},geometry:{type:"Point" as const,coordinates:[p.longitude,p.latitude]}}))
 }),[profiles]);
 useEffect(()=>{
  const old=previous.current;
  if(Math.abs(old.center.lat-center.lat)<0.0001&&Math.abs(old.center.lon-center.lon)<0.0001&&Math.abs(old.zoom-zoom)<0.05)return;
  previous.current={center,zoom};ignoreUntil.current=Date.now()+700;
  camera.current?.setCamera({centerCoordinate:[center.lon,center.lat],zoomLevel:zoom,animationDuration:450});
 },[center.lat,center.lon,zoom]);
 if(!mapboxConfigured)return <TileFallback center={center} zoom={zoom} profiles={profiles} onMove={onMove} onSelect={onSelect}/>;
 return <View style={{flex:1,minHeight:0,overflow:"hidden"}}>
  <Mapbox.MapView style={{flex:1}} styleURL={Mapbox.StyleURL.Light} compassEnabled
   scaleBarEnabled={false} logoEnabled attributionEnabled
   onMapIdle={state=>{
    if(Date.now()<ignoreUntil.current)return;
    const point=state.properties.center;
    if(!point||!Number.isFinite(point[0])||!Number.isFinite(point[1]))return;
    if(Math.abs(point[0]-previous.current.center.lon)<0.00005&&Math.abs(point[1]-previous.current.center.lat)<0.00005)return;
    previous.current={center:{lat:point[1],lon:point[0]},zoom:state.properties.zoom};
    onMove({lat:point[1],lon:point[0]});
   }}>
   <Mapbox.Camera ref={camera} defaultSettings={{centerCoordinate:[center.lon,center.lat],zoomLevel:zoom}} minZoomLevel={2} maxZoomLevel={18}/>
   <Mapbox.ShapeSource id="jobeen-discovery-pins" shape={shape} cluster clusterRadius={48}
    onPress={event=>{
     const pin=event.features?.[0];
     if(!pin)return;
     const properties=pin.properties??{};
     if(properties.cluster){
      const coords=pin.geometry?.type==="Point"?pin.geometry.coordinates:null;
      if(coords&&coords.length>=2)camera.current?.setCamera({centerCoordinate:[coords[0],coords[1]],zoomLevel:Math.min(17,zoom+2),animationDuration:400});
     }else if(typeof properties.id==="string")onSelect(properties.id);
    }}>
    <Mapbox.CircleLayer id="discovery-clusters" filter={["has","point_count"]}
     style={{circleColor:t.ink,circleRadius:22,circleStrokeColor:t.yellow,circleStrokeWidth:3}}/>
    <Mapbox.SymbolLayer id="discovery-cluster-count" filter={["has","point_count"]}
     style={{textField:["get","point_count_abbreviated"],textColor:t.surface,textSize:12,textAllowOverlap:true}}/>
    <Mapbox.CircleLayer id="discovery-places" filter={["!",["has","point_count"]]}
     style={{circleColor:["match",["get","kind"],"company",t.ink,t.yellow],circleRadius:11,
      circleStrokeColor:t.surface,circleStrokeWidth:3,circleOpacity:1}}/>
   </Mapbox.ShapeSource>
  </Mapbox.MapView>
 </View>;
}
