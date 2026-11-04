import {useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Alert,Image,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useUi} from "../components/ui";
import {requireSupabase} from "../lib/supabase";

type Request={id:string;user_id:string;country_code:string;document_type:string;legal_name:string;front_path:string;back_path:string|null;status:string;submitted_at:string;reviewed_at:string|null;reviewer_notes:string|null;document_expires_on:string|null;validation_flags:Record<string,boolean>|null};
export default function IdentityAdmin(){
 const {s,colors}=useUi();
 const [allowed,setAllowed]=useState<boolean|null>(null),[loading,setLoading]=useState(true);
 const [rows,setRows]=useState<Request[]>([]),[notes,setNotes]=useState<Record<string,string>>({});
 const [filter,setFilter]=useState<"pending"|"approved"|"rejected"|"all">("pending");
 const [history,setHistory]=useState<{request_id:string;reviewer_id:string;decision:string;notes:string|null;decided_at:string}[]>([]);
 const [busy,setBusy]=useState<string|null>(null),[images,setImages]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   const db=requireSupabase();
   const {data:can,error:permissionError}=await (db as any).rpc("is_identity_reviewer");
   if(permissionError)throw permissionError;
   setAllowed(can===true);
   if(!can){setRows([]);return;}
   const {data,error}=await (db as any).rpc("identity_review_queue");
   if(error)throw error;setRows(data??[]);
   const {data:audit,error:auditError}=await (db as any).rpc("identity_review_history");
   if(auditError)throw auditError;setHistory(audit??[]);
  }catch(e){Alert.alert("Error",e instanceof Error?e.message:"No se pudo cargar el panel.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function view(path:string){
  try{
   const {data,error}=await requireSupabase().storage.from("identity-documents").createSignedUrl(path,60);
   if(error)throw error;
   setImages(v=>({...v,[path]:data.signedUrl}));
  }catch(e){Alert.alert("No se pudo abrir el documento",e instanceof Error?e.message:"Error de permisos.");}
 }
 async function decide(row:Request,approve:boolean){
  if(busy)return;
  if(!approve&&(notes[row.id]?.trim().length??0)<8){Alert.alert("Motivo obligatorio","Para rechazar una solicitud, escribí un motivo de al menos 8 caracteres.");return;}
  Alert.alert(approve?"Aprobar identidad":"Rechazar solicitud",approve?"¿Confirmás que revisaste el documento y corresponde a esta persona?":"¿Confirmás el rechazo de esta solicitud?",[
   {text:"Cancelar",style:"cancel"},
   {text:"Confirmar",style:approve?"default":"destructive",onPress:async()=>{
    setBusy(row.id);
    try{
     const {data,error}=await (requireSupabase() as any).rpc("identity_review_decide",{p_request:row.id,p_approve:approve,p_notes:notes[row.id]?.trim()||null});
     if(error)throw error;if(!data)throw Error("La solicitud ya fue procesada.");
     await load();
    }catch(e){Alert.alert("No se pudo completar",e instanceof Error?e.message:"Error");}
    finally{setBusy(null);}
   }}
  ]);
 }
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:20,gap:16,paddingBottom:65}}>
  <Text style={s.h2}>Revisión de identidad</Text>
  {loading&&<ActivityIndicator color={colors.ink}/>}
  {!loading&&allowed===false&&<Text style={s.muted}>Acceso restringido. Solo revisores autorizados pueden ver documentos y decidir solicitudes.</Text>}
  {allowed===true&&<>
   <Text style={s.muted}>Revisá la legibilidad, vigencia y correspondencia del nombre. La aprobación confirma una revisión manual, no una validación gubernamental.</Text>
   <Pressable onPress={()=>void load()} style={{padding:10}}><Text style={s.text}>Actualizar solicitudes</Text></Pressable>
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{(["pending","approved","rejected","all"] as const).map(value=><Pressable key={value} onPress={()=>setFilter(value)} style={{padding:10,borderRadius:10,borderWidth:1,borderColor:colors.line,backgroundColor:filter===value?colors.line:colors.paper}}><Text style={s.text}>{value==="pending"?"Pendientes":value==="approved"?"Aprobadas":value==="rejected"?"Rechazadas":"Todas"} ({value==="all"?rows.length:rows.filter(r=>r.status===value).length})</Text></Pressable>)}</View>
   {rows.filter(row=>filter==="all"||row.status===filter).length===0&&<Text style={s.muted}>No hay solicitudes en esta categoría.</Text>}
   {rows.filter(row=>filter==="all"||row.status===filter).map(row=><View key={row.id} style={[s.panel,{gap:10}]}>
    <Text style={s.h3}>{row.legal_name}</Text>
    <Text style={s.muted}>{row.country_code} · {row.document_type} · {row.status} · {new Date(row.submitted_at).toLocaleDateString()}</Text>
    <Text style={s.muted}>Usuario: {row.user_id}</Text>
    <Text style={s.muted}>Vencimiento declarado: {row.document_expires_on??"No indicado"}</Text>
    {!!row.validation_flags&&Object.keys(row.validation_flags).length>0&&<Text style={s.muted}>Alertas automáticas: {Object.keys(row.validation_flags).join(", ")}</Text>}
    {([row.front_path,row.back_path].filter(path=>Boolean(path)&&!String(path).includes("/deleted/")) as string[]).map((path,i)=><View key={path} style={{gap:7}}>
     <Pressable accessibilityRole="button" onPress={()=>void view(path)}><Text style={[s.text,{textDecorationLine:"underline"}]}>{i===0?"Ver frente":"Ver reverso"} (enlace temporal)</Text></Pressable>
     {images[path]&&<Image source={{uri:images[path]}} resizeMode="contain" style={{height:220,width:"100%",backgroundColor:colors.paper}}/>}
    </View>)}
    {row.front_path.includes("/deleted/")&&<Text style={s.muted}>Fotografías eliminadas conforme al plazo de conservación. Se mantiene el historial de revisión.</Text>}
    {row.status==="pending"?<>
     <TextInput accessibilityLabel="Notas de revisión" placeholder="Motivo o notas (opcional)" placeholderTextColor={colors.muted} maxLength={2000} multiline value={notes[row.id]??""} onChangeText={v=>setNotes(n=>({...n,[row.id]:v}))} style={{borderWidth:1,borderColor:colors.line,borderRadius:9,padding:10,color:colors.ink,minHeight:55}}/>
     <View style={{flexDirection:"row",gap:12}}>
      <Pressable disabled={!!busy} onPress={()=>void decide(row,true)} style={{padding:12,borderRadius:9,borderWidth:1,borderColor:colors.line}}><Text style={s.text}>Aprobar</Text></Pressable>
      <Pressable disabled={!!busy} onPress={()=>void decide(row,false)} style={{padding:12,borderRadius:9,borderWidth:1,borderColor:colors.line}}><Text style={s.text}>Rechazar</Text></Pressable>
     </View>
    </>:<Text style={s.muted}>Revisado: {row.reviewed_at?new Date(row.reviewed_at).toLocaleDateString():"—"} · {row.reviewer_notes??"Sin notas"}</Text>}
   </View>)}
   <Text style={s.h3}>Historial de decisiones</Text>
   {history.length===0&&<Text style={s.muted}>Todavía no hay decisiones registradas.</Text>}
   {history.map(item=><View key={item.request_id} style={[s.panel,{gap:5}]}><Text style={s.text}>{item.decision==="approved"?"Aprobada":"Rechazada"} · {new Date(item.decided_at).toLocaleString()}</Text><Text style={s.muted}>Solicitud: {item.request_id}</Text><Text style={s.muted}>Revisor: {item.reviewer_id}</Text>{!!item.notes&&<Text style={s.muted}>Notas: {item.notes}</Text>}</View>)}
  </>}
 </ScrollView></SafeAreaView>;
}
