import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import {sessionMarkerKey} from "../lib/session-lifetime";
import type {MessageScope} from "../lib/session-continuity";
import {captureMessageScope,assertMessageScope} from "../lib/message-session";
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
export function useProfessionalData<T>(loader:(scope?:MessageScope)=>Promise<T>,cacheWorkspace=false,strict=false,enabled=true) {
 const [data,setData]=useState<T|null>(null);
 const [scope,setScope]=useState<MessageScope|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [version,setVersion]=useState(0);
 const generation=useRef(0);
 const observedScope=useRef<MessageScope|null>(null);
 const reload=useCallback(()=>setVersion(value=>value+1),[]);
 useEffect(()=>{
  if(!enabled)return;
  const subscription=supabase?.auth.onAuthStateChange((event,session)=>{
   let nextScope:MessageScope|null=null;
   try{if(session)nextScope={owner:session.user.id,session:sessionMarkerKey(session.user.id,session.access_token)};}catch{/* Invalid metadata cannot retain a private scope. */}
   if(cacheWorkspace&&nextScope&&sameScope(observedScope.current,nextScope)&&
      (event==="TOKEN_REFRESHED"||event==="SIGNED_IN"||event==="INITIAL_SESSION"))return;
   observedScope.current=nextScope;
   generation.current++;
   if(event==="SIGNED_OUT")workspaceMemory.clear();
   else if(cacheWorkspace)workspaceMemory.retain(nextScope);
   setData(null);setScope(null);
   setLoading(true);
   reload();
  });
  return ()=>subscription?.data.subscription.unsubscribe();
 },[cacheWorkspace,reload,enabled]);
 useFocusEffect(useCallback(()=>{
  if(!enabled)return;
  let current=true;
  const requestGeneration=generation.current;
  const valid=()=>current&&generation.current===requestGeneration;
  setError("");setLoading(true);
  const timeout=cacheWorkspace?setTimeout(()=>{
   if(!valid())return;
   current=false;workspaceMemory.clear();setData(null);setScope(null);
   setError("No se pudo recuperar la JCard. Vuelve a intentarlo.");setLoading(false);
  },20_000):undefined;
  void (async()=>{
   const initial=await readScope();
   if(!valid())return;
   const sameOwner=async()=>valid()&&sameScope(initial,await readScope())&&valid();
   try{
    if(cacheWorkspace){
     if(!initial)throw Error("No se pudo verificar la sesión del perfil. Vuelve a intentarlo.");
     const memory=workspaceMemory.read(initial);
     if(memory&&!await sameOwner())throw Error("No se pudo verificar la sesión del perfil. Vuelve a intentarlo.");
     setData(memory as T|null);setScope(memory?initial:null);
     if(memory)setLoading(false);
    }
    if(!valid())return;
    const value=cacheWorkspace?await loader(initial??undefined):await loader();
    if(!await sameOwner()){
     if(valid()){if(cacheWorkspace)workspaceMemory.clear();setData(null);setScope(null);setError("La sesión cambió. Vuelve a cargar el perfil.");}
     return;
    }
    if(cacheWorkspace){
     if(!initial||!value)throw Error("No se pudo recuperar la JCard. Vuelve a intentarlo.");
     if(!workspaceMemory.write(initial,value)){
      setData(null);
      throw new Error("La sesión cambió. Vuelve a cargar el perfil.");
     }
    }
    setData(value);setScope(initial);
   }catch(cause){
    if(valid()){
     let stillCurrent=false;
     try{stillCurrent=await sameOwner();}catch{/* Fail closed when identity cannot be read. */}
     if(!valid())return;
     if(!stillCurrent||strict){if(cacheWorkspace)workspaceMemory.clear();setData(null);setScope(null);}
     setError(cause instanceof Error?cause.message:String(cause));
    }
   }finally{if(valid())setLoading(false);}
  })().catch(cause=>{if(valid()){if(cacheWorkspace)workspaceMemory.clear();setData(null);setScope(null);setError(cause instanceof Error?cause.message:String(cause));setLoading(false);}}).finally(()=>clearTimeout(timeout));
  return ()=>{current=false;clearTimeout(timeout);};
 },[loader,version,cacheWorkspace,strict,enabled]));
 return {data:enabled?data:null,error:enabled?error:"",loading:enabled&&loading,reload,scope:enabled?scope:null};
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

/** Privileged actions bind the resource's verified identity to the initiating screen.
 * A later refresh may replace the object, but never authorize a different session.
 * check() must be called immediately before opening an external capability URL.
 */
export function useScopedProfessionalAction(reload:()=>void,origin:MessageScope|null){
 const guard=useRef(false),generation=useRef(0),focused=useRef(false),current=useRef(origin);
 current.current=origin;
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 useFocusEffect(useCallback(()=>{
  focused.current=true;generation.current++;
  return()=>{focused.current=false;generation.current++;setNotice("");};
 },[]));
 useEffect(()=>{
  const subscription=supabase?.auth.onAuthStateChange(()=>{generation.current++;setNotice("");});
  return()=>subscription?.data.subscription.unsubscribe();
 },[]);
 async function run(task:(scope:MessageScope,check:()=>Promise<void>)=>Promise<unknown>,success:string){
  if(!origin||!focused.current||guard.current||!sameScope(origin,current.current))return false;
  const revision=generation.current;
  const live=()=>focused.current&&generation.current===revision&&sameScope(origin,current.current);
  const check=async()=>{await assertMessageScope(origin);if(!live())throw Error("La sesión cambió.");};
  guard.current=true;setBusy(true);setNotice("");
  try{
   const scope=await captureMessageScope(origin);await check();
   await task(scope,check);await check();setNotice(success);reload();return true;
  }catch(cause){if(live())setNotice(cause instanceof Error?cause.message:String(cause));return false;}
  finally{guard.current=false;setBusy(false);}
 }
 return {run,busy,notice,setNotice};
}
