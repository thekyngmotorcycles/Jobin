import {useEffect,useMemo,useRef,useState} from "react";
import {ActivityIndicator,Alert,Dimensions,FlatList,Image,PanResponder,Pressable,StyleSheet,Text,View} from "react-native";
import {useRouter} from "expo-router";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import {uploadPersonalJCardPhoto} from "../lib/personal-jcard-photo";

const SIZE=Math.min(Dimensions.get("window").width-40,360);
type Photo=MediaLibrary.Asset;
export default function PersonalAvatarEditor(){
 const router=useRouter();
 const [photos,setPhotos]=useState<Photo[]>([]);
 const [selected,setSelected]=useState<Photo|null>(null);
 const [permissionDenied,setPermissionDenied]=useState(false);
 const [busy,setBusy]=useState(false);
 const [zoom,setZoom]=useState(1);
 const [offset,setOffset]=useState({x:0,y:0});
 const [dimensions,setDimensions]=useState({width:SIZE,height:SIZE});
 const offsetRef=useRef(offset);offsetRef.current=offset;
 const pan=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderGrant:()=>{offsetRef.current=offset;},onPanResponderMove:(_,g)=>setOffset({x:offsetRef.current.x+g.dx,y:offsetRef.current.y+g.dy})}),[selected]);
 useEffect(()=>{let live=true;(async()=>{const p=await MediaLibrary.requestPermissionsAsync(false,["photo"]);if(!p.granted){if(live)setPermissionDenied(true);return;}const result=await MediaLibrary.getAssetsAsync({mediaType:"photo",first:80,sortBy:[["creationTime",false]]});if(live){setPhotos(result.assets);setSelected(result.assets[0]??null);}})().catch(e=>Alert.alert("Galería",String(e)));return()=>{live=false;};},[]);
 useEffect(()=>{if(!selected)return;setZoom(1);setOffset({x:0,y:0});Image.getSize(selected.uri,(width,height)=>setDimensions({width,height}),()=>setDimensions({width:SIZE,height:SIZE}));},[selected?.id]);
 const scale=Math.max(SIZE/dimensions.width,SIZE/dimensions.height)*zoom;
 const displayWidth=dimensions.width*scale,displayHeight=dimensions.height*scale;
 const maxX=Math.max(0,(displayWidth-SIZE)/2),maxY=Math.max(0,(displayHeight-SIZE)/2);
 const dx=Math.max(-maxX,Math.min(maxX,offset.x)),dy=Math.max(-maxY,Math.min(maxY,offset.y));
 async function save(){
  if(!selected||busy)return;setBusy(true);
  try{
   const info=await MediaLibrary.getAssetInfoAsync(selected);
   const uri=info.localUri??info.uri;
   const sourceW=info.width||dimensions.width,sourceH=info.height||dimensions.height;
   const factor=Math.max(SIZE/sourceW,SIZE/sourceH)*zoom;
   const cropSize=Math.floor(SIZE/factor);
   const originX=Math.max(0,Math.min(sourceW-cropSize,Math.round((sourceW-cropSize)/2-dx/factor)));
   const originY=Math.max(0,Math.min(sourceH-cropSize,Math.round((sourceH-cropSize)/2-dy/factor)));
   const context=ImageManipulator.ImageManipulator.manipulate(uri);
   context.crop({originX,originY,width:Math.min(cropSize,sourceW),height:Math.min(cropSize,sourceH)});
   context.resize({width:512,height:512});
   const rendered=await context.renderAsync();
   const result=await rendered.saveAsync({format:ImageManipulator.SaveFormat.JPEG,compress:0.75});
   await uploadPersonalJCardPhoto(result.uri,"image/jpeg");
   router.back();
  }catch(e){Alert.alert("No se pudo guardar",e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 return <View style={s.root}>
  <View style={s.top}><Pressable onPress={()=>router.back()}><Text style={s.action}>✕</Text></Pressable><Text style={s.heading}>Foto de JCard</Text><Pressable disabled={!selected||busy} onPress={()=>void save()}><Text style={s.save}>{busy?"Guardando":"Guardar"}</Text></Pressable></View>
  <View style={s.previewArea}>{selected?<View style={{width:SIZE,height:SIZE,borderRadius:SIZE/2,overflow:"hidden",backgroundColor:"#20252B"}} {...pan.panHandlers}><Image source={{uri:selected.uri}} style={{width:displayWidth,height:displayHeight,position:"absolute",left:(SIZE-displayWidth)/2+dx,top:(SIZE-displayHeight)/2+dy}} resizeMode="stretch"/></View>:<ActivityIndicator/>}</View>
  <View style={s.zoomRow}><Pressable onPress={()=>setZoom(z=>Math.max(1,+(z-0.1).toFixed(2)))}><Text style={s.action}>−</Text></Pressable><Text style={s.zoomLabel}>Zoom {Math.round(zoom*100)} %</Text><Pressable onPress={()=>setZoom(z=>Math.min(3,+(z+0.1).toFixed(2)))}><Text style={s.action}>＋</Text></Pressable></View>
  <Text style={s.subheading}>Recientes</Text>
  {permissionDenied?<Text style={s.message}>Habilita el acceso a las fotos en los permisos de Jobin.</Text>:<FlatList data={photos} numColumns={4} keyExtractor={p=>p.id} initialNumToRender={20} windowSize={5} renderItem={({item})=><Pressable style={s.cell} onPress={()=>setSelected(item)}><Image source={{uri:item.uri}} style={s.thumbnail}/>{selected?.id===item.id&&<View style={s.selected}/>}</Pressable>}/>}
 </View>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:"#0B0D10"},top:{height:68,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:20},heading:{color:"white",fontSize:17,fontWeight:"600"},action:{color:"white",fontSize:29},save:{color:"#B8C8FF",fontSize:17,fontWeight:"700"},previewArea:{flex:1,minHeight:220,alignItems:"center",justifyContent:"center"},zoomRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-around",paddingVertical:12},zoomLabel:{color:"white"},subheading:{color:"white",fontSize:20,fontWeight:"600",paddingHorizontal:18,paddingVertical:12},cell:{width:"25%",aspectRatio:1,padding:2},thumbnail:{width:"100%",height:"100%"},selected:{position:"absolute",inset:2,borderColor:"#B8C8FF",borderWidth:3},message:{color:"white",padding:18}});
