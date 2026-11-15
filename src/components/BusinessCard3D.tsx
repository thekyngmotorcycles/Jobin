import {JCARD_FLIP_GLARE} from "../theme/jobeen";
import {jcardCommon, jcardFlipShadow} from "../theme/jcard";
import {createContext, useCallback, useEffect, useRef, type ReactNode} from "react";
import {Platform, StyleSheet} from "react-native";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import Animated, {cancelAnimation, interpolate, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSequence, withSpring} from "react-native-reanimated";
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
}

/** Child action controls mark their touches so the card flip never steals a link/button tap. */
export const CardFlipInteractionContext=createContext<(()=>void)|null>(null);
const SPRING={damping:22,stiffness:155,mass:0.9,overshootClamping:true};
const DRAG_DISTANCE=230;
function lightImpact(){
  if(Platform.OS!=="web")void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
}

export function BusinessCard3D({front,back,height,enabled=true,initialSide="personal",side,onSideChange,shadowColor=jcardCommon.cardShadowColor}:BusinessCardProps){
  const interactiveTouch=useRef(false);
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
      angle.value=withSpring(side==="business"?180:0,SPRING);
    }
  },[enabled,side,angle,lift,moving]);

  // Cross the midpoint once per flip, including while dragging.
  useAnimatedReaction(
    ()=>angle.value>=90,
    (crossed,previous)=>{
      if(enabled&&previous!==null&&crossed!==previous)runOnJS(lightImpact)();
    },
    [enabled]
  );

  const tap=Gesture.Tap().enabled(enabled).maxDistance(12).runOnJS(true).onEnd(()=>{
    if(interactiveTouch.current)return;
    const next=side==="personal"?"business":"personal";
    lift.value=withSequence(withSpring(1.04,SPRING),withSpring(1,SPRING));
    angle.value=withSpring(next==="business"?180:0,SPRING);
    onSide(next);
  });
  const pan=Gesture.Pan().enabled(enabled).activeOffsetX([-12,12]).failOffsetY([-18,18]).runOnJS(true)
    .onBegin(()=>{
      if(interactiveTouch.current)return;
      cancelAnimation(angle);
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
      runOnJS(onSide)(target===180?"business":"personal");
    })
    .onFinalize(()=>{
      lift.value=withSpring(1,SPRING);
      moving.value=false;
    });
  const gesture=Gesture.Exclusive(pan,tap);

  const outerStyle=useAnimatedStyle(()=>({
    transform:[{scale:lift.value}],

  }));
  const frontStyle=useAnimatedStyle(()=>({
    opacity:angle.value<90?1:0,
    transform:[{perspective:1000},{rotateY:`${angle.value}deg`}],
  }));
  const backStyle=useAnimatedStyle(()=>({
    opacity:angle.value>90?1:0,
    transform:[{perspective:1000},{rotateY:`${angle.value+180}deg`}],
  }));
  const glareStyle=useAnimatedStyle(()=>{
    const radians=angle.value*Math.PI/180;
    return {
      opacity:Math.min(0.18,Math.abs(Math.sin(radians))*0.16),
      transform:[{translateX:interpolate(angle.value,[0,90,180],[-260,0,260])},{rotate:"-24deg"}],
    };
  });
  return <CardFlipInteractionContext.Provider value={markInteractive}><GestureDetector gesture={gesture}>
    <Animated.View style={[styles.shell,{height},outerStyle]}>
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
    </Animated.View>
  </GestureDetector></CardFlipInteractionContext.Provider>;
}

const styles=StyleSheet.create({
  shell:{width:"100%",borderRadius:30,overflow:"visible"},
  face:{width:"100%",borderRadius:30,backfaceVisibility:"hidden",boxShadow:jcardFlipShadow.rest,overflow:"hidden"},
  reverse:{position:"absolute",top:0,left:0,right:0},
  glareMask:{borderRadius:30,overflow:"hidden"},
  glare:{position:"absolute",top:-80,bottom:-80,width:110,left:"50%"},
});
