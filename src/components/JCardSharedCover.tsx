import {useCallback,useRef,useState} from "react";
import {Image,Modal,Pressable,ScrollView,Text,View} from "react-native";
import {useFocusEffect} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../lib/message-session";
import {readSharedCover,publishSharedCover,removeSharedCover,type SharedCover} from "../lib/jcard-shared-cover";
import {Button} from "./ui";
import {JobeenNoticeDialog} from "./JobeenNoticeDialog";
import {JobinLoadingIndicator} from "./JobinLoadingGears";

type ScopedCover={target:string;scope:MessageScope;cover:SharedCover};
type Candidate={target:string;scope:MessageScope;uri:string};

async function pickCover():Promise<string|null>{
 const picker=await import("expo-image-picker");
 const result=await picker.launchImageLibraryAsync({mediaTypes:["images"],allowsMultipleSelection:false,quality:0.8});
 if(result.canceled||!result.assets.length)return null;
 const photo=result.assets[0],ratio=10/3;
 if(!photo.width||!photo.height)throw Error("No se pudo verificar el tamaño de la imagen.");
 const w=Math.max(1,Math.min(photo.width,Math.floor(photo.height*ratio)));
 const h=Math.max(1,Math.min(photo.height,Math.floor(w/ratio)));
 const manipulator=await import("expo-image-manipulator");
 const context=manipulator.ImageManipulator.manipulate(photo.uri);
 context.crop({originX:Math.floor((photo.width-w)/2),originY:Math.floor((photo.height-h)/2),width:w,height:h});
 if(w>1024)context.resize({width:1024});
 const rendered=await context.renderAsync();
 return (await rendered.saveAsync({format:manipulator.SaveFormat.JPEG,compress:0.75})).uri;
}

