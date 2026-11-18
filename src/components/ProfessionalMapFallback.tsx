import {Pressable,View,Text} from "react-native";
import type {DiscoveredProfile} from "../lib/map-discovery";
import type {MapPoint} from "../lib/jshop-location-core";
import {pointToTile} from "../lib/jshop-location-core";
import {JShopLocationMap} from "./JShopLocationMap";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
type Props={center:MapPoint;zoom:number;profiles:DiscoveredProfile[];onMove:(point:MapPoint)=>void;onSelect:(id:string)=>void};
export function ProfessionalMapFallback({center,zoom,profiles,onMove,onSelect}:Props){
 const {theme}=useTheme(),t=jobeenTokens(theme);
 const size={width:360,height:520};
 const base=pointToTile(center,Math.round(zoom));
 const pins=profiles.map(p=>{
  const tile=pointToTile({lat:p.latitude,lon:p.longitude},Math.round(zoom));
  const dx=(tile.x-base.x)*256,dy=(tile.y-base.y)*256;
  return {...p,x:size.width/2+dx,y:size.height/2+dy};
 }).filter(p=>p.x>12&&p.x<size.width-12&&p.y>15&&p.y<size.height-15);
 return <View style={{flex:1,minHeight:300,overflow:"hidden"}} onLayout={()=>{}}>
  <JShopLocationMap center={center} zoom={zoom} radiusMiles={10} showRadius={false} fluid onCenter={onMove} onZoom={()=>{}}/>
  <View pointerEvents="box-none" style={{position:"absolute",left:0,right:0,top:0,bottom:0}}>
   {pins.map(p=><Pressable key={p.id} accessibilityRole="button" accessibilityLabel={"Ver "+p.name}
    onPress={()=>onSelect(p.id)}
    style={{position:"absolute",left:p.x-15,top:p.y-15,width:32,height:32,borderRadius:16,backgroundColor:p.kind==="company"?t.ink:t.yellow,
     borderWidth:2,borderColor:t.surface,alignItems:"center",justifyContent:"center"}}>
    <Text style={{fontWeight:"800",color:p.kind==="company"?t.surface:t.ink,fontSize:11}}>{p.kind==="company"?"E":"P"}</Text>
   </Pressable>)}
  </View>
 </View>;
}
