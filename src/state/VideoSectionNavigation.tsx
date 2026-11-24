import AsyncStorage from "@react-native-async-storage/async-storage";
import {createContext,useCallback,useContext,useEffect,useRef,type ReactNode} from "react";
import {router,usePathname} from "expo-router";
import {useAuthSessionKey} from "../components/AuthGate";
import {requireSupabase} from "../lib/supabase";
import {sessionMarkerKey} from "../lib/session-lifetime";
import {assertAccountOwner} from "../lib/account-scope";
import {serializePrivateWrite} from "../lib/private-write-queue";
import {createVideoSectionPreference,videoSectionForPath,videoSectionKey,videoSectionRoute} from "../lib/video-section-preference";
import type {MessageScope} from "../lib/message-session";
const preference=createVideoSectionPreference(AsyncStorage,async scope=>{await assertAccountOwner(scope.owner,scope.session);});
const Context=createContext<{openVideos:()=>void}>({openVideos:()=>{}});
export function useVideoSectionNavigation(){return useContext(Context);}
/** AuthGate remounts this provider on session changes. Only the generic Videos
 * action consults preferences. Explicit links and switches always use their routes.
 */
export function VideoSectionNavigationProvider({children}:{children:ReactNode}){
 const authKey=useAuthSessionKey(),path=usePathname();
 const active=useRef(false),currentPath=useRef(path),request=useRef(0);
 const queue=useRef<Promise<unknown>>(Promise.resolve());
 if(currentPath.current!==path){currentPath.current=path;request.current++;}
 useEffect(()=>{active.current=true;return()=>{active.current=false;request.current++;};},[]);
 const enqueue=useCallback((task:()=>Promise<void>)=>{
  const next=queue.current.then(task,task);
  queue.current=next.catch(()=>{});
  return next;
 },[]);
 const boundScope=useCallback(async():Promise<MessageScope>=>{
  if(!authKey||!active.current)throw Error("Sesión no disponible.");
  const {data,error}=await requireSupabase().auth.getSession();
  const session=data.session;
  if(error||!session||sessionMarkerKey(session.user.id,session.access_token)!==authKey)throw Error("La sesión cambió.");
  const scope={owner:session.user.id,session:authKey};
  await assertAccountOwner(scope.owner,scope.session);
  if(!active.current)throw Error("La navegación cambió.");
  return scope;
 },[authKey]);
 useEffect(()=>{
  const section=videoSectionForPath(path);
  if(!authKey||!section)return;
  void enqueue(async()=>{
   const scope=await boundScope();
   await serializePrivateWrite(videoSectionKey(scope.owner),async()=>{
    if(!active.current)return;
    await preference.write(scope,section);
   });
  }).catch(()=>{});
 },[authKey,path,enqueue,boundScope]);
 const openVideos=useCallback(()=>{
  if(!authKey||videoSectionForPath(currentPath.current))return;
  const ticket=++request.current,from=currentPath.current;
  void enqueue(async()=>{
   const scope=await boundScope();
   const section=await serializePrivateWrite(videoSectionKey(scope.owner),()=>preference.read(scope));
   await assertAccountOwner(scope.owner,scope.session);
   if(!active.current||request.current!==ticket||currentPath.current!==from)return;
   router.navigate(videoSectionRoute(section));
  }).catch(()=>{});
 },[authKey,enqueue,boundScope]);
 return <Context.Provider value={{openVideos}}>{children}</Context.Provider>;
}
