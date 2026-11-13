import {avatarEditorColors} from "../theme/jcard";
import {useEffect,useMemo,useRef,useState} from "react";
import {ActivityIndicator,Alert,Dimensions,FlatList,Image,PanResponder,Pressable,StyleSheet,Text,View} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import {uploadPersonalJCardPhoto} from "../lib/personal-jcard-photo";

const SIZE=Math.min(Dimensions.get("window").width-40,360);
type Photo=MediaLibrary.Asset;
export default function PersonalAvatarEditor(){
 const router=useRouter();
 const insets=useSafeAreaInsets();
 const [photos,setPhotos]=useState<Photo[]>([]);
 const [albums,setAlbums]=useState<MediaLibrary.Album[]>([]);
 const [album,setAlbum]=useState<MediaLibrary.Album|null>(null);
 const [albumMenu,setAlbumMenu]=useState(false);
 const [galleryExpanded,setGalleryExpanded]=useState(false);
 const galleryTouchY=useRef<number|null>(null);
 const [loadingAlbum,setLoadingAlbum]=useState(false);
 const [selected,setSelected]=useState<Photo|null>(null);
 const [permissionDenied,setPermissionDenied]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState("");
 const [zoom,setZoom]=useState(1);
 const [offset,setOffset]=useState({x:0,y:0});
 const [dimensions,setDimensions]=useState({width:SIZE,height:SIZE});
 const offsetRef=useRef(offset);offsetRef.current=offset;
 const zoomRef=useRef(zoom);zoomRef.current=zoom;
 const gesture=useRef({x:0,y:0,zoom:1,distance:0,centerX:0,centerY:0});
 const pan=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>true,
  onMoveShouldSetPanResponder:()=>true,
  onPanResponderGrant:(event)=>{
   const touches=event.nativeEvent.touches;
   const a=touches[0],b=touches[1];
   gesture.current={x:offsetRef.current.x,y:offsetRef.current.y,zoom:zoomRef.current,
    distance:a&&b?Math.hypot(a.pageX-b.pageX,a.pageY-b.pageY):0,
    centerX:a&&b?(a.pageX+b.pageX)/2:0,centerY:a&&b?(a.pageY+b.pageY)/2:0};
  },
  onPanResponderMove:(event,g)=>{
   const touches=event.nativeEvent.touches;
   if(touches.length>=2){
    const [a,b]=touches;
    const distance=Math.hypot(a.pageX-b.pageX,a.pageY-b.pageY);
    if(!gesture.current.distance){
     gesture.current={x:offsetRef.current.x,y:offsetRef.current.y,zoom:zoomRef.current,
      distance,centerX:(a.pageX+b.pageX)/2,centerY:(a.pageY+b.pageY)/2};
     return;
    }
    const nextZoom=Math.max(1,Math.min(4,gesture.current.zoom*distance/gesture.current.distance));
    setZoom(nextZoom);
    const baseScale=Math.max(SIZE/dimensions.width,SIZE/dimensions.height);
    const maxX=Math.max(0,(dimensions.width*baseScale*nextZoom-SIZE)/2);
    const maxY=Math.max(0,(dimensions.height*baseScale*nextZoom-SIZE)/2);
    const nextX=gesture.current.x+((a.pageX+b.pageX)/2-gesture.current.centerX);
    const nextY=gesture.current.y+((a.pageY+b.pageY)/2-gesture.current.centerY);
    setOffset({x:Math.max(-maxX,Math.min(maxX,nextX)),y:Math.max(-maxY,Math.min(maxY,nextY))});
   }else if(touches.length===1){
    if(gesture.current.distance){
     gesture.current={x:offsetRef.current.x,y:offsetRef.current.y,zoom:zoomRef.current,distance:0,centerX:0,centerY:0};
     return;
    }
    const baseScale=Math.max(SIZE/dimensions.width,SIZE/dimensions.height);
    const maxX=Math.max(0,(dimensions.width*baseScale*zoomRef.current-SIZE)/2);
    const maxY=Math.max(0,(dimensions.height*baseScale*zoomRef.current-SIZE)/2);
    setOffset({x:Math.max(-maxX,Math.min(maxX,gesture.current.x+g.dx)),y:Math.max(-maxY,Math.min(maxY,gesture.current.y+g.dy))});
   }
  }
 }),[dimensions.width,dimensions.height,selected?.id]);
 useEffect(()=>{let live=true;(async()=>{const p=await MediaLibrary.requestPermissionsAsync(false,["photo"]);if(!p.granted){if(live)setPermissionDenied(true);return;}const result=await MediaLibrary.getAssetsAsync({mediaType:"photo",first:80,sortBy:[["creationTime",false]]});const folders=await MediaLibrary.getAlbumsAsync({includeSmartAlbums:true});if(live){setPhotos(result.assets);setAlbums(folders);setSelected(result.assets[0]??null);}})().catch(e=>Alert.alert("Galería",String(e)));return()=>{live=false;};},[]);
 useEffect(()=>{if(!selected)return;setZoom(1);setOffset({x:0,y:0});Image.getSize(selected.uri,(width,height)=>setDimensions({width,height}),()=>setDimensions({width:SIZE,height:SIZE}));},[selected?.id]);
 async function chooseAlbum(next:MediaLibrary.Album|null){
  setAlbumMenu(false);setLoadingAlbum(true);
  try{
   const result=await MediaLibrary.getAssetsAsync({album:next??undefined,mediaType:"photo",first:100,sortBy:[["creationTime",false]]});
   setAlbum(next);setPhotos(result.assets);setSelected(result.assets[0]??null);
  }catch(e){Alert.alert("No se pudo abrir la carpeta",e instanceof Error?e.message:String(e));}
  finally{setLoadingAlbum(false);}
 }
 const scale=Math.max(SIZE/dimensions.width,SIZE/dimensions.height)*zoom;
 const displayWidth=dimensions.width*scale,displayHeight=dimensions.height*scale;
 const maxX=Math.max(0,(displayWidth-SIZE)/2),maxY=Math.max(0,(displayHeight-SIZE)/2);
 const dx=Math.max(-maxX,Math.min(maxX,offset.x)),dy=Math.max(-maxY,Math.min(maxY,offset.y));
 function closeWithoutSaving(){
  if(busy)return;
  if(router.canGoBack())router.back();
  else router.replace("/professional");
 }
 async function save(){
  if(!selected||busy)return;setSaveError("");setBusy(true);
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
   const result=await rendered.saveAsync({format:ImageManipulator.SaveFormat.JPEG,compress:0.75,base64:true});
   await uploadPersonalJCardPhoto(result.base64??"","image/jpeg");
   if(router.canGoBack())router.back();
   else router.replace("/professional");
  }catch(e){const detail=e instanceof Error?e.message:String(e);setSaveError(detail);Alert.alert("No se pudo guardar",detail);}finally{setBusy(false);}
 }
 return <View style={s.root}>
  <View style={[s.top,{paddingTop:Math.max(insets.top,16),height:64+Math.max(insets.top,16)}]}><Pressable accessibilityRole="button" accessibilityLabel="Cerrar sin guardar" hitSlop={12} disabled={busy} onPress={closeWithoutSaving} style={s.closeButton}><Ionicons name="close" size={19} color={avatarEditorColors.text}/></Pressable><Pressable disabled={!selected||busy} onPress={()=>void save()}><Text style={s.save}>{busy?"Guardando":"Guardar"}</Text></Pressable></View>
  {!galleryExpanded&&<View style={s.previewArea}>{selected?<View style={{width:SIZE,height:SIZE,borderRadius:SIZE/2,overflow:"hidden",backgroundColor:avatarEditorColors.preview}} {...pan.panHandlers}><Image source={{uri:selected.uri}} style={{width:displayWidth,height:displayHeight,position:"absolute",left:(SIZE-displayWidth)/2+dx,top:(SIZE-displayHeight)/2+dy}} resizeMode="stretch"/></View>:<ActivityIndicator/>}</View>}
  {!!saveError&&<Text accessibilityLiveRegion="polite" style={s.message}>No se pudo guardar: {saveError}</Text>}
  <View style={s.galleryHeader} onTouchStart={e=>{galleryTouchY.current=e.nativeEvent.pageY;}} onTouchEnd={e=>{if(galleryTouchY.current===null)return;const dy=e.nativeEvent.pageY-galleryTouchY.current;galleryTouchY.current=null;if(dy< -45){setGalleryExpanded(true);setAlbumMenu(false);}else if(dy>45){setGalleryExpanded(false);setAlbumMenu(false);}}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar carpeta de fotos" onPress={()=>setAlbumMenu(v=>!v)} style={s.albumButton}>
    <Text style={s.subheading}>{album?.title??"Recientes"}</Text><Ionicons name={albumMenu?"chevron-up":"chevron-down"} size={19} color={avatarEditorColors.text}/>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={galleryExpanded?"Reducir galería":"Expandir galería"} onPress={()=>{setGalleryExpanded(v=>!v);setAlbumMenu(false);}} style={s.expandButton}>
    <Ionicons name={galleryExpanded?"chevron-down":"chevron-up"} size={23} color={avatarEditorColors.text}/>
   </Pressable>
  </View>
  {albumMenu&&<View style={s.albumMenu}>
   <FlatList data={[{id:"all",title:"Recientes"} as MediaLibrary.Album,...albums]} keyExtractor={a=>a.id} renderItem={({item})=><Pressable style={s.albumOption} onPress={()=>void chooseAlbum(item.id==="all"?null:item)}><Text style={s.albumText}>{item.title}</Text></Pressable>}/>
  </View>}
  {loadingAlbum?<ActivityIndicator/>:permissionDenied?<Text style={s.message}>Habilita el acceso a las fotos en los permisos de Jobin.</Text>:<FlatList style={s.galleryList} data={photos} numColumns={4} keyExtractor={p=>p.id} initialNumToRender={20} windowSize={5} renderItem={({item})=><Pressable style={s.cell} onPress={()=>{setSelected(item);setGalleryExpanded(false);}}><Image source={{uri:item.uri}} style={s.thumbnail}/>{selected?.id===item.id&&<View style={s.selected}/>}</Pressable>}/>}
 </View>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:avatarEditorColors.background},top:{height:64,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:20,zIndex:10,elevation:10,backgroundColor:avatarEditorColors.background},closeButton:{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",shadowColor:avatarEditorColors.text,shadowOffset:{width:0,height:1},shadowOpacity:0.18,shadowRadius:2,elevation:2},save:{color:avatarEditorColors.accent,fontSize:17,fontWeight:"700",paddingVertical:10,paddingHorizontal:4},previewArea:{height:SIZE+28,marginTop:12,alignItems:"center",justifyContent:"center",zIndex:0},subheading:{color:avatarEditorColors.text,fontSize:20,fontWeight:"600"},galleryHeader:{minHeight:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:18},albumButton:{flexDirection:"row",alignItems:"center",gap:9,paddingVertical:12},expandButton:{padding:12},galleryList:{flex:1},albumMenu:{maxHeight:220,zIndex:20,elevation:8,backgroundColor:avatarEditorColors.background},albumOption:{paddingHorizontal:22,paddingVertical:13},albumText:{color:avatarEditorColors.text,fontSize:16},cell:{width:"25%",aspectRatio:1,padding:2},thumbnail:{width:"100%",height:"100%"},selected:{position:"absolute",inset:2,borderColor:avatarEditorColors.accent,borderWidth:3},message:{color:avatarEditorColors.text,padding:18}});
