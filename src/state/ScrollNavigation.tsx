import {createContext,useCallback,useContext,useMemo,useRef,useState,type ReactNode} from "react";
import {Animated} from "react-native";

type ScrollNavigation={progress:Animated.Value;hidden:boolean;reportScroll:(y:number)=>void;reset:()=>void};
const Context=createContext<ScrollNavigation|null>(null);

/** Scroll-linked navigation, shared between tab pages and stack visitor pages.
 * A 100px downward gesture progressively retracts the bar; an upward gesture reveals it.
 * No abrupt navigation unmounts, and no timer-based hide/show. */
export function ScrollNavigationProvider({children}:{children:ReactNode}){
 const progress=useRef(new Animated.Value(0)).current;
 const last=useRef<number|null>(null);
 const amount=useRef(0);
 const [hidden,setHidden]=useState(false);
 const reset=useCallback(()=>{
  last.current=null;amount.current=0;progress.setValue(0);setHidden(false);
 },[progress]);
 const reportScroll=useCallback((y:number)=>{
  if(!Number.isFinite(y))return;
  const current=Math.max(0,y);
  if(current<=8){last.current=current;amount.current=0;progress.setValue(0);setHidden(false);return;}
  const previous=last.current;
  last.current=current;
  if(previous===null)return;
  const delta=current-previous;
  if(Math.abs(delta)<0.5)return;
  amount.current=Math.min(1,Math.max(0,amount.current+delta/100));
  progress.setValue(amount.current);
  setHidden(value=>value===(amount.current>0.98)?value:amount.current>0.98);
 },[progress]);
 const value=useMemo(()=>({progress,hidden,reportScroll,reset}),[progress,hidden,reportScroll,reset]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useScrollNavigation(){const value=useContext(Context);if(!value)throw Error("Missing ScrollNavigationProvider");return value;}
