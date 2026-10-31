import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";

/** Reload on focus and auth changes; never substitute fictional data for a failed request. */
export function useProfessionalData<T>(loader:()=>Promise<T>) {
 const [data,setData]=useState<T|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [version,setVersion]=useState(0);
 const reload=useCallback(()=>setVersion(value=>value+1),[]);
 useEffect(()=>{
  const subscription=supabase?.auth.onAuthStateChange(()=>{setData(null);reload();});
  return ()=>subscription?.data.subscription.unsubscribe();
 },[reload]);
 useFocusEffect(useCallback(()=>{
  let current=true;setLoading(true);setError("");
  void loader().then(value=>{if(current)setData(value);}).catch(cause=>{if(current){setData(null);setError(cause instanceof Error?cause.message:String(cause));}}).finally(()=>{if(current)setLoading(false);});
  return ()=>{current=false;};
 },[loader,version]));
 return {data,error,loading,reload};
}
export function useProfessionalAction(reload:()=>void) {
 const guard=useRef(false);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 async function run(action:()=>Promise<unknown>,success:string) {
  if(guard.current)return;guard.current=true;setBusy(true);setNotice("");
  try {await action();setNotice(success);reload();}
  catch(cause){setNotice(cause instanceof Error?cause.message:String(cause));}
  finally{guard.current=false;setBusy(false);}
 }
 return {run,busy,notice,setNotice};
}
