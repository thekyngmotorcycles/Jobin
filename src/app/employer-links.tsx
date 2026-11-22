import {useCallback,useEffect,useRef,useState} from "react";
import {Alert,Pressable,Text,TextInput,View} from "react-native";
import {useFocusEffect} from "expo-router";
import {Button,Notice,Screen,useUi} from "../components/ui";
import {decideEmployer,endEmployer,getEmployerLinks,requestEmployer,searchEmployers,type EmployerLink,type EmployerOption} from "../lib/employer-links";
import {loadWorkspace} from "../lib/professional-api";
import {assertMessageScope,captureMessageScope,type MessageScope} from "../lib/message-session";
export default function EmployerLinks(){
 const {s,colors}=useUi();
 const scopeRef=useRef<MessageScope|null>(null),revision=useRef(0),actionRunning=useRef(false);
 const [scope,setScope]=useState<MessageScope|null>(null);
 const [account,setAccount]=useState<"personal"|"company"|null>(null);
 const [term,setTerm]=useState("");const [results,setResults]=useState<EmployerOption[]>([]);
 const [links,setLinks]=useState<EmployerLink[]>([]);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 const refresh=useCallback(async(expected?:MessageScope)=>{
  const generation=++revision.current;
  scopeRef.current=null;setScope(null);setLinks([]);setResults([]);setAccount(null);
  try{
   const origin=await captureMessageScope(expected);
   const [w,items]=await Promise.all([loadWorkspace(),getEmployerLinks(origin)]);
   await assertMessageScope(origin);
   if(!w||w.card.id!==origin.owner)throw Error("La cuenta cambió.");
   if(revision.current!==generation)return;
   scopeRef.current=origin;setScope(origin);setAccount(w.card.accountType);
   setLinks(items.filter(row=>row.worker_id===origin.owner||row.company_id===origin.owner));
  }catch(e){if(revision.current===generation)setNotice(e instanceof Error?e.message:"No se pudieron cargar los vínculos.");}
 },[]);
 useFocusEffect(useCallback(()=>{
  setNotice("");setTerm("");void refresh();
  return()=>{revision.current++;scopeRef.current=null;setScope(null);setAccount(null);setLinks([]);setResults([]);setTerm("");};
 },[refresh]));
 useEffect(()=>{
  setResults([]);
  if(!scope||account!=="personal"||term.trim().length<2)return;
  let live=true;
  const t=setTimeout(()=>void searchEmployers(term.trim(),scope).then(rows=>{
   if(live&&scopeRef.current===scope)setResults(rows);
  }).catch(()=>{if(live&&scopeRef.current===scope)setResults([]);}),300);
  return()=>{live=false;clearTimeout(t);};
 },[term,scope,account]);
 async function perform(origin:MessageScope,task:()=>Promise<unknown>,success:string){
  if(actionRunning.current||scopeRef.current!==origin)return;
  actionRunning.current=true;setBusy(true);
  try{
   await captureMessageScope(origin);
   if(scopeRef.current!==origin)return;
   await task();
   await assertMessageScope(origin);
   if(scopeRef.current===origin){setNotice(success);await refresh(origin);}
  }catch(e){if(scopeRef.current===origin)setNotice(e instanceof Error?e.message:"No se pudo completar la operación.");}
  finally{actionRunning.current=false;setBusy(false);}
 }
 const current=links.find(l=>l.worker_id===scope?.owner&&l.worker_id!==l.company_id&&["pending","approved"].includes(l.status)&&account==="personal");
 return <Screen title="Vínculos laborales" subtitle="Relaciones laborales confirmadas por empresas">
  {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
  {scope&&account==="personal"&&<View style={s.panel}>
   <Text style={s.h3}>Mi empresa actual</Text>
   {current?<View style={{gap:10}}><Text style={s.text}>{current.name} · @{current.handle}</Text><Text style={s.muted}>{current.status==="approved"?"Vínculo verificado por la empresa.":"Solicitud pendiente de aprobación. Todavía no aparecerá en tu JCard."}</Text><Button disabled={busy} secondary title={current.status==="pending"?"Retirar solicitud":"Finalizar relación laboral"} onPress={()=>Alert.alert("Confirmar","¿Quieres retirar o finalizar este vínculo?",[{text:"Cancelar",style:"cancel"},{text:"Confirmar",onPress:()=>void perform(scope,()=>endEmployer(current.id,scope),"Vínculo finalizado.")}])}/></View>:<>
    <Text style={s.muted}>Busca una empresa por nombre legal o @usuario. La empresa deberá aprobar tu solicitud antes de aparecer en tu JCard. Puedes vincular tu propia empresa si está registrada.</Text>
    <TextInput accessibilityLabel="Buscar empresa" placeholder="Nombre o @usuario de empresa" placeholderTextColor={colors.muted} value={term} onChangeText={setTerm} style={{borderWidth:1,borderColor:colors.line,color:colors.ink,borderRadius:12,padding:14}}/>
    {results.map(item=><Pressable key={item.id} disabled={busy} onPress={()=>Alert.alert("Solicitar vínculo","¿Enviar una solicitud a "+item.name+"?",[{text:"Cancelar",style:"cancel"},{text:"Solicitar",onPress:()=>void perform(scope,()=>requestEmployer(item.id,scope),"Solicitud enviada a la empresa.")}])} style={{paddingVertical:13,borderBottomWidth:1,borderColor:colors.line}}><Text style={s.text}>{item.name}</Text><Text style={s.muted}>@{item.handle} · Solicitar aprobación →</Text></Pressable>)}
   </>}
  </View>}
  {scope&&account==="company"&&<View style={s.panel}>
   <Text style={s.h3}>Solicitudes de trabajadores</Text>
   <Text style={s.muted}>Solo tu empresa puede aprobar o rechazar los vínculos. Un rechazo impide que el nombre de la empresa aparezca en la JCard del solicitante.</Text>
   {links.filter(l=>l.company_id===scope.owner&&l.status==="pending").length===0&&<Text style={s.muted}>No hay solicitudes pendientes.</Text>}
   {links.filter(l=>l.company_id===scope.owner&&l.status==="pending").map(l=><View key={l.id} style={{gap:8,paddingVertical:12}}><Text style={s.text}>{l.worker_name}</Text><Button disabled={busy} title="Aprobar vínculo" onPress={()=>void perform(scope,()=>decideEmployer(l.id,"approved",scope),"Vínculo aprobado.")}/><Button disabled={busy} secondary title="Rechazar solicitud" onPress={()=>void perform(scope,()=>decideEmployer(l.id,"rejected",scope),"Solicitud rechazada.")}/></View>)}
   <Text style={s.h3}>Trabajadores vinculados</Text>
   {links.filter(l=>l.company_id===scope.owner&&l.status==="approved").map(l=><View key={l.id} style={{gap:8,paddingVertical:12}}><Text style={s.text}>{l.worker_name}</Text><Button disabled={busy} secondary title="Finalizar vínculo" onPress={()=>void perform(scope,()=>endEmployer(l.id,scope),"Vínculo finalizado.")}/></View>)}
  </View>}
  {scope&&account==="personal"&&links.some(l=>l.worker_id===scope.owner&&["rejected","ended","withdrawn"].includes(l.status))&&<View style={s.panel}><Text style={s.h3}>Historial de solicitudes</Text>{links.filter(l=>l.worker_id===scope.owner&&["rejected","ended","withdrawn"].includes(l.status)).slice(0,10).map(l=><Text key={l.id} style={s.muted}>{l.name} · {l.status==="rejected"?"Rechazada":l.status==="ended"?"Finalizada":"Retirada"}</Text>)}</View>}
 </Screen>;
}
