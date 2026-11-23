import {Ionicons} from "@expo/vector-icons";
import {router,usePathname} from "expo-router";
import {useEffect,useRef,useState} from "react";
import {Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {JobeenCreateIcon} from "./JobeenCreateIcon";
import {JobeenFlashIcon} from "./JobeenFlashIcon";

const MENU_WIDTH=256;
const MENU_ROW_HEIGHT=56;
const actions=[
 {id:"post",name:"Publicación",icon:"create-outline",route:"/post/create"},
 {id:"story",name:"Historia",icon:"add-circle-outline",route:"/story/create"},
 {id:"flash",name:"Flash",icon:"flash-outline",route:"/create"},
 {id:"live",name:"En vivo",icon:"radio-outline",route:"/live"},
] as const;

/** Shared create entry: used only in Home and the signed-in owner's profile. */
export function JobeenCreateMenu(){
 const {theme}=useTheme();const t=jobeenTokens(theme);const modal=jobeenModalTokens(theme);
 const insets=useSafeAreaInsets();const {width:screenWidth,height:screenHeight,fontScale}=useWindowDimensions();
 const trigger=useRef<View>(null);
 const [visible,setVisible]=useState(false);
 const [position,setPosition]=useState({top:insets.top+58,left:12});
 const pathname=usePathname();
 useEffect(()=>{setVisible(false);},[pathname]);
 const menuWidth=Math.max(0,Math.min(MENU_WIDTH,screenWidth-insets.left-insets.right-24));
 const topMin=insets.top+4,bottomMax=screenHeight-insets.bottom-8;
 const idealHeight=actions.length*Math.max(MENU_ROW_HEIGHT,JOBEEN_LINE_HEIGHT.body*fontScale+24);
 const maxTop=Math.max(topMin,bottomMax-idealHeight);
 const menuLeft=Math.max(insets.left+12,Math.min(position.left,screenWidth-insets.right-menuWidth-12));
 const menuTop=Math.max(topMin,Math.min(position.top,maxTop));
 function open(){
  const fallback={top:Math.min(insets.top+58,maxTop),left:Math.max(insets.left+12,screenWidth-insets.right-menuWidth-12)};
  if(!trigger.current){setPosition(fallback);setVisible(true);return;}
  trigger.current.measureInWindow((x,y,w,h)=>{
   if(!Number.isFinite(x)||!Number.isFinite(y)){setPosition(fallback);setVisible(true);return;}
   setPosition({
    left:Math.max(insets.left+12,Math.min(x+w-menuWidth,screenWidth-insets.right-menuWidth-12)),
    top:Math.max(topMin,Math.min(y+h+6,maxTop))
   });
   setVisible(true);
  });
 }
 function navigate(action:(typeof actions)[number]){
  setVisible(false);
  if(action.id==="flash")router.push({pathname:"/create",params:{mode:"flash"}});
  else router.push(action.route as never);
 }
 return <>
  <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel="Crear" accessibilityHint="Abrir opciones de Publicación, Historia, Flash y En vivo" accessibilityState={{expanded:visible}}
   onPress={()=>visible?setVisible(false):open()}
   style={({pressed})=>({width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center",borderRadius:24,
    opacity:pressed?0.6:1})}>
   <JobeenCreateIcon size={30}/>
  </Pressable>
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={()=>setVisible(false)}>
   <View style={{flex:1}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones de creación" onPress={()=>setVisible(false)}
     style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:modal.scrim}}/>
    <View accessibilityViewIsModal style={{position:"absolute",top:menuTop,left:menuLeft,width:menuWidth,maxHeight:Math.max(0,bottomMax-menuTop),borderRadius:modal.radius.popover,overflow:"hidden",backgroundColor:modal.surface,borderColor:modal.border,borderWidth:1,shadowColor:t.ink,shadowOpacity:0.16,shadowRadius:16,shadowOffset:{width:0,height:7},elevation:10}}>
     <ScrollView style={{flexShrink:1}} keyboardShouldPersistTaps="handled">
     {actions.map((action,index)=><Pressable key={action.name} accessibilityRole="button" accessibilityLabel={"Crear "+action.name} onPress={()=>navigate(action)}
      style={({pressed})=>({minHeight:MENU_ROW_HEIGHT,paddingVertical:12,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:pressed?modal.soft:modal.surface,borderTopWidth:index?1:0,borderColor:modal.border})}>
      {action.id==="flash"?<JobeenFlashIcon size={25}/>:<Ionicons name={action.icon} size={JOBEEN_CONTROL.icon} color={t.ink}/>}
      <Text style={{flex:1,color:modal.text,fontWeight:"700",fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body}}>{action.name}</Text>
     </Pressable>)}
     </ScrollView>
    </View>
   </View>
  </Modal>
 </>;
}
