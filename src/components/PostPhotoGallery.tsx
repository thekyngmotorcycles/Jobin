import {useCallback,useEffect,useRef,useState} from "react";
import {Image,Modal,Pressable,Text,View,useWindowDimensions} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Gesture,GestureDetector,GestureHandlerRootView} from "react-native-gesture-handler";
import Animated,{runOnJS,useAnimatedStyle,useSharedValue} from "react-native-reanimated";
import {feedPhotoTiles,FEED_VISIBLE_PHOTOS} from "../lib/feed-photo-layout";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../lib/message-session";
import {watchAttachmentScope} from "../lib/private-attachment-android";
import {useUi} from "./ui";

type Props={photos:string[];altTexts?:string[];author:string;active?:boolean;viewer?:string;allowOpen?:boolean};

function ZoomPhoto({uri,label,onStep}:{uri:string;label:string;onStep:(direction:number)=>void}){
 const {colors}=useUi();
 const [bounds,setBounds]=useState({width:1,height:1});
 const scale=useSharedValue(1),origin=useSharedValue(1),x=useSharedValue(0),y=useSharedValue(0),startX=useSharedValue(0),startY=useSharedValue(0);
 const clamp=(value:number,min:number,max:number)=>{"worklet";return Math.max(min,Math.min(max,value));};
 const pinch=Gesture.Pinch().onStart(()=>{origin.value=scale.value;}).onUpdate(event=>{
  scale.value=clamp(origin.value*event.scale,1,4);
  x.value=clamp(x.value,-bounds.width*(scale.value-1)/2,bounds.width*(scale.value-1)/2);
  y.value=clamp(y.value,-bounds.height*(scale.value-1)/2,bounds.height*(scale.value-1)/2);
 }).onEnd(()=>{if(scale.value<=1.02){scale.value=1;x.value=0;y.value=0;}});
 const pan=Gesture.Pan().maxPointers(1).onStart(()=>{startX.value=x.value;startY.value=y.value;}).onUpdate(event=>{
  if(scale.value>1){x.value=clamp(startX.value+event.translationX,-bounds.width*(scale.value-1)/2,bounds.width*(scale.value-1)/2);y.value=clamp(startY.value+event.translationY,-bounds.height*(scale.value-1)/2,bounds.height*(scale.value-1)/2);}
 }).onEnd(event=>{if(scale.value<=1&&Math.abs(event.translationX)>55&&Math.abs(event.translationX)>Math.abs(event.translationY))runOnJS(onStep)(event.translationX<0?1:-1);});
 const doubleTap=Gesture.Tap().numberOfTaps(2).onEnd((_event,ok)=>{if(ok){scale.value=scale.value>1?1:2;x.value=0;y.value=0;}});
 const style=useAnimatedStyle(()=>({transform:[{translateX:x.value},{translateY:y.value},{scale:scale.value}]}));
 return <View onLayout={e=>setBounds(e.nativeEvent.layout)} style={{flex:1,overflow:"hidden",justifyContent:"center"}}>
  <GestureDetector gesture={Gesture.Simultaneous(pinch,pan,doubleTap)}>
   <Animated.View collapsable={false} style={[{width:"100%",height:"100%"},style]}>
    {uri?<Image source={{uri}} accessibilityLabel={label} resizeMode="contain" style={{width:"100%",height:"100%"}}/>:<Text style={{color:colors.mediaText,textAlign:"center"}}>Fotografía no disponible</Text>}
   </Animated.View>
  </GestureDetector>
 </View>;
}
export function PostPhotoGallery({photos,altTexts=[],author,active=true,viewer,allowOpen=true}:Props){
 const {colors}=useUi();const {width}=useWindowDimensions();const safe=useSafeAreaInsets();
 const [galleryWidth,setGalleryWidth]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const scope=useRef<MessageScope|null>(null),generation=useRef(0);
 const close=useCallback(()=>{generation.current++;scope.current=null;setSelected(null);},[]);
 useEffect(()=>()=>{generation.current++;scope.current=null;},[]);
 useEffect(()=>{if(!active||!allowOpen)close();},[active,allowOpen,close]);
 useEffect(()=>{close();},[viewer,photos,close]);
 useEffect(()=>watchAttachmentScope(()=>scope.current,close),[close]);
 async function open(index:number){
  if(!active||!allowOpen||!photos[index])return;
  const request=++generation.current;
  try{
   // A real post viewer may only retain an already authorized feed session.
   if(viewer){const captured=await captureMessageScope();await assertMessageScope(captured);if(captured.owner!==viewer||request!==generation.current)return;scope.current=captured;}
   if(request===generation.current)setSelected(index);
  }catch{close();}
 }
 const step=useCallback((direction:number)=>setSelected(current=>current===null?null:Math.max(0,Math.min(photos.length-1,current+direction))),[photos.length]);
 const margin=width<360?12:16;
 const layout=feedPhotoTiles(photos.length,galleryWidth);
 const label=(i:number)=>altTexts[i]||"Fotografía "+(i+1)+" de "+author;
 if(!photos.length)return null;
 return <View style={{paddingHorizontal:margin}}>
  <View onLayout={e=>setGalleryWidth(e.nativeEvent.layout.width)} style={{height:layout.height||undefined,aspectRatio:galleryWidth?undefined:4/3,borderRadius:16,overflow:"hidden",backgroundColor:colors.line}}>
   {layout.tiles.map(tile=>{
    const extra=tile.index===FEED_VISIBLE_PHOTOS-1?Math.max(0,photos.length-FEED_VISIBLE_PHOTOS):0;
    return <Pressable key={tile.index} disabled={!allowOpen||!active||!photos[tile.index]} accessibilityRole="button"
     accessibilityLabel={label(tile.index)+(extra?", "+extra+" fotografías adicionales":"")} onPress={()=>void open(tile.index)}
     style={{position:"absolute",left:tile.x,top:tile.y,width:tile.width,height:tile.height,overflow:"hidden",borderRadius:8,backgroundColor:colors.accent}}>
     {photos[tile.index]?<Image source={{uri:photos[tile.index]}} resizeMode="cover" resizeMethod="resize" style={{width:"100%",height:"100%"}} accessibilityIgnoresInvertColors/>:<View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Ionicons name="image-outline" size={28} color={colors.muted}/></View>}
     {extra>0&&<View pointerEvents="none" style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:colors.mediaSoftSurface,justifyContent:"center",alignItems:"center"}}><Text style={{color:colors.mediaText,fontSize:28,fontWeight:"700"}}>+{extra}</Text></View>}
    </Pressable>;
   })}
  </View>
  {allowOpen&&active&&selected!==null&&selected<photos.length&&<Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={close} statusBarTranslucent={false}>
   <GestureHandlerRootView style={{flex:1,backgroundColor:colors.mediaDisc,paddingTop:safe.top,paddingBottom:Math.max(safe.bottom,12)}}>
    <View style={{flexDirection:"row",alignItems:"center",paddingHorizontal:12}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar fotografías" onPress={close} style={{width:48,height:48,alignItems:"center",justifyContent:"center"}}><Ionicons name="close" color={colors.mediaText} size={26}/></Pressable>
     <Text style={{flex:1,textAlign:"center",color:colors.mediaText,fontWeight:"600"}}>{selected+1} / {photos.length}</Text>
     <View style={{width:48}}/>
    </View>
    <ZoomPhoto key={selected} uri={photos[selected]} label={label(selected)} onStep={step}/>
    <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Fotografía anterior" disabled={selected===0} onPress={()=>step(-1)} style={{width:48,height:48,alignItems:"center",justifyContent:"center",opacity:selected===0?.35:1}}><Ionicons name="chevron-back" size={24} color={colors.mediaText}/></Pressable>
     <Text style={{flex:1,textAlign:"center",color:colors.mediaQuiet,fontSize:12}}>Desliza · Pellizca para ampliar</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Fotografía siguiente" disabled={selected===photos.length-1} onPress={()=>step(1)} style={{width:48,height:48,alignItems:"center",justifyContent:"center",opacity:selected===photos.length-1?.35:1}}><Ionicons name="chevron-forward" size={24} color={colors.mediaText}/></Pressable>
    </View>
   </GestureHandlerRootView>
  </Modal>}
 </View>;
}
