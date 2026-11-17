import {Ionicons} from "@expo/vector-icons";
import {router,usePathname} from "expo-router";
import {useEffect,useRef,useState} from "react";
import {Modal,Pressable,Text,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens,LIGHT_JOBEEN} from "../theme/jobeen";
import {JobeenCreateIcon} from "./JobeenCreateIcon";

const MENU_WIDTH=250;
const MENU_HEIGHT=176;
const actions=[
 {name:"Video",icon:"videocam-outline",route:"/create",mode:"video"},
 {name:"En vivo",icon:"radio-outline",route:"/live",mode:""},
 {name:"Flash",icon:"flash-outline",route:"/create",mode:"flash"},
] as const;

/** Shared create entry: used only in Home and the signed-in owner's profile. */
export function JobeenCreateMenu(){
 const {theme}=useTheme();const t=jobeenTokens(theme);
 const insets=useSafeAreaInsets();const {width:screenWidth,height:screenHeight}=useWindowDimensions();
 const trigger=useRef<View>(null);
 const [visible,setVisible]=useState(false);
 const [position,setPosition]=useState({top:insets.top+58,left:12});
 const pathname=usePathname();
 useEffect(()=>{setVisible(false);},[pathname]);
 const menuWidth=Math.min(MENU_WIDTH,Math.max(220,screenWidth-24));
 function open(){
  const fallback={top:insets.top+58,left:Math.max(12,screenWidth-menuWidth-12)};
  if(!trigger.current){setPosition(fallback);setVisible(true);return;}
  trigger.current.measureInWindow((x,y,w,h)=>{
   if(!Number.isFinite(x)||!Number.isFinite(y)){setPosition(fallback);setVisible(true);return;}
   setPosition({
    left:Math.max(12,Math.min(x+w-menuWidth,screenWidth-menuWidth-12)),
    top:Math.max(insets.top+4,Math.min(y+h+6,screenHeight-MENU_HEIGHT-insets.bottom-8))
   });
   setVisible(true);
  });
 }
 function navigate(route:(typeof actions)[number]){
  setVisible(false);
  if(route.mode){
   router.push({pathname:"/create",params:{mode:route.mode}});
  }else router.push("/live");
 }
 return <>
  <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel="Crear" accessibilityHint="Abrir opciones para crear video, en vivo o Flash" accessibilityState={{expanded:visible}}
   onPress={()=>visible?setVisible(false):open()}
   style={({pressed})=>({width:48,height:48,alignItems:"center",justifyContent:"center",borderRadius:17,
    backgroundColor:LIGHT_JOBEEN.surface,borderWidth:1,borderColor:visible?LIGHT_JOBEEN.yellow:LIGHT_JOBEEN.line,
    shadowColor:LIGHT_JOBEEN.ink,shadowOffset:{width:0,height:pressed?1:4},shadowOpacity:pressed?0.08:0.18,
    shadowRadius:pressed?2:6,elevation:pressed?2:5,transform:[{translateY:pressed?1.5:0}],
    opacity:pressed?0.9:1})}>
   <JobeenCreateIcon size={33}/>
  </Pressable>
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={()=>setVisible(false)}>
   <View style={{flex:1}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones de creación" onPress={()=>setVisible(false)}
     style={{position:"absolute",top:0,bottom:0,left:0,right:0}}/>
    <View accessibilityViewIsModal style={{position:"absolute",top:position.top,left:position.left,width:menuWidth,borderRadius:20,overflow:"hidden",backgroundColor:t.surface,borderColor:t.line,borderWidth:1,shadowColor:t.ink,shadowOpacity:0.16,shadowRadius:16,shadowOffset:{width:0,height:7},elevation:10}}>
     {actions.map((action,index)=><Pressable key={action.name} accessibilityRole="button" accessibilityLabel={"Crear "+action.name} onPress={()=>navigate(action)}
      style={({pressed})=>({height:56,paddingHorizontal:18,flexDirection:"row",alignItems:"center",gap:14,backgroundColor:pressed?t.cream:t.surface,borderTopWidth:index?1:0,borderColor:t.line})}>
      <Ionicons name={action.icon} size={23} color={t.ink}/>
      <Text style={{color:t.ink,fontWeight:"700",fontSize:16}}>{action.name}</Text>
     </Pressable>)}
    </View>
   </View>
  </Modal>
 </>;
}
