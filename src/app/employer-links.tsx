import {useCallback,useEffect,useState} from "react";
import {Alert,Pressable,Text,TextInput,View} from "react-native";
import {useFocusEffect} from "expo-router";
import {Button,Notice,Screen,useUi} from "../components/ui";
import {decideEmployer,endEmployer,getEmployerLinks,requestEmployer,searchEmployers,type EmployerLink,type EmployerOption} from "../lib/employer-links";
import {loadWorkspace} from "../lib/professional-api";
export default function EmployerLinks(){
 const {s,colors}=useUi();
 const [account,setAccount]=useState<"personal"|"company">("personal");
 const [term,setTerm]=useState("");const [results,setResults]=useState<EmployerOption[]>([]);
 const [links,setLinks]=useState<EmployerLink[]>([]);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{try{const [w,items]=await Promise.all([loadWorkspace(),getEmployerLinks()]);setAccount(w?.card.accountType??"personal");setLinks(items);}catch(e){setNotice(e instanceof Error?e.message:"No se pudieron cargar los vínculos.");}},[]);
 useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
 useEffect(()=>{if(term.trim().length<2){setResults([]);return;}let live=true;const t=setTimeout(()=>void searchEmployers(term.trim()).then(rows=>{if(live)setResults(rows);}).catch(()=>{if(live)setResults([]);}),300);return()=>{live=false;clearTimeout(t);};},[term]);
 async function perform(task:()=>Promise<unknown>,success:string){if(busy)return;setBusy(true);try{await task();setNotice(success);await refresh();}catch(e){setNotice(e instanceof Error?e.message:"No se pudo completar la operación.");}finally{setBusy(false);}}
 const current=links.find(l=>l.worker_id!==l.company_id&&["pending","approved"].includes(l.status)&&account==="personal");
 return <Screen title="Vínculos laborales" subtitle="Relaciones laborales confirmadas por empresas">
  {!!notice&&<Notice text={notice} onClose={()=>setNotice("")}/>}
  {account==="personal"&&<View style={s.panel}>
   <Text style={s.h3}>Mi empresa actual</Text>
   {current?<View style={{gap:10}}><Text style={s.text}>{current.name} · @{current.handle}</Text><Text style={s.muted}>{current.status==="approved"?"Vínculo verificado por la empresa.":"Solicitud pendiente de aprobación. Todavía no aparecerá en tu JCard."}</Text><Button secondary title={current.status==="pending"?"Retirar solicitud":"Finalizar relación laboral"} onPress={()=>Alert.alert("Confirmar","¿Quieres retirar o finalizar este vínculo?",[{text:"Cancelar",style:"cancel"},{text:"Confirmar",onPress:()=>void perform(()=>endEmployer(current.id),"Vínculo finalizado.")}])}/></View>:<>
    <Text style={s.muted}>Busca una empresa por nombre legal o @usuario. La empresa deberá aprobar tu solicitud antes de aparecer en tu JCard. Puedes vincular tu propia empresa si está registrada.</Text>
    <TextInput accessibilityLabel="Buscar empresa" placeholder="Nombre o @usuario de empresa" placeholderTextColor={colors.muted} value={term} onChangeText={setTerm} style={{borderWidth:1,borderColor:colors.line,color:colors.ink,borderRadius:12,padding:14}}/>
    {results.map(item=><Pressable key={item.id} onPress={()=>Alert.alert("Solicitar vínculo","¿Enviar una solicitud a "+item.name+"?",[{text:"Cancelar",style:"cancel"},{text:"Solicitar",onPress:()=>void perform(()=>requestEmployer(item.id),"Solicitud enviada a la empresa.")}])} style={{paddingVertical:13,borderBottomWidth:1,borderColor:colors.line}}><Text style={s.text}>{item.name}</Text><Text style={s.muted}>@{item.handle} · Solicitar aprobación →</Text></Pressable>)}
   </>}
  </View>}
  {account==="company"&&<View style={s.panel}>
   <Text style={s.h3}>Solicitudes de trabajadores</Text>
   <Text style={s.muted}>Solo tu empresa puede aprobar o rechazar los vínculos. Un rechazo impide que el nombre de la empresa aparezca en la JCard del solicitante.</Text>
   {links.filter(l=>l.status==="pending").length===0&&<Text style={s.muted}>No hay solicitudes pendientes.</Text>}
   {links.filter(l=>l.status==="pending").map(l=><View key={l.id} style={{gap:8,paddingVertical:12}}><Text style={s.text}>{l.worker_name}</Text><Button title="Aprobar vínculo" onPress={()=>void perform(()=>decideEmployer(l.id,"approved"),"Vínculo aprobado.")}/><Button secondary title="Rechazar solicitud" onPress={()=>void perform(()=>decideEmployer(l.id,"rejected"),"Solicitud rechazada.")}/></View>)}
   <Text style={s.h3}>Trabajadores vinculados</Text>
   {links.filter(l=>l.status==="approved").map(l=><View key={l.id} style={{gap:8,paddingVertical:12}}><Text style={s.text}>{l.worker_name}</Text><Button secondary title="Finalizar vínculo" onPress={()=>void perform(()=>endEmployer(l.id),"Vínculo finalizado.")}/></View>)}
  </View>}
  {account==="personal"&&links.some(l=>["rejected","ended","withdrawn"].includes(l.status))&&<View style={s.panel}><Text style={s.h3}>Historial de solicitudes</Text>{links.filter(l=>["rejected","ended","withdrawn"].includes(l.status)).slice(0,10).map(l=><Text key={l.id} style={s.muted}>{l.name} · {l.status==="rejected"?"Rechazada":l.status==="ended"?"Finalizada":"Retirada"}</Text>)}</View>}
 </Screen>;
}
