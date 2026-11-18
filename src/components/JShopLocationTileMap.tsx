import {Ionicons} from "@expo/vector-icons";
import {useRef,useState} from "react";
import {Image,Linking,PanResponder,Platform,Pressable,Text,View} from "react-native";
import type {LayoutChangeEvent} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {pointToTile,moveMapPoint,tileSource,type MapPoint} from "../lib/jshop-location-core";
import {mapboxAccessToken,mapboxConfigured} from "../lib/mapbox-config";
import {type JShopRadiusMiles} from "../lib/jshop-geo";

/** OTA-compatible slippy-map: real OSM tiles, drag to pan and buttons to zoom. */
export function JShopLocationMap({center,zoom,radiusMiles,showRadius=true,fluid=false,minimal=false,onCenter,onZoom,onViewport}:{
 center:MapPoint;zoom:number;radiusMiles:JShopRadiusMiles;showRadius?:boolean;fluid?:boolean;minimal?:boolean;
 onCenter:(position:MapPoint)=>void;onZoom:(zoom:number)=>void;
 onViewport?:(size:{width:number;height:number})=>void;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [mapSize,setMapSize]=useState({width:320,height:246});
 const width=mapSize.width,height=mapSize.height;
 const circleSize=Math.max(50,Math.min(width,height)*0.70);
 const pinch=useRef({span:0,zoom:2});
 const latest=useRef({center,zoom,onCenter,onZoom});latest.current={center,zoom,onCenter,onZoom};
 const start=useRef(center);
 const pan=useRef(PanResponder.create({
  onStartShouldSetPanResponder:()=>true,
  onMoveShouldSetPanResponder:()=>true,
  onPanResponderGrant:event=>{start.current=latest.current.center;
   const ts=event.nativeEvent.touches;
   pinch.current={span:ts.length>=2?Math.hypot(ts[0].pageX-ts[1].pageX,ts[0].pageY-ts[1].pageY):0,zoom:latest.current.zoom};},
  onPanResponderMove:(event,gesture)=>{
   const ts=event.nativeEvent.touches;
   if(ts.length>=2){const span=Math.hypot(ts[0].pageX-ts[1].pageX,ts[0].pageY-ts[1].pageY);
    if(!pinch.current.span){pinch.current={span,zoom:latest.current.zoom};return;}
    const next=Math.max(2,Math.min(18,Math.round(pinch.current.zoom+Math.log2(span/pinch.current.span))));
    if(next!==Math.round(latest.current.zoom))latest.current.onZoom(next);return;}
   if(pinch.current.span){pinch.current.span=0;start.current=latest.current.center;return;}
   latest.current.onCenter(moveMapPoint(start.current,Math.round(latest.current.zoom),gesture.dx,gesture.dy));
  },
  onPanResponderRelease:()=>{pinch.current.span=0;}
 })).current;
 const tileZoom=Math.round(zoom);
 const tile=pointToTile(center,tileZoom),baseX=Math.floor(tile.x),baseY=Math.floor(tile.y);
 const xRadius=Math.ceil(width/512)+1,yRadius=Math.ceil(height/512)+1;
 const columns=Array.from({length:2*xRadius+1},(_,i)=>i-xRadius);
 const rows=Array.from({length:2*yRadius+1},(_,i)=>i-yRadius);
 const rendered=columns.flatMap(dx=>rows.map(dy=>{
  const x=baseX+dx,y=baseY+dy,osmUrl=tileSource(x,y,tileZoom);
  const n=2**tileZoom;
  const mapboxUrl=y<0||y>=n?null:`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/${tileZoom}/${((x%n)+n)%n}/${y}?access_token=${mapboxAccessToken}`;
  const url=mapboxConfigured?mapboxUrl:osmUrl;
  return url?{key:tileZoom+":"+x+":"+y,url,x,y}:null;
 })).filter((v):v is {key:string;url:string;x:number;y:number}=>v!==null);
 function onLayout(e:LayoutChangeEvent){
  const w=Math.round(e.nativeEvent.layout.width),h=Math.round(e.nativeEvent.layout.height);
  if(w>0&&h>0&&(w!==width||h!==height)){const next={width:w,height:h};setMapSize(next);onViewport?.(next);}
 }
 return <View onLayout={onLayout} style={{height:fluid?undefined:246,flex:fluid?1:undefined,minHeight:fluid?0:undefined,width:"100%",backgroundColor:t.cream,borderRadius:19,overflow:"hidden",borderWidth:1,borderColor:t.line}}>
  <View {...pan.panHandlers} style={{position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden"}}>
   {rendered.map(v=><Image key={v.key}
    source={{uri:v.url,cache:"default",...(Platform.OS==="web"?{}:{headers:{"User-Agent":"Jobeen/0.2.0 (JShop location selection; https://github.com/thekyngmotorcycles/Jobin)"}})}}
    accessibilityIgnoresInvertColors resizeMode="stretch"
    style={{position:"absolute",width:256,height:256,left:width/2+(v.x-tile.x)*256,top:height/2+(v.y-tile.y)*256}}/>)}
  </View>
  {showRadius&&!minimal&&<View pointerEvents="none" style={{position:"absolute",left:"50%",top:"50%",
   width:Math.max(2,2*radiusMiles*1609.344/(156543.0339*Math.max(0.04,Math.cos(center.lat*Math.PI/180))/2**zoom)),
   aspectRatio:1,transform:[{translateX:-Math.max(2,2*radiusMiles*1609.344/(156543.0339*Math.max(0.04,Math.cos(center.lat*Math.PI/180))/2**zoom))/2},
    {translateY:-Math.max(2,2*radiusMiles*1609.344/(156543.0339*Math.max(0.04,Math.cos(center.lat*Math.PI/180))/2**zoom))/2}],
   borderWidth:2,borderColor:t.yellow,borderRadius:9999,backgroundColor:t.yellow+"25"}}/>}
  {showRadius&&minimal&&<View pointerEvents="none" style={{position:"absolute",top:"50%",left:"50%",width:circleSize,height:circleSize,borderWidth:2,borderColor:t.yellow,backgroundColor:t.yellow+"27",borderRadius:9999,transform:[{translateX:-circleSize/2},{translateY:-circleSize/2}]}}/>}
  <View pointerEvents="none" style={{position:"absolute",top:"50%",left:"50%",marginLeft:minimal?-9:-16,marginTop:minimal?-9:-32,alignItems:"center"}}>
   {minimal?<View style={{width:18,height:18,borderRadius:9,backgroundColor:t.surface,alignItems:"center",justifyContent:"center"}}><View style={{width:11,height:11,borderRadius:6,backgroundColor:t.ink,borderWidth:2,borderColor:t.yellow}}/></View>:<Ionicons name="location" size={32} color={t.ink}/>}
   {!minimal&&<View style={{width:5,height:5,backgroundColor:t.yellow,borderRadius:3,marginTop:-17,marginBottom:14}}/>}
  </View>
  <View style={{display:minimal?"none":"flex",position:"absolute",right:9,top:9,gap:8}}>
   {([{label:"Acercar mapa",icon:"add",delta:1},{label:"Alejar mapa",icon:"remove",delta:-1}] as const).map(action=><Pressable
    key={action.label} accessibilityRole="button" accessibilityLabel={action.label} onPress={()=>onZoom(Math.max(3,Math.min(15,zoom+action.delta)))}
    style={({pressed})=>({width:43,height:43,alignItems:"center",justifyContent:"center",backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:13,opacity:pressed?0.7:1})}>
    <Ionicons name={action.icon} size={24} color={t.ink}/>
   </Pressable>)}
  </View>
  <View style={{position:"absolute",bottom:6,left:9,right:8,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:5}}>
   <View style={{display:minimal?"none":"flex",backgroundColor:t.surface,borderRadius:7,paddingHorizontal:7,paddingVertical:3}}>
    <Text style={{fontSize:10,color:t.ink2}}>Arrastra para mover el mapa</Text>
   </View>
   <Pressable accessibilityRole="link" accessibilityLabel={mapboxConfigured?"Créditos de Mapbox":"Créditos de OpenStreetMap"} onPress={()=>void Linking.openURL(mapboxConfigured?"https://www.mapbox.com/about/maps/":"https://www.openstreetmap.org/copyright")}
    style={{backgroundColor:t.surface,borderRadius:6,paddingHorizontal:5,paddingVertical:3}}>
    <Text style={{fontSize:9,color:t.ink2}}>{mapboxConfigured?"© Mapbox · © OSM":"© OpenStreetMap"}</Text>
   </Pressable>
  </View>
 </View>;
}
