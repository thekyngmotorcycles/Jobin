import { useEffect,useState,type ReactNode } from "react";
import { AppState } from "react-native";
import { router,usePathname } from "expo-router";
import { supabase } from "../lib/supabase";
import { loadSafety } from "../lib/safety-api";
/** UI navigation guard only; database triggers independently enforce all account write blocks. */
export function SafetyAccountGate({children}:{children:ReactNode}){
 const path=usePathname();const [blocked,setBlocked]=useState(false);
 useEffect(()=>{
  let mounted=true;let revision=0;
  const refresh=async()=>{const current=++revision;try{const status=await loadSafety();if(mounted&&current===revision)setBlocked(!!status?.accountBlocked);}catch{/* Backend publishing guards remain authoritative if status cannot load. */}};
  void refresh();
  const auth=supabase?.auth.onAuthStateChange(()=>{setBlocked(false);setTimeout(()=>void refresh(),0);});
  const app=AppState.addEventListener("change",state=>{if(state==="active")void refresh();});
  const timer=setInterval(()=>void refresh(),30000);
  return()=>{mounted=false;revision++;auth?.data.subscription.unsubscribe();app.remove();clearInterval(timer);};
 },[]);
 useEffect(()=>{if(blocked&&!["/safety","/account","/terms"].includes(path))router.replace("/safety");},[blocked,path]);
 return children;
}