/** One cover, outside the rotating card. No legacy banner and no shared local cache. */
type SharedCoverProps={target?:string;scope?:MessageScope|null;editable?:boolean;height:number};
export function JCardSharedCover(props:SharedCoverProps){
 const key=JSON.stringify([props.target??null,props.scope?.owner??null,props.scope?.session??null,!!props.editable]);
 return <ScopedJCardSharedCover key={key} {...props}/>;
}
function ScopedJCardSharedCover({target,scope,editable=false,height}:SharedCoverProps){
 const {theme}=useTheme(),t=jobeenTokens(theme),modal=jobeenModalTokens(theme);
 const insets=useSafeAreaInsets();
 const revision=useRef(0),busyRef=useRef<object|null>(null);
 const [loaded,setLoaded]=useState<ScopedCover|null>(null);
 const [draft,setDraft]=useState<Candidate|null>(null);
 const [open,setOpen]=useState(false),[confirmRemove,setConfirmRemove]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const matching=(value:{target:string;scope:MessageScope}|null)=>!!value&&value.target===target&&value.scope.owner===scope?.owner&&value.scope.session===scope?.session;
 const current=matching(loaded)?loaded!.cover:null;
 const candidate=matching(draft)?draft!.uri:null;
 const owner=editable&&!!target&&target===scope?.owner;
 useFocusEffect(useCallback(()=>{
  const generation=++revision.current;
  setLoaded(null);setDraft(null);setOpen(false);setConfirmRemove(false);setBusy(false);setError("");busyRef.current=null;
  if(target&&scope)void readSharedCover(target,scope).then(cover=>{
   if(revision.current===generation)setLoaded({target,scope,cover});
  }).catch(()=>{if(revision.current===generation)setError("No se pudo cargar la portada.");});
  return()=>{revision.current++;busyRef.current=null;setLoaded(null);setDraft(null);setOpen(false);setConfirmRemove(false);setBusy(false);};
 },[target,scope?.owner,scope?.session]));
 async function run(action:(origin:MessageScope,active:()=>boolean)=>Promise<void>){
  if(!owner||!target||!scope||busyRef.current)return;
  const operation={},generation=revision.current;
  busyRef.current=operation;setBusy(true);setError("");
  const active=()=>revision.current===generation&&busyRef.current===operation;
  try{const origin=await captureMessageScope(scope);if(!active()||origin.owner!==target)return;await action(origin,active);}
  catch(cause){if(active())setError(cause instanceof Error?cause.message:"No se pudo actualizar la portada. Vuelve a cargarla.");}
  finally{if(active()){busyRef.current=null;setBusy(false);}}
 }
 const refresh=()=>void run(async(origin,active)=>{
  const cover=await readSharedCover(target!,origin);if(active())setLoaded({target:target!,scope:origin,cover});
 });
 const selectPhoto=()=>void run(async(origin,active)=>{
  const uri=await pickCover();await assertMessageScope(origin);
  if(uri&&active())setDraft({target:target!,scope:origin,uri});
 });
 const publish=()=>void run(async(origin,active)=>{
  if(!candidate||!current)return;
  const path=await publishSharedCover(target!,origin,current.path,candidate);
  if(!active())return;
  setLoaded({target:target!,scope:origin,cover:{path,url:null}});setDraft(null);setOpen(false);
  try{const cover=await readSharedCover(target!,origin);if(active())setLoaded({target:target!,scope:origin,cover});}
  catch{/* Published successfully; neutral fallback until next focus. */}
 });
 const remove=()=>void run(async(origin,active)=>{
  if(!current?.path)return;
  await removeSharedCover(target!,origin,current.path);
  if(active()){setLoaded({target:target!,scope:origin,cover:{path:null,url:null}});setDraft(null);setConfirmRemove(false);setOpen(false);}
 });
 const close=()=>{if(!busyRef.current){setOpen(false);setDraft(null);setError("");}};
 return <>
  <View style={{height,backgroundColor:t.line,overflow:"hidden"}}>
   {!!current?.url&&<Image key={current.url} source={{uri:current.url}} resizeMode="cover" style={{width:"100%",height:"100%"}}/>}
   {owner&&<Pressable accessibilityRole="button" accessibilityLabel="Editar portada compartida" onPress={()=>{setOpen(true);setDraft(null);}} style={{position:"absolute",left:4,top:4,width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
    <View style={{width:34,height:34,borderRadius:17,backgroundColor:t.surface,alignItems:"center",justifyContent:"center"}}><Ionicons name="camera-outline" size={19} color={t.ink}/></View>
   </Pressable>}
  </View>
  {owner&&<Modal visible={open&&!confirmRemove} animationType="fade" transparent onRequestClose={close}>
   <View style={{flex:1,justifyContent:"center",paddingHorizontal:18,paddingTop:insets.top+12,paddingBottom:insets.bottom+12,backgroundColor:modal.scrim}}>
    <View accessibilityViewIsModal style={{maxHeight:"100%",borderRadius:modal.radius.dialog,backgroundColor:modal.surface,borderWidth:1,borderColor:modal.border,padding:16}}>
     <ScrollView contentContainerStyle={{gap:12}} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={{fontSize:18,fontWeight:"700",color:modal.text}}>Portada compartida</Text>
      <View style={{width:"100%",aspectRatio:10/3,borderRadius:12,overflow:"hidden",backgroundColor:t.line}}>
       {!!(candidate||current?.url)&&<Image source={{uri:candidate||current!.url!}} resizeMode="cover" style={{width:"100%",height:"100%"}}/>}
      </View>
      <Text style={{color:modal.muted,lineHeight:19}}>La portada será visible para quienes puedan visitar tu perfil, independientemente de la cara de JCard que muestres. Solo se publica al confirmar.</Text>
      {!!error&&<Text accessibilityLiveRegion="polite" style={{color:modal.muted}}>{error}</Text>}
      {busy&&<JobinLoadingIndicator size={28}/>}
      {!current?<Button title="Reintentar" secondary onPress={refresh} disabled={busy}/>:<>
       <Button title={candidate?"Elegir otra foto":"Elegir foto"} secondary onPress={selectPhoto} disabled={busy}/>
       {!!candidate&&<Button title="Publicar portada" onPress={publish} disabled={busy}/>}
       {!!current.path&&!candidate&&<Button title="Quitar portada" variant="danger" onPress={()=>{setError("");setConfirmRemove(true);}} disabled={busy}/>}
      </>}
      <Button title="Cancelar" secondary onPress={close} disabled={busy}/>
     </ScrollView>
    </View>
   </View>
  </Modal>}
  {owner&&<JobeenNoticeDialog visible={confirmRemove} title="Quitar portada" description={error||"La portada dejará de mostrarse en tu perfil."} tone="danger" confirmLabel="Quitar" busy={busy} onConfirm={remove} onCancel={()=>{if(!busyRef.current)setConfirmRemove(false);}}/>}
 </>;
}
