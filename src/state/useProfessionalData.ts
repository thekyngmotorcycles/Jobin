import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import {sessionMarkerKey} from "../lib/session-lifetime";
import type {MessageScope} from "../lib/session-continuity";
import {createWorkspaceSessionCache} from "../lib/workspace-session-cache";

const workspaceMemory=createWorkspaceSessionCache();
async function readScope():Promise<MessageScope|null>{
 if(!supabase)return null;
 const {data,error}=await supabase.auth.getSession();
 if(error)throw error;
 const session=data.session;
 if(!session)return null;
 const owner=session.user.id;
 return {owner,session:sessionMarkerKey(owner,session.access_token)};
}
function sameScope(a:MessageScope|null,b:MessageScope|null){
 return a===null||b===null?a===b:a.owner===b.owner&&a.session===b.session;
}


/** Reload on focus and auth changes; never substitute fictional data for a failed request. */
/** Show a matching in-memory workspace while refreshing within the same session. Never restore legacy disk snapshots. */
export function useProfessionalData<T>(loader:()=>Promise<T>,cacheWorkspace=false) {
 const [data,setData]=useState<T|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [version,setVersion]=useState(0);
 const generation=useRef(0);
 const reload=useCallback(()=>setVersion(value=>value+1),[]);
 useEffect(()=>{
  const subscription=supabase?.auth.onAuthStateChange(()=>{
   generation.current++;
   workspaceMemory.clear();
   setData(null);
   setLoading(true);
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
   const initial=await readScope();
   if(!valid())return;
   const sameOwner=async()=>valid()&&sameScope(initial,await readScope())&&valid();
   if(cacheWorkspace){
    if(!await sameOwner())return;
    const memory=initial?workspaceMemory.read(initial):null;
    setData(memory as T|null);
    if(memory)setLoading(false);
   }
   if(!valid())return;
   try{
    const value=await loader();
    if(!await sameOwner()){
     if(valid()){workspaceMemory.clear();setData(null);setError("La sesión cambió. Vuelve a cargar el perfil.");}
     return;
    }
    if(cacheWorkspace){
     if(!initial||!value){workspaceMemory.clear();setData(null);return;}
     if(!workspaceMemory.write(initial,value)){
      setData(null);
      throw new Error("La sesión cambió. Vuelve a cargar el perfil.");
     }
    }
    setData(value);
   }catch(cause){
    if(valid()){
     let stillCurrent=false;
     try{stillCurrent=await sameOwner();}catch{/* Fail closed when identity cannot be read. */}
     if(!valid())return;
     if(!stillCurrent){workspaceMemory.clear();setData(null);}
     setError(cause instanceof Error?cause.message:String(cause));
    }
   }finally{if(valid())setLoading(false);}
  })().catch(cause=>{if(valid()){workspaceMemory.clear();setData(null);setError(cause instanceof Error?cause.message:String(cause));setLoading(false);}});
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
