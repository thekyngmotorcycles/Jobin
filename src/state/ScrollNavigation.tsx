import {createContext,useCallback,useContext,useMemo,useRef,useState,type ReactNode} from "react";
import {Animated,Easing} from "react-native";
import {useReducedMotion} from "react-native-reanimated";

type ScrollNavigation={progress:Animated.Value;hidden:boolean;reportScroll:(y:number)=>void;reset:()=>void};
const Context=createContext<ScrollNavigation|null>(null);
const SCROLL_HIDE_DISTANCE=160;
const ROUTE_REVEAL_DURATION=240;

/** Shared, scroll-linked navigation for tabs and public profiles.
 * Gradually retract on scroll, and reveal on route changes without snapping.
 * A route handoff ignores stale momentum from the previous page until the
 * native-driven reveal finishes. No delayed timer or Android rebuild needed. */
export function ScrollNavigationProvider({children}:{children:ReactNode}){
 const progress=useRef(new Animated.Value(0)).current;
 const last=useRef<number|null>(null);
 const amount=useRef(0);
 const transitioning=useRef(false);
 const transitionId=useRef(0);
 const [hidden,setHidden]=useState(false);
 const reducedMotion=useReducedMotion();
 const reset=useCallback(()=>{
  const id=++transitionId.current;
  last.current=null;
  amount.current=0;
  transitioning.current=true;
  setHidden(false);
  progress.stopAnimation();
  Animated.timing(progress,{toValue:0,duration:reducedMotion?0:ROUTE_REVEAL_DURATION,easing:Easing.out(Easing.cubic),useNativeDriver:true})
   .start(()=>{if(transitionId.current===id)transitioning.current=false;});
 },[progress,reducedMotion]);
 const reportScroll=useCallback((y:number)=>{
  if(!Number.isFinite(y))return;
  const current=Math.max(0,y);
  // A still-mounted previous tab must not instantly hide the new tab bar.
  if(transitioning.current){last.current=current;return;}
  if(current<=8){last.current=current;amount.current=0;progress.setValue(0);setHidden(false);return;}
  const previous=last.current;
  last.current=current;
  if(previous===null)return;
  const delta=current-previous;
  if(Math.abs(delta)<0.5)return;
  amount.current=Math.min(1,Math.max(0,amount.current+delta/SCROLL_HIDE_DISTANCE));
  progress.setValue(amount.current);
  setHidden(value=>value===(amount.current>0.98)?value:amount.current>0.98);
 },[progress]);
 const value=useMemo(()=>({progress,hidden,reportScroll,reset}),[progress,hidden,reportScroll,reset]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useScrollNavigation(){const value=useContext(Context);if(!value)throw Error("Missing ScrollNavigationProvider");return value;}
