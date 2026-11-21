import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const workspaceMemory=new Map<string,unknown>();
const cachePrefix="jobin.workspace.cache.v1.";


/** Reload on focus and auth changes; never substitute fictional data for a failed request. */
/** Show a user-scoped cached workspace while refreshing it from the server. */
export function useProfessionalData<T>(loader:()=>Promise<T>,cacheWorkspace=false) {
 const [data,setData]=useState<T|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [version,setVersion]=useState(0);
 const generation=useRef(0);
 const reload=useCallback(()=>setVersion(value=>value+1),[]);
 useEffect(()=>{
  const subscription=supabase?.auth.onAuthStateChange((_event,session)=>{
   generation.current++;
   workspaceMemory.clear();
   setData(null);
   setLoading(true);
   if(!session?.user)void AsyncStorage.getAllKeys().then(keys=>AsyncStorage.multiRemove(keys.filter(key=>key.startsWith(cachePrefix)))).catch(()=>{});
   reload();
  });
  return ()=>subscription?.data.subscription.unsubscribe();
 },[reload]);
 useFocusEffect(useCallback(()=>{
  let current=true;
  const requestGeneration=generation.current;
  const valid=()=>current&&generation.current===requestGeneration;
  setError("");
  void (async()=>{
   let cacheKey:string|null=null;
   const initial=(await supabase?.auth.getSession())?.data.session?.user.id??null;
   if(!valid())return;
   const sameOwner=async()=>valid()&&((await supabase?.auth.getSession())?.data.session?.user.id??null)===initial&&valid();
   if(cacheWorkspace){
    if(!valid())return;
    const userId=initial;
    if(userId){
     cacheKey=cachePrefix+userId;
     const memory=workspaceMemory.get(cacheKey);
     if(memory&&typeof memory==="object"&&"card" in memory&&(memory as {card?:{id?:string}}).card?.id===userId){setData(memory as T);setLoading(false);}
     else{
      try{
       const raw=await AsyncStorage.getItem(cacheKey);
       if(!await sameOwner())return;
       if(raw){const cached=JSON.parse(raw) as T;if(cached&&typeof cached==="object"&&"card" in cached&&(cached as {card?:{id?:string}}).card?.id===userId){setData(cached);setLoading(false);workspaceMemory.set(cacheKey,cached);}}
      }catch{/* A corrupt cache must never block the server request. */}
     }
    }else{setData(null);}
   }
   if(!valid())return;
   try{
    const value=await loader();
    if(!await sameOwner())return;
    if(cacheWorkspace&&value&&(!initial||(value as {card?:{id?:string}}).card?.id!==initial))throw new Error("La sesión cambió. Vuelve a cargar el perfil.");
    setData(value);
    if(cacheWorkspace&&cacheKey&&value){
     workspaceMemory.set(cacheKey,value);
     void AsyncStorage.setItem(cacheKey,JSON.stringify(value)).catch(()=>{});
    }
   }catch(cause){
    if(valid())setError(cause instanceof Error?cause.message:String(cause));
   }finally{if(valid())setLoading(false);}
  })().catch(cause=>{if(valid()){setError(cause instanceof Error?cause.message:String(cause));setLoading(false);}});
  return ()=>{current=false;};
 },[loader,version,cacheWorkspace]));
 return {data,error,loading,reload};
}
export function useProfessionalAction(reload:()=>void) {
 const guard=useRef(false);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 async function run(action:()=>Promise<unknown>,success:string) {
  if(guard.current)return false;guard.current=true;setBusy(true);setNotice("");
  try {await action();setNotice(success);reload();return true;}
  catch(cause){setNotice(cause instanceof Error?cause.message:String(cause));return false;}
  finally{guard.current=false;setBusy(false);}
 }
 return {run,busy,notice,setNotice};
}
