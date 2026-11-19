import {Ionicons} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {router,useFocusEffect} from "expo-router";
import {useCallback,useEffect,useRef,useState} from "react";
import {Alert,Pressable,StyleSheet,View} from "react-native";
import Animated,{Easing,interpolate,useAnimatedStyle,useReducedMotion,useSharedValue,withTiming} from "react-native-reanimated";
import {IconButton} from "./social-ui";
import {HomeSideMenu} from "./HomeSideMenu";
import {JobinWordmark} from "./JobinWordmark";
import {JobeenCreateMenu} from "./JobeenCreateMenu";
import {PostQuickComposer} from "./PostQuickComposer";
import {StoryStrip} from "./StoryStrip";
import {loadQuickComposerPreference,saveQuickComposerPreference} from "../lib/home-preferences";
import {currentSocialUser} from "../lib/social-content";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

const DISCLOSURE_MS=250;
const COMPOSER_TOP_GAP=8;
const CARD_RADIUS=21;

/**
 * The story carousel always keeps its full width. The expansion handle and the
 * composer are separate rows *underneath* it, never overlaid on story avatars.
 * The card shadow lives outside the clipping layer so Android won't cut it off.
 */
export function SocialHeader({showComposer=false}:{showComposer?:boolean}){
 const {theme}=useTheme();
 const t=jobeenTokens(theme);
 const prefersReducedMotion=useReducedMotion();
 const [menu,setMenu]=useState(false);
 const [owner,setOwner]=useState("");
 const [composerVisible,setComposerVisible]=useState(false);
 const [saving,setSaving]=useState(false);
 const [composerHeight,setComposerHeight]=useState(0);
 const reopenMenuOnReturn=useRef(false);
 const lastToggleAt=useRef(0);
 const reveal=useSharedValue(0);

 useFocusEffect(useCallback(()=>{
  if(reopenMenuOnReturn.current){reopenMenuOnReturn.current=false;setMenu(true);}
  if(!showComposer)return;
  let active=true;
  void(async()=>{
   try{
    const id=await currentSocialUser().catch(()=>"");
    const enabled=await loadQuickComposerPreference(id).catch(()=>false);
    if(active){
     // Hydrate the saved preference immediately, without playing an opening
     // animation or triggering haptics merely because Home gained focus.
     reveal.value=enabled?1:0;
     setOwner(id);
     setComposerVisible(enabled);
    }
   }catch{
    if(active){reveal.value=0;setOwner("");setComposerVisible(false);}
   }
  })();
  return()=>{active=false;};
 },[showComposer,reveal]));

 useEffect(()=>{
  const target=composerVisible?1:0;
  reveal.value=prefersReducedMotion?target:withTiming(target,{
   duration:DISCLOSURE_MS,easing:Easing.out(Easing.cubic)
  });
 },[composerVisible,prefersReducedMotion,reveal]);

 async function toggleComposer(){
  // Saving locks the preference, while the short guard also prevents a quick
  // succession of taps from starting conflicting visual transitions.
  if(!owner||saving||Date.now()-lastToggleAt.current<DISCLOSURE_MS)return;
  lastToggleAt.current=Date.now();
  const next=!composerVisible;
  setComposerVisible(next);
  setSaving(true);
  // A subtle selection tick, only on actual interaction. Unsupported devices
  // still use the same animation and remain fully functional.
  void Haptics.selectionAsync().catch(()=>{});
  try{await saveQuickComposerPreference(owner,next);}
  catch(e){
   setComposerVisible(!next);
   Alert.alert("Personalizar inicio",e instanceof Error?e.message:"No se pudo guardar la preferencia.");
  }finally{setSaving(false);}
 }

 const chevronStyle=useAnimatedStyle(()=>({
  transform:[{rotate:`${interpolate(reveal.value,[0,1],[0,180])}deg`}]
 }));
 const revealStyle=useAnimatedStyle(()=>({
  height:Math.max(0,composerHeight)*reveal.value,
  opacity:interpolate(reveal.value,[0,0.12,1],[0,0.4,1])
 }));
 const shadowStyle=useAnimatedStyle(()=>({
  height:Math.max(0,composerHeight-COMPOSER_TOP_GAP)*reveal.value,
  opacity:interpolate(reveal.value,[0,0.25,1],[0,0.16,1]),
  shadowOpacity:interpolate(reveal.value,[0,1],[0,theme==="dark"?0.16:0.10]),
  elevation:interpolate(reveal.value,[0,1],[0,4])
 }));

 return <View style={{paddingTop:8}}>
  <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:8}}>
   <IconButton icon="menu" label="Opciones" onPress={()=>setMenu(true)}/>
   <JobinWordmark width={96}/>
   <View style={{flexDirection:"row",alignItems:"center",gap:2}}>
    <JobeenCreateMenu/>
    <IconButton icon="search-outline" label="Buscar" onPress={()=>router.push("/search")}/>
   </View>
  </View>

  <View style={{marginTop:14}}>
   <StoryStrip/>
  </View>

  {showComposer&&<>
   <Pressable accessibilityRole="button"
    accessibilityLabel={composerVisible?"Ocultar publicación rápida":"Mostrar publicación rápida"}
    accessibilityHint="Despliega u oculta el cuadro para crear publicaciones debajo de las historias."
    accessibilityState={{expanded:composerVisible,disabled:!owner||saving}}
    disabled={!owner||saving} onPress={()=>void toggleComposer()}
    style={{minHeight:44,flexDirection:"row",alignItems:"center",justifyContent:"center",
     paddingHorizontal:16,opacity:owner?1:0.6}}>
    <View style={{flex:1,height:StyleSheet.hairlineWidth,backgroundColor:t.line}}/>
    <Animated.View style={[{width:44,height:44,alignItems:"center",justifyContent:"center"},chevronStyle]}>
     <Ionicons name="chevron-down" size={19} color={t.ink2}/>
    </Animated.View>
    <View style={{flex:1,height:StyleSheet.hairlineWidth,backgroundColor:t.line}}/>
   </Pressable>

   <View style={{position:"relative"}}>
    <Animated.View pointerEvents="none" style={[{
     position:"absolute",top:COMPOSER_TOP_GAP,left:14,right:14,
     backgroundColor:t.surface,borderRadius:CARD_RADIUS,
     borderWidth:StyleSheet.hairlineWidth,borderColor:t.line,
     shadowColor:t.floatingCardShadow,shadowOffset:{width:0,height:5},shadowRadius:18
    },shadowStyle]}/>
    <Animated.View
     pointerEvents={composerVisible?"auto":"none"}
     accessibilityElementsHidden={!composerVisible}
     importantForAccessibility={composerVisible?"auto":"no-hide-descendants"}
     style={[{overflow:"hidden"},revealStyle]}>
     <View style={{paddingTop:COMPOSER_TOP_GAP}}
      onLayout={event=>{
       const height=Math.ceil(event.nativeEvent.layout.height);
       setComposerHeight(previous=>Math.abs(previous-height)>1?height:previous);
      }}>
      <PostQuickComposer/>
     </View>
    </Animated.View>
   </View>
  </>}

  <HomeSideMenu visible={menu} onClose={()=>setMenu(false)}
   onNavigate={()=>{reopenMenuOnReturn.current=true;}}/>
 </View>;
}
