import {avatarEditorColors} from "../theme/jcard";
import {avatarEditorFrame,avatarEditorLayout,avatarEditorCrop} from "../lib/avatar-editor-geometry";
import {useEffect,useMemo,useRef,useState} from "react";
import {ActivityIndicator,Alert,Animated,Dimensions,FlatList,Image,PanResponder,Pressable,StyleSheet,Text,View} from "react-native";
import {useLocalSearchParams,useRouter} from "expo-router";
import {EMPTY_BUSINESS_CARD,writeScopedBusinessCard} from "../lib/business-card-cache";
import {readCloudBusiness,writeCloudBusiness} from "../lib/jcard-cloud";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
import {uploadBusinessPhoto} from "../lib/business-media";
import type {BusinessCardData} from "../lib/jcard";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import {uploadPersonalJCardPhoto} from "../lib/personal-jcard-photo";

const SIZE=Math.min(Dimensions.get("window").width-40,360);
type Photo=MediaLibrary.Asset;
export default function PersonalAvatarEditor(){
 const router=useRouter();
 const {target}=useLocalSearchParams<{target?:string}>();
 const businessAvatar=target==="business";
 const frame=useMemo(()=>avatarEditorFrame(SIZE,businessAvatar),[businessAvatar]);
 const previewExtent=frame.height+40;
 const insets=useSafeAreaInsets();
 const [photos,setPhotos]=useState<Photo[]>([]);
 const [albums,setAlbums]=useState<MediaLibrary.Album[]>([]);
 const [album,setAlbum]=useState<MediaLibrary.Album|null>(null);
 const [albumMenu,setAlbumMenu]=useState(false);
 const [galleryExpanded,setGalleryExpanded]=useState(false);
 const previewHeight=useRef(new Animated.Value(previewExtent)).current;
 const galleryExpandedRef=useRef(false);
 const dragStartHeight=useRef(previewExtent);
 function setGalleryOpen(open:boolean){galleryExpandedRef.current=open;setGalleryExpanded(open);setAlbumMenu(false);Animated.spring(previewHeight,{toValue:open?0:previewExtent,useNativeDriver:false,tension:90,friction:12}).start();}
 const galleryDrag=useMemo(()=>PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dy)>4,onPanResponderGrant:()=>{dragStartHeight.current=galleryExpandedRef.current?0:previewExtent;},onPanResponderMove:(_,g)=>{previewHeight.setValue(Math.max(0,Math.min(previewExtent,dragStartHeight.current+g.dy)));},onPanResponderRelease:(_,g)=>{setGalleryOpen(g.dy< -45?true:g.dy>45?false:galleryExpandedRef.current);},onPanResponderTerminate:()=>setGalleryOpen(galleryExpandedRef.current)}),[previewHeight,previewExtent]);
 const [loadingAlbum,setLoadingAlbum]=useState(false);
 const [selected,setSelected]=useState<Photo|null>(null);
 const [permissionDenied,setPermissionDenied]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState("");
 const [editorScope,setEditorScope]=useState<MessageScope|null>(null);
 const editorLive=useRef(false),saveGuard=useRef(false);
 useEffect(()=>{let live=true;editorLive.current=true;void captureMessageScope().then(scope=>{if(live)setEditorScope(scope);}).catch(()=>{});return()=>{live=false;editorLive.current=false;};},[]);
 const [zoom,setZoom]=useState(1);
 const [offset,setOffset]=useState({x:0,y:0});
 const dimensions=useMemo(()=>({width:selected?.width||SIZE,height:selected?.height||SIZE}),[selected?.width,selected?.height]);
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
    const {maxX,maxY}=avatarEditorLayout(frame,dimensions,nextZoom,{x:0,y:0});
    const nextX=gesture.current.x+((a.pageX+b.pageX)/2-gesture.current.centerX);
    const nextY=gesture.current.y+((a.pageY+b.pageY)/2-gesture.current.centerY);
    setOffset({x:Math.max(-maxX,Math.min(maxX,nextX)),y:Math.max(-maxY,Math.min(maxY,nextY))});
   }else if(touches.length===1){
    if(gesture.current.distance){
     gesture.current={x:offsetRef.current.x,y:offsetRef.current.y,zoom:zoomRef.current,distance:0,centerX:0,centerY:0};
     return;
    }
    const {maxX,maxY}=avatarEditorLayout(frame,dimensions,zoomRef.current,{x:0,y:0});
    setOffset({x:Math.max(-maxX,Math.min(maxX,gesture.current.x+g.dx)),y:Math.max(-maxY,Math.min(maxY,gesture.current.y+g.dy))});
   }
  }
 }),[dimensions.width,dimensions.height,selected?.id,frame]);
 useEffect(()=>{let live=true;(async()=>{const p=await MediaLibrary.requestPermissionsAsync(false,["photo"]);if(!p.granted){if(live)setPermissionDenied(true);return;}const result=await MediaLibrary.getAssetsAsync({mediaType:"photo",first:80,sortBy:[["creationTime",false]]});const folders=await MediaLibrary.getAlbumsAsync({includeSmartAlbums:true});if(live){setPhotos(result.assets);setAlbums(folders);setSelected(result.assets[0]??null);}})().catch(e=>Alert.alert("Galería",String(e)));return()=>{live=false;};},[]);
 useEffect(()=>{setZoom(1);setOffset({x:0,y:0});},[selected?.id,businessAvatar]);
 async function chooseAlbum(next:MediaLibrary.Album|null){
  setAlbumMenu(false);setLoadingAlbum(true);
  try{
   const result=await MediaLibrary.getAssetsAsync({album:next??undefined,mediaType:"photo",first:100,sortBy:[["creationTime",false]]});
   setAlbum(next);setPhotos(result.assets);setSelected(result.assets[0]??null);
  }catch(e){Alert.alert("No se pudo abrir la carpeta",e instanceof Error?e.message:String(e));}
  finally{setLoadingAlbum(false);}
 }
 const {displayWidth,displayHeight,dx,dy}=avatarEditorLayout(frame,dimensions,zoom,offset);
 function closeWithoutSaving(){
  if(busy)return;
  if(router.canGoBack())router.back();
  else router.replace("/professional");
 }
 async function save(){
  if(!selected||busy||!editorScope||saveGuard.current)return;saveGuard.current=true;setSaveError("");setBusy(true);
  try{
   const scope=editorScope,owner=scope.owner;
   await captureMessageScope(scope);
   if(!editorLive.current)return;
   // The gallery asset already provides its URI and dimensions. Reading full asset
   // metadata on Android can require ACCESS_MEDIA_LOCATION for EXIF GPS data,
   // which is unnecessary for cropping and saving a profile photograph.
   const uri=selected.uri;
   if(!selected.width||!selected.height)throw Error("No se pudo verificar el tamaño de la imagen.");
   const crop=avatarEditorCrop(frame,dimensions,zoom,offset);
   const context=ImageManipulator.ImageManipulator.manipulate(uri);
   context.crop(crop);
   context.resize(avatarEditorFrame(512,businessAvatar));
   const rendered=await context.renderAsync();
   const result=await rendered.saveAsync({format:ImageManipulator.SaveFormat.JPEG,compress:0.75,base64:true});
   await assertMessageScope(scope);
   if(!editorLive.current)return;
   if(businessAvatar){
    const photo={uri:result.uri,name:"business-avatar.jpg",mimeType:"image/jpeg",size:0};
    const uploaded=await uploadBusinessPhoto("business-profile-media",owner,photo,"avatar",scope);
    const current=await readCloudBusiness(owner,scope);
    if(!editorLive.current)return;
    const updated:BusinessCardData={...EMPTY_BUSINESS_CARD,...(current??{}),avatarUrl:uploaded.url};
    await writeCloudBusiness(updated,owner,scope);
    await writeScopedBusinessCard(owner,updated,scope);
   }else await uploadPersonalJCardPhoto(result.base64??"","image/jpeg",owner,scope);
   await assertMessageScope(scope);
   if(!editorLive.current)return;
   if(router.canGoBack())router.back();
   else router.replace("/professional");
  }catch(e){const detail=e instanceof Error?e.message:String(e);if(editorLive.current){setSaveError(detail);Alert.alert("No se pudo guardar",detail);}}finally{saveGuard.current=false;if(editorLive.current)setBusy(false);}
 }
 return <View style={s.root}>
  <View style={[s.top,{paddingTop:Math.max(insets.top,16),height:64+Math.max(insets.top,16)}]}><Pressable accessibilityRole="button" accessibilityLabel="Cerrar sin guardar" hitSlop={12} disabled={busy} onPress={closeWithoutSaving} style={s.closeButton}><Ionicons name="close" size={19} color={avatarEditorColors.text}/></Pressable><Pressable disabled={!selected||busy||!editorScope} onPress={()=>void save()}><Text style={s.save}>{busy?"Guardando":"Guardar"}</Text></Pressable></View>
  <Animated.View style={[s.previewArea,{height:previewHeight,overflow:"hidden",marginTop:0}]}>{selected?<View style={{width:frame.width,height:frame.height,borderRadius:Math.round(frame.width*0.18),overflow:"hidden",backgroundColor:avatarEditorColors.preview}} {...pan.panHandlers}><Image source={{uri:selected.uri}} style={{width:displayWidth,height:displayHeight,position:"absolute",left:(frame.width-displayWidth)/2+dx,top:(frame.height-displayHeight)/2+dy}} resizeMode="stretch"/><View pointerEvents="none" style={StyleSheet.absoluteFill}><View style={{position:"absolute",left:"33.333%",top:0,bottom:0,width:1,backgroundColor:avatarEditorColors.guide}}/><View style={{position:"absolute",left:"66.666%",top:0,bottom:0,width:1,backgroundColor:avatarEditorColors.guide}}/><View style={{position:"absolute",top:"33.333%",left:0,right:0,height:1,backgroundColor:avatarEditorColors.guide}}/><View style={{position:"absolute",top:"66.666%",left:0,right:0,height:1,backgroundColor:avatarEditorColors.guide}}/></View></View>:<ActivityIndicator/>}</Animated.View>
  {!!saveError&&<Text accessibilityLiveRegion="polite" style={s.message}>No se pudo guardar: {saveError}</Text>}
  <View style={s.galleryHeader}>
   <View {...galleryDrag.panHandlers} style={{position:"absolute",top:0,left:0,right:0,height:20,alignItems:"center",justifyContent:"center",zIndex:2}}><View style={{width:46,height:5,borderRadius:3,backgroundColor:avatarEditorColors.text,opacity:0.3}}/></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar carpeta de fotos" onPress={()=>setAlbumMenu(v=>!v)} style={s.albumButton}>
    <Text style={s.subheading}>{album?.title??"Recientes"}</Text><Ionicons name={albumMenu?"chevron-up":"chevron-down"} size={19} color={avatarEditorColors.text}/>
   </Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={galleryExpanded?"Reducir galería":"Expandir galería"} onPress={()=>setGalleryOpen(!galleryExpandedRef.current)} style={s.expandButton}>
    <Ionicons name={galleryExpanded?"chevron-down":"chevron-up"} size={23} color={avatarEditorColors.text}/>
   </Pressable>
  </View>
  {albumMenu&&<View style={s.albumMenu}>
   <FlatList data={[{id:"all",title:"Recientes"} as MediaLibrary.Album,...albums]} keyExtractor={a=>a.id} renderItem={({item})=><Pressable style={s.albumOption} onPress={()=>void chooseAlbum(item.id==="all"?null:item)}><Text style={s.albumText}>{item.title}</Text></Pressable>}/>
  </View>}
  {loadingAlbum?<ActivityIndicator/>:permissionDenied?<Text style={s.message}>Habilita el acceso a las fotos en los permisos de Jobin.</Text>:<FlatList style={s.galleryList} data={photos} numColumns={4} keyExtractor={p=>p.id} initialNumToRender={20} windowSize={5} renderItem={({item})=><Pressable style={s.cell} onPress={()=>{setSelected(item);setGalleryOpen(false);}}><Image source={{uri:item.uri}} style={s.thumbnail}/>{selected?.id===item.id&&<View style={s.selected}/>}</Pressable>}/>}
 </View>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:avatarEditorColors.background},top:{height:64,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:20,zIndex:10,elevation:10,backgroundColor:avatarEditorColors.background},closeButton:{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",shadowColor:avatarEditorColors.text,shadowOffset:{width:0,height:1},shadowOpacity:0.18,shadowRadius:2,elevation:2},save:{color:avatarEditorColors.accent,fontSize:17,fontWeight:"700",paddingVertical:10,paddingHorizontal:4},previewArea:{height:SIZE+28,marginTop:12,alignItems:"center",justifyContent:"center",zIndex:0},subheading:{color:avatarEditorColors.text,fontSize:20,fontWeight:"600"},galleryHeader:{minHeight:62,paddingTop:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:18},albumButton:{flexDirection:"row",alignItems:"center",gap:9,paddingVertical:12},expandButton:{padding:12},galleryList:{flex:1},albumMenu:{maxHeight:220,zIndex:20,elevation:8,backgroundColor:avatarEditorColors.background},albumOption:{paddingHorizontal:22,paddingVertical:13},albumText:{color:avatarEditorColors.text,fontSize:16},cell:{width:"25%",aspectRatio:1,padding:2},thumbnail:{width:"100%",height:"100%"},selected:{position:"absolute",inset:2,borderColor:avatarEditorColors.accent,borderWidth:3},message:{color:avatarEditorColors.text,padding:18}});
