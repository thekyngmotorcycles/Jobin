import {JCARD_FLIP_GLARE} from "../theme/jobeen";
import {jcardCommon, jcardFlipShadow} from "../theme/jcard";
import {createContext, useCallback, useEffect, useRef, type ReactNode} from "react";
import {Platform, StyleSheet} from "react-native";
import Svg,{Path,Circle} from "react-native-svg";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import Animated, {cancelAnimation, interpolate, runOnJS, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming} from "react-native-reanimated";
import {LinearGradient} from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

/** Keeps the existing JCard faces, QR and editable/contact actions intact. */
export interface BusinessCardProps {
  front: ReactNode;
  back: ReactNode;
  height: number;
  enabled?: boolean;
  initialSide?: "personal" | "business";
  side: "personal" | "business";
  onSideChange: (side:"personal" | "business")=>void;
  shadowColor?: string;
  ghostPreview?: boolean;
}

/** Child action controls mark their touches so the card flip never steals a link/button tap. */
export const CardFlipInteractionContext=createContext<(()=>void)|null>(null);
const SPRING={damping:22,stiffness:155,mass:0.9,overshootClamping:true};
const DRAG_DISTANCE=230;
function lightImpact(){
  if(Platform.OS!=="web")void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
}

export function BusinessCard3D({front,back,height,enabled=true,initialSide="personal",side,onSideChange,shadowColor=jcardCommon.cardShadowColor,ghostPreview=false}:BusinessCardProps){
  const interactiveTouch=useRef(false);
  const reducedMotion=useReducedMotion();
  const previewAngle=useSharedValue(0);
  const lastGestureSide=useRef<"personal"|"business"|null>(null);
  const markInteractive=useCallback(()=>{interactiveTouch.current=true;},[]);
  const angle=useSharedValue(initialSide==="business"?180:0);
  const lift=useSharedValue(1);
  const panStart=useSharedValue(0);
  const moving=useSharedValue(false);
  const onSide=useCallback((next:"personal"|"business")=>onSideChange(next),[onSideChange]);

  useEffect(()=>{
    if(!enabled){
      cancelAnimation(angle);
      angle.value=side==="business"?180:0;
      lift.value=1;
    }else if(!moving.value){
      // External controls use the same lift + spring as tapping the card itself.
      if(lastGestureSide.current!==side){
        lift.value=withSequence(withSpring(1.04,SPRING),withSpring(1,SPRING));
      }
      lastGestureSide.current=null;
      angle.value=withSpring(side==="business"?180:0,SPRING);
    }
  },[enabled,side,angle,lift,moving]);

  // The short reveal uses the actual reverse face, without changing the selected
  // side or triggering the midpoint haptics reserved for real user gestures.
  useEffect(()=>{
    if(!enabled||!ghostPreview||reducedMotion)return;
    const signed=side==="personal"?96:-96;
    previewAngle.value=withDelay(230,withSequence(
      withTiming(signed,{duration:470}),
      withDelay(110,withTiming(0,{duration:520}))
    ));
    return()=>{cancelAnimation(previewAngle);previewAngle.value=0;};
  },[enabled,ghostPreview,reducedMotion,side,previewAngle]);
  const ghostStyle=useAnimatedStyle(()=>{
    const p=Math.min(1,Math.abs(previewAngle.value)/96);
    return {opacity:interpolate(p,[0,0.16,0.8,1],[0,0.25,0.7,0.42]),
      transform:[{translateX:interpolate(p,[0,1],[20,-21])}]};
  });

  // Cross the midpoint once per flip, including while dragging.
  useAnimatedReaction(
    ()=>angle.value>=90,
    (crossed,previous)=>{
      if(enabled&&previous!==null&&crossed!==previous)runOnJS(lightImpact)();
    },
    [enabled]
  );

  // Reject a vertical pull early so the parent ScrollView starts moving immediately.
  const tap=Gesture.Tap().enabled(enabled).maxDistance(7).maxDuration(240).runOnJS(true).onEnd(()=>{
    if(interactiveTouch.current)return;
    const next=side==="personal"?"business":"personal";
    cancelAnimation(previewAngle);previewAngle.value=0;
    lift.value=withSequence(withSpring(1.04,SPRING),withSpring(1,SPRING));
    angle.value=withSpring(next==="business"?180:0,SPRING);
    lastGestureSide.current=next;
    onSide(next);
  });
  const pan=Gesture.Pan().enabled(enabled).activeOffsetX([-16,16]).failOffsetY([-7,7]).runOnJS(true)
    .onBegin(()=>{
      if(interactiveTouch.current)return;
      cancelAnimation(angle);
      cancelAnimation(previewAngle);previewAngle.value=0;
      panStart.value=angle.value;
      moving.value=true;
      lift.value=withSpring(1.04,SPRING);
    })
    .onUpdate(event=>{
      if(interactiveTouch.current)return;
      angle.value=Math.max(0,Math.min(180,panStart.value-event.translationX/DRAG_DISTANCE*180));
    })
    .onEnd(event=>{
      if(interactiveTouch.current)return;
      const projected=angle.value-event.velocityX*0.09;
      const target=projected>=90?180:0;
      angle.value=withSpring(target,{...SPRING,velocity:-event.velocityX/DRAG_DISTANCE*180});
      lift.value=withSpring(1,SPRING);
      moving.value=false;
      const next=target===180?"business":"personal";
      lastGestureSide.current=next;
      onSide(next);
    })
    .onFinalize(()=>{
      // Do not schedule a spring on every failed vertical-scroll gesture.
      if(moving.value){lift.value=withSpring(1,SPRING);moving.value=false;}
    });
  const gesture=Gesture.Exclusive(pan,tap);

  const outerStyle=useAnimatedStyle(()=>({
    transform:[{scale:lift.value}],

  }));
  const frontStyle=useAnimatedStyle(()=>{
    const combined=angle.value+previewAngle.value;
    return {opacity:combined<90?1:0,transform:[{perspective:1000},{rotateY:`${combined}deg`}]};
  });
  const backStyle=useAnimatedStyle(()=>{
    const combined=angle.value+previewAngle.value;
    return {opacity:combined>90?1:0,transform:[{perspective:1000},{rotateY:`${combined+180}deg`}]};
  });
  const glareStyle=useAnimatedStyle(()=>{
    const combined=angle.value+previewAngle.value;
    const radians=combined*Math.PI/180;
    return {
      opacity:Math.min(0.18,Math.abs(Math.sin(radians))*0.16),
      transform:[{translateX:interpolate(Math.max(0,Math.min(180,combined)),[0,90,180],[-260,0,260])},{rotate:"-24deg"}],
    };
  });
  return <CardFlipInteractionContext.Provider value={markInteractive}><GestureDetector gesture={gesture}>
    <Animated.View onStartShouldSetResponderCapture={()=>{interactiveTouch.current=false;return false;}} style={[styles.shell,{height},outerStyle]}>
      <Animated.View pointerEvents={side==="personal"?"auto":"none"} style={[styles.face,{height,shadowColor},frontStyle]}>
        {front}
      </Animated.View>
      <Animated.View pointerEvents={side==="business"?"auto":"none"} style={[styles.face,styles.reverse,{height,shadowColor},backStyle]}>
        {back}
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,styles.glareMask]}>
        <Animated.View style={[styles.glare,glareStyle]}>
          <LinearGradient colors={JCARD_FLIP_GLARE} locations={[0,0.5,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
        </Animated.View>
      </Animated.View>
      {enabled&&ghostPreview&&!reducedMotion&&<Animated.View pointerEvents="none"
       accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
       style={[styles.ghost,ghostStyle]}>
       <Svg width={70} height={22} viewBox="0 0 70 22" accessible={false}>
        <Path d="M66 10 C48 3 24 4 8 11" fill="none" stroke={jcardCommon.businessGold} strokeOpacity={0.64} strokeWidth={1.3} strokeLinecap="round"/>
        <Circle cx={8} cy={11} r={2.5} fill={jcardCommon.businessGold} fillOpacity={0.73}/>
       </Svg>
      </Animated.View>}
    </Animated.View>
  </GestureDetector></CardFlipInteractionContext.Provider>;
}

const styles=StyleSheet.create({
  shell:{width:"100%",borderRadius:30,overflow:"visible"},
  face:{width:"100%",borderRadius:30,backfaceVisibility:"hidden",boxShadow:jcardFlipShadow.rest,overflow:"hidden"},
  reverse:{position:"absolute",top:0,left:0,right:0},
  glareMask:{borderRadius:30,overflow:"hidden"},
  glare:{position:"absolute",top:-80,bottom:-80,width:110,left:"50%"},
  ghost:{position:"absolute",top:"44%",right:12,width:70,height:22,zIndex:4},
});
