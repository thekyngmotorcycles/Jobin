import {useEffect,useRef,useState} from "react";
import {pickSecuredEvidence,pickSecuredPhotos,uploadSecuredFile,watchAttachmentScope} from "../lib/private-attachment-android";
import type {PendingEvidence,PrivateAttachment} from "../lib/private-attachment";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../lib/message-session";
import {ScrollView,Text,TextInput,Pressable,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Button,useUi} from "../components/ui";
import {BottomSheet} from "../components/social-ui";
import {requireSupabase} from "../lib/supabase";
const EXCELLENCE=[{key:"service",label:"Atención al cliente"},{key:"prices",label:"Precios competitivos"},{key:"punctuality",label:"Puntualidad"},{key:"professionalism",label:"Profesionalismo"},{key:"tenure",label:"Trayectoria"}] as const;
type Review={id:string;rating:number;comment:string;created_at:string;reviewer_id:string};
export default function BusinessReviews(){
 const {s,colors}=useUi();const [viewerId,setViewerId]=useState("");useEffect(()=>{void requireSupabase().auth.getUser().then(({data})=>setViewerId(data.user?.id??"")).catch(()=>{});},[]);const [reviewPanelOpen,setReviewPanelOpen]=useState(false);const [votes,setVotes]=useState<string[]>([]);const [reviewPhotos,setReviewPhotos]=useState<PrivateAttachment[]>([]);const [evidence,setEvidence]=useState<PendingEvidence[]>([]);const [handle,setHandle]=useState(""),[owner,setOwner]=useState(""),[name,setName]=useState(""),[reviews,setReviews]=useState<Review[]>([]),[rating,setRating]=useState(5),[comment,setComment]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[dispute,setDispute]=useState<string|null>(null),[reason,setReason]=useState("");
 const attachmentScope=useRef<MessageScope|null>(null),picking=useRef(false);
 useEffect(()=>{
  const stop=watchAttachmentScope(()=>attachmentScope.current,()=>{
   attachmentScope.current=null;setReviewPhotos([]);setEvidence([]);setReviewPanelOpen(false);setDispute(null);setViewerId("");
  });
  return()=>{attachmentScope.current=null;stop();};
 },[]);
 async function scoped(){
  const scope=await captureMessageScope(attachmentScope.current??undefined);
  attachmentScope.current=scope;
  return scope;
 }
 async function chooseReviewPhotos(){
  if(!owner||picking.current||busy||reviewPhotos.length>=5)return;
  picking.current=true;
  try{
   const scope=await scoped(),files=await pickSecuredPhotos(scope,"draft-photo",{
    allowsMultipleSelection:true,selectionLimit:5-reviewPhotos.length,quality:0.8,
   });
   await assertMessageScope(scope);
   if(attachmentScope.current===scope)setReviewPhotos(current=>[...current,...files].slice(0,5));
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudieron seleccionar las fotos.");}
  finally{picking.current=false;}
 }
 async function search(){
  setNotice("");
  try{
   const db=requireSupabase();
   const username=handle.trim().replace(/^@/,"").toLowerCase();
   const {data:identity,error:lookup}=await db.from("usernames").select("user_id")
    .eq("username",username).maybeSingle();
   if(lookup)throw lookup;
   if(!identity){setNotice("No se encontró esa cuenta.");return;}
   const {data:business,error}=await db.from("jobeen_public_business_cards" as never).select("name")
    .eq("owner_id",identity.user_id).maybeSingle<{name:string}>();
   if(error)throw error;
   if(!business?.name?.trim()){setNotice("Esta cuenta no tiene un perfil empresarial activo.");return;}
   setOwner(identity.user_id);
   setName(business.name);
   await refresh(identity.user_id);
  }catch(e){
   setNotice(e instanceof Error?e.message:"No se pudo consultar la empresa.");
  }
 }
 async function refresh(id:string){const {data,error}=await (requireSupabase() as any).from("jcard_business_reviews").select("id,rating,comment,created_at,reviewer_id").eq("business_owner_id",id).order("created_at",{ascending:false});if(error)throw error;setReviews(data??[]);}
 async function publish(){if(!owner||picking.current||busy)return;setBusy(true);setNotice("");try{const scope=await scoped(),db=requireSupabase(),user={id:scope.owner};if(user.id===owner)throw Error("No puedes calificar tu propia empresa.");const photoPaths:string[]=[];for(const photo of reviewPhotos){photoPaths.push(await uploadSecuredFile(scope,"draft-photo",photo,"business-review-photos"));}const {error}=await (db as any).from("jcard_business_reviews").insert({business_owner_id:owner,reviewer_id:user.id,rating,comment:comment.trim(),excellence_votes:votes,photo_paths:photoPaths});if(error)throw error;await assertMessageScope(scope);setComment("");setVotes([]);setReviewPhotos([]);setNotice("Reseña publicada.");setReviewPanelOpen(false);await refresh(owner);}catch(e){setNotice(e instanceof Error?e.message:"No se pudo publicar. Solo se permite una reseña por persona y empresa.");}finally{setBusy(false);}}
 async function chooseEvidence(){
  if(picking.current)return;
  picking.current=true;
  try{
   const scope=await scoped();
   if(scope.owner!==owner)throw Error("Solo la empresa puede adjuntar pruebas.");
   const files=await pickSecuredEvidence(scope,["image/jpeg","image/png","image/webp"],true);
   await assertMessageScope(scope);
   if(files.length+evidence.length>5)throw Error("Puedes adjuntar hasta cinco fotos.");
   if(attachmentScope.current===scope)setEvidence(prev=>[...prev,...files].slice(0,5));
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo seleccionar la prueba.");}
  finally{picking.current=false;}
 }
 async function submitDispute(){
  if(!dispute||reason.trim().length<20){setNotice("Explica la disputa con al menos 20 caracteres.");return;}
  try{
   const scope=await scoped();
   if(scope.owner!==owner)throw Error("Solo la empresa puede disputar sus reseñas.");
   const db=requireSupabase(),paths:string[]=[];
   for(const file of evidence)paths.push(await uploadSecuredFile(scope,"report-evidence",file,"business-review-disputes",dispute+"/"));
   await assertMessageScope(scope);
   const {error}=await (db as any).from("jcard_business_review_disputes").insert({review_id:dispute,business_owner_id:owner,reason:reason.trim(),evidence_paths:paths});
   if(error)throw error;
   await assertMessageScope(scope);
   setDispute(null);setReason("");setEvidence([]);setNotice("Disputa enviada para revisión. La calificación seguirá visible hasta la decisión.");
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo presentar la disputa.");}
 }
 return <SafeAreaView style={s.screen}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,gap:14}}><Text style={s.h2}>Reseñas de empresas</Text><Text style={s.muted}>Para valorar una empresa necesitas una cuenta con 30 días de antigüedad, correo y teléfono verificados. Solo se permite una reseña por empresa. Silver y Gold requieren al menos 20 reseñas.</Text><TextInput accessibilityLabel="Usuario de empresa" placeholder="@usuario_de_empresa" placeholderTextColor={colors.muted} value={handle} onChangeText={setHandle} autoCapitalize="none" style={{padding:14,borderWidth:1,borderColor:colors.line,borderRadius:12,color:colors.ink}}/><Button title="Buscar empresa" onPress={()=>void search()}/>{!!notice&&<Text style={s.muted}>{notice}</Text>}{!!owner&&<><Text style={s.h2}>{name}</Text><Button title="Escribir una reseña" onPress={()=>setReviewPanelOpen(true)}/><BottomSheet translucent visible={reviewPanelOpen} onClose={()=>setReviewPanelOpen(false)} title={"Reseñar a "+name}><View style={{gap:14,paddingVertical:12}}><View style={{flexDirection:"row",gap:10}}>{[1,2,3,4,5].map(n=><Pressable accessibilityRole="button" accessibilityLabel={n+" estrellas"} key={n} onPress={()=>setRating(n)}><Text style={{fontSize:30,color:colors.ink}}>{n<=rating?"★":"☆"}</Text></Pressable>)}</View><Text style={s.h3}>Distinciones de excelencia (opcional)</Text><Text style={s.muted}>Puedes reconocer una o varias cualidades del negocio.</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{EXCELLENCE.map(item=><Pressable key={item.key} accessibilityRole="checkbox" accessibilityState={{checked:votes.includes(item.key)}} onPress={()=>setVotes(current=>current.includes(item.key)?current.filter(v=>v!==item.key):[...current,item.key])} style={{paddingHorizontal:12,paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:votes.includes(item.key)?colors.ink:colors.line,backgroundColor:votes.includes(item.key)?colors.ink:colors.card}}><Text style={{fontWeight:"700",color:votes.includes(item.key)?colors.paper:colors.ink}}>{votes.includes(item.key)?"✓ ":""}{item.label}</Text></Pressable>)}</View><TextInput accessibilityLabel="Comentario" multiline placeholder="Cuenta tu experiencia con esta empresa" placeholderTextColor={colors.muted} value={comment} onChangeText={setComment} style={{minHeight:95,borderWidth:1,borderColor:colors.line,color:colors.ink,borderRadius:12,padding:12,textAlignVertical:"top"}}/><Button secondary title={"Adjuntar fotos ("+reviewPhotos.length+"/5)"} onPress={()=>void chooseReviewPhotos()}/>{reviewPhotos.map((photo,i)=><Pressable key={photo.ref.id} onPress={()=>setReviewPhotos(current=>current.filter((_,index)=>index!==i))}><Text style={s.muted}>Foto {i+1} · Quitar</Text></Pressable>)}<Button title={busy?"Publicando…":"Publicar reseña"} onPress={()=>void publish()}/></View></BottomSheet>{reviews.map(r=><View key={r.id} style={[s.panel,{padding:14,gap:8}]}><Text style={s.h3}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</Text><Text style={{color:colors.ink}}>{r.comment||"Sin comentario"}</Text><Text style={s.muted}>{new Date(r.created_at).toLocaleDateString()}</Text>{viewerId===owner&&r.rating<=3&&<Pressable accessibilityRole="button" onPress={()=>{setDispute(r.id);setEvidence([]);}}><Text style={s.muted}>Disputar reseña</Text></Pressable>}{dispute===r.id&&<View style={{gap:8}}><TextInput multiline accessibilityLabel="Motivo de la disputa" placeholder="Describe por qué la reseña es incorrecta" placeholderTextColor={colors.muted} value={reason} onChangeText={setReason} style={{padding:12,borderWidth:1,borderColor:colors.line,color:colors.ink}}/><Button secondary title="Adjuntar fotos (máx. 5)" onPress={()=>void chooseEvidence()}/><Text style={s.muted}>{evidence.length} archivos seleccionados · hasta 2 MiB por foto. Solo el equipo autorizado podrá revisar las pruebas.</Text><Button title="Enviar disputa" onPress={()=>void submitDispute()}/></View>}</View>)}</>}</ScrollView></SafeAreaView>;
}
