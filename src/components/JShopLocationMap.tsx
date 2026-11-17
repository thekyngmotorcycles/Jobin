import {Ionicons} from "@expo/vector-icons";
import {useRef,useState} from "react";
import {Image,Linking,PanResponder,Platform,Pressable,Text,View} from "react-native";
import type {LayoutChangeEvent} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {pointToTile,moveMapPoint,tileSource,type MapPoint} from "../lib/jshop-location-core";

/** OTA-compatible slippy-map: real OSM tiles, drag to pan and buttons to zoom. */
export function JShopLocationMap({center,zoom,onCenter,onZoom}:{
 center:MapPoint;zoom:number;onCenter:(position:MapPoint)=>void;onZoom:(zoom:number)=>void;
}){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const [width,setWidth]=useState(320);
 const height=246;
 const latest=useRef({center,zoom,onCenter});latest.current={center,zoom,onCenter};
 const start=useRef(center);
 const pan=useRef(PanResponder.create({
  onStartShouldSetPanResponder:()=>true,
  onMoveShouldSetPanResponder:(_,gesture)=>Math.abs(gesture.dx)>2||Math.abs(gesture.dy)>2,
  onPanResponderGrant:()=>{start.current=latest.current.center;},
  onPanResponderMove:(_,gesture)=>{
   latest.current.onCenter(moveMapPoint(start.current,latest.current.zoom,gesture.dx,gesture.dy));
  }
 })).current;
 const tile=pointToTile(center,zoom),baseX=Math.floor(tile.x),baseY=Math.floor(tile.y);
 const columns=width>470?[-2,-1,0,1,2]:[-1,0,1];
 const rendered=columns.flatMap(dx=>[-1,0,1].map(dy=>{
  const x=baseX+dx,y=baseY+dy,url=tileSource(x,y,zoom);
  return url?{key:zoom+":"+x+":"+y,url,x,y}:null;
 })).filter((v):v is {key:string;url:string;x:number;y:number}=>v!==null);
 function onLayout(e:LayoutChangeEvent){
  const w=Math.round(e.nativeEvent.layout.width);
  if(w>0&&w!==width)setWidth(w);
 }
 return <View onLayout={onLayout} style={{height,width:"100%",backgroundColor:t.cream,borderRadius:19,overflow:"hidden",borderWidth:1,borderColor:t.line}}>
  <View {...pan.panHandlers} style={{position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden"}}>
   {rendered.map(v=><Image key={v.key}
    source={{uri:v.url,cache:"force-cache",...(Platform.OS==="web"?{}:{headers:{"User-Agent":"Jobeen/0.2.0 (JShop location selection; https://github.com/thekyngmotorcycles/Jobin)"}})}}
    accessibilityIgnoresInvertColors resizeMode="stretch"
    style={{position:"absolute",width:256,height:256,left:width/2+(v.x-tile.x)*256,top:height/2+(v.y-tile.y)*256}}/>)}
  </View>
  <View pointerEvents="none" style={{position:"absolute",top:"50%",left:"50%",marginLeft:-16,marginTop:-32,alignItems:"center"}}>
   <Ionicons name="location" size={32} color={t.ink}/>
   <View style={{width:5,height:5,backgroundColor:t.yellow,borderRadius:3,marginTop:-17,marginBottom:14}}/>
  </View>
  <View style={{position:"absolute",right:9,top:9,gap:8}}>
   {([{label:"Acercar mapa",icon:"add",delta:1},{label:"Alejar mapa",icon:"remove",delta:-1}] as const).map(action=><Pressable
    key={action.label} accessibilityRole="button" accessibilityLabel={action.label} onPress={()=>onZoom(Math.max(3,Math.min(15,zoom+action.delta)))}
    style={({pressed})=>({width:43,height:43,alignItems:"center",justifyContent:"center",backgroundColor:t.surface,borderWidth:1,borderColor:t.line,borderRadius:13,opacity:pressed?0.7:1})}>
    <Ionicons name={action.icon} size={24} color={t.ink}/>
   </Pressable>)}
  </View>
  <View style={{position:"absolute",bottom:6,left:9,right:8,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:5}}>
   <View style={{backgroundColor:t.surface,borderRadius:7,paddingHorizontal:7,paddingVertical:3}}>
    <Text style={{fontSize:10,color:t.ink2}}>Arrastra para mover el mapa</Text>
   </View>
   <Pressable accessibilityRole="link" accessibilityLabel="Créditos de OpenStreetMap" onPress={()=>void Linking.openURL("https://www.openstreetmap.org/copyright")}
    style={{backgroundColor:t.surface,borderRadius:6,paddingHorizontal:5,paddingVertical:3}}>
    <Text style={{fontSize:9,color:t.ink2}}>© OpenStreetMap</Text>
   </Pressable>
  </View>
 </View>;
}
