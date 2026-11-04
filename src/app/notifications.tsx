import {useCallback,useEffect,useState} from "react";
import {Image,Pressable,Text,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {Screen,useUi} from "../components/ui";
import {useJobinNotices} from "../state/NoticeProvider";
import {cvRequests,respondCV,type CVRequest} from "../lib/cv-access";
import {requireSupabase} from "../lib/supabase";
export default function Notifications(){
 const {notices,markActivityRead}=useJobinNotices();const {s,colors}=useUi();
 const [requests,setRequests]=useState<(CVRequest&{name:string;handle:string;avatar:string|null;accountType:string})[]>([]);
 const [identityNotices,setIdentityNotices]=useState<{id:string;status:string;reason:string|null;created_at:string}[]>([]);
 const [outgoing,setOutgoing]=useState<CVRequest[]>([]);const [message,setMessage]=useState("");
 const load=useCallback(async()=>{try{const db=requireSupabase();const {data:{user}}=await db.auth.getUser();if(!user)return;const {data:identityRows,error:identityError}=await (db as any).from("notifications").select("id,payload,created_at").eq("recipient_id",user.id).eq("kind","identity_verification").order("created_at",{ascending:false}).limit(20);
 if(identityError)throw identityError;
 setIdentityNotices((identityRows??[]).map((n:any)=>({id:n.id,status:n.payload?.status??"",reason:n.payload?.reason??null,created_at:n.created_at})));
 const all=await cvRequests();const rows=all.filter(r=>r.owner_id===user.id&&r.status==="pending");setOutgoing(all.filter(r=>r.requester_id===user.id&&r.status!=="pending"));const ids=rows.map(r=>r.requester_id);const {data:profiles,error}=ids.length?await db.from("profiles").select("id,display_name,avatar_path,account_type").in("id",ids):{data:[],error:null};if(error)throw error;setRequests(rows.map(r=>{const profile=(profiles??[]).find(p=>p.id===r.requester_id);return {...r,name:profile?.display_name??"Usuario de Jobin",handle:"",avatar:profile?.avatar_path??null,accountType:profile?.account_type??"personal"};}));}catch(e){setMessage(e instanceof Error?e.message:"No se pudieron cargar las solicitudes.");}},[]);
 useEffect(()=>{markActivityRead();},[]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 async function respond(id:string,approve:boolean){try{await respondCV(id,approve);setMessage(approve?"Acceso al CV autorizado.":"Solicitud rechazada.");await load();}catch(e){setMessage(String(e));}}
 return <Screen title="Notificaciones" subtitle="Actividad de tu cuenta">
 {requests.map(req=><View key={req.id} style={[s.panel,{gap:10}]}><View style={{flexDirection:"row",alignItems:"center",gap:10}}>{req.avatar?<Image source={{uri:req.avatar}} style={{width:44,height:44,borderRadius:22}}/>:<View style={{width:44,height:44,borderRadius:22,backgroundColor:colors.line,alignItems:"center",justifyContent:"center"}}><Text style={s.text}>{req.name.slice(0,1).toUpperCase()}</Text></View>}<View style={{flex:1}}><Text style={s.h3}>{req.name} solicita tu CV</Text><Text style={s.muted}>{req.accountType==="business"?"Empresa":"Cuenta personal"}</Text></View></View><View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}><Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/jcard",params:{user:req.requester_id}})} style={{padding:10,borderRadius:9,borderWidth:1,borderColor:colors.line}}><Text style={s.text}>Ver JCard</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>void respond(req.id,true)} style={{padding:10,borderRadius:9,backgroundColor:colors.ink}}><Text style={{color:colors.inverse}}>Autorizar</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>void respond(req.id,false)} style={{padding:10,borderRadius:9,borderWidth:1,borderColor:colors.line}}><Text style={s.text}>Rechazar</Text></Pressable></View></View>)}
 {identityNotices.map(n=><View key={n.id} style={[s.panel,{gap:8}]}><Text style={s.h3}>{n.status==="approved"?"Tu documento de identidad fue aprobado":"Tu solicitud de verificación fue rechazada"}</Text><Text style={s.muted}>{n.status==="approved"?"La insignia J aparecerá cuando también estén verificados tu correo y teléfono.":n.reason??"Revisá tus datos y enviá una nueva solicitud."}</Text><Pressable onPress={()=>router.push("/verify-identity")} style={{padding:10,borderWidth:1,borderColor:colors.line,borderRadius:9}}><Text style={s.text}>Ver estado de identidad</Text></Pressable></View>)}
 {outgoing.map(req=><View key={req.id} style={[s.panel,{gap:8}]}><Text style={s.h3}>{req.status==="approved"?"Tu solicitud de CV fue autorizada":req.status==="denied"?"Tu solicitud de CV fue rechazada":"Tu acceso al CV fue revocado"}</Text><Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/jcard",params:{user:req.owner_id}})} style={{padding:10,borderRadius:9,borderWidth:1,borderColor:colors.line}}><Text style={s.text}>Ver JCard</Text></Pressable></View>)}
 {notices.length===0&&!requests.length&&!outgoing.length&&!identityNotices.length?<Text style={s.muted}>No tienes notificaciones nuevas.</Text>:notices.map(n=><View key={n.id} style={s.panel}><Text style={s.h3}>{n.title}</Text><Text style={s.muted}>{n.detail}</Text></View>)}
 {!!message&&<Text style={s.muted}>{message}</Text>}
 </Screen>;
}
