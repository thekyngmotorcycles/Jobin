import {useEffect,useRef,useState} from "react";
import {router} from "expo-router";
import {ActivityIndicator,Alert,Image,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {useUi} from "../components/ui";
import {pickSecuredPhotos,previewSecuredPhoto,uploadSecuredFile,watchAttachmentScope} from "../lib/private-attachment-android";
import {captureMessageScope,assertMessageScope,type MessageScope} from "../lib/message-session";
import type {PendingEvidence} from "../lib/private-attachment";
import {requireSupabase} from "../lib/supabase";

type DocumentType="passport"|"national_id"|"driver_license"|"residence_permit";
const TYPES:{value:DocumentType;label:string;needsBack:boolean}[]=[
 {value:"national_id",label:"Documento nacional de identidad",needsBack:true},
 {value:"driver_license",label:"Licencia de conducir",needsBack:true},
 {value:"passport",label:"Pasaporte",needsBack:false},
 {value:"residence_permit",label:"Permiso de residencia",needsBack:true}
];
const COUNTRIES=[["US","Estados Unidos"],["AR","Argentina"],["PE","Perú"],["MX","México"],["CO","Colombia"],["CL","Chile"],["ES","España"],["BR","Brasil"]];
type Picked=PendingEvidence&{preview:string};
export default function VerifyIdentity(){
 const {s,colors}=useUi();
 const [country,setCountry]=useState("US");
 const [docType,setDocType]=useState<DocumentType>("national_id");
 const [legalName,setLegalName]=useState("");
 const [expiresOn,setExpiresOn]=useState("");
 const [front,setFront]=useState<Picked|null>(null);
 const [back,setBack]=useState<Picked|null>(null);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState<string|null>(null);
 const [reviewReason,setReviewReason]=useState<string|null>(null);
 const [consent,setConsent]=useState(false);
 const [isReviewer,setIsReviewer]=useState(false);
 const origin=useRef<MessageScope|null>(null),picking=useRef(false);
 useEffect(()=>{
  const off=watchAttachmentScope(()=>origin.current,()=>{origin.current=null;setFront(null);setBack(null);setLegalName("");setExpiresOn("");setConsent(false);});
  return()=>{origin.current=null;off();};
 },[]);
 const needsBack=TYPES.find(x=>x.value===docType)?.needsBack??true;
 useEffect(()=>{let live=true;(async()=>{
  const {data:{user}}=await requireSupabase().auth.getUser();if(!user)return;
  const {data}=await (requireSupabase() as any).from("identity_verification_requests").select("status,reviewer_notes").eq("user_id",user.id).order("submitted_at",{ascending:false}).limit(1);
  if(live&&data?.[0]){setStatus(data[0].status);setReviewReason(data[0].status==="rejected"?data[0].reviewer_notes:null);}
  const {data:canReview}=await (requireSupabase() as any).rpc("is_identity_reviewer");
  if(live)setIsReviewer(canReview===true);
 })().catch(()=>{});return()=>{live=false;};},[]);
 async function pick(side:"front"|"back"){
  if(picking.current||busy)return;
  picking.current=true;
  try{
   const scope=await captureMessageScope(origin.current??undefined);
   origin.current=scope;
   const permission=await ImagePicker.requestCameraPermissionsAsync();
   await assertMessageScope(scope);
   if(!permission.granted){Alert.alert("Permiso necesario","Habilitá la cámara para fotografiar el documento.");return;}
   const [file]=await pickSecuredPhotos(scope,"report-evidence",{allowsEditing:false,quality:0.7},true);
   if(!file)return;
   if(file.mime!=="image/jpeg")throw Error("La foto del documento debe estar en JPEG.");
   const preview=await previewSecuredPhoto(scope,"report-evidence",file);
   if(origin.current===scope)(side==="front"?setFront:setBack)({...file,preview,name:"Documento privado",session:scope.session});
  }catch(e){Alert.alert("No se pudo leer la fotografía",e instanceof Error?e.message:"Intenta nuevamente.");}
  finally{picking.current=false;}
 }
 async function submit(){
  if(busy||picking.current)return;
  if(!consent){Alert.alert("Consentimiento requerido","Confirma que el documento es tuyo y que autorizás su almacenamiento privado y revisión manual.");return;}
  if(expiresOn.trim()&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(expiresOn.trim())){Alert.alert("Fecha incorrecta","Usa el formato AAAA-MM-DD.");return;}
  if(legalName.trim().length<3||!front||(needsBack&&!back)){Alert.alert("Datos incompletos","Ingresa el nombre legal y fotografiá las caras requeridas del documento.");return;}
  setBusy(true);
  try{
   if(!origin.current)throw Error("Selecciona los documentos en esta sesión.");
   const scope=await captureMessageScope(origin.current),db=requireSupabase(),user={id:scope.owner};
   const {data:existing,error:checkError}=await (db as any).from("identity_verification_requests").select("id").eq("user_id",user.id).eq("status","pending").limit(1);
   if(checkError)throw checkError;
   if(existing?.length)throw Error("Ya tienes una solicitud pendiente de revisión.");
   const frontPath=await uploadSecuredFile(scope,"report-evidence",front,"identity-documents");
   const backPath=needsBack&&back?await uploadSecuredFile(scope,"report-evidence",back,"identity-documents"):null;
   await assertMessageScope(scope);
   const {error}=await (db as any).from("identity_verification_requests").insert({user_id:user.id,country_code:country,document_type:docType,legal_name:legalName.trim(),document_expires_on:expiresOn.trim()||null,front_path:frontPath,back_path:backPath});
   if(error)throw error;
   await assertMessageScope(scope);
   setFront(null);setBack(null);setStatus("pending");setReviewReason(null);setConsent(false);Alert.alert("Solicitud enviada","Tu documento se almacenó de forma privada. La insignia J no se activará hasta que se complete la revisión.");
  }catch(e){Alert.alert("No se pudo enviar",e instanceof Error?e.message:"Intentá nuevamente.");}
  finally{setBusy(false);}
 }
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:20,gap:16,paddingBottom:60}}>
  <Text style={s.h2}>Verificar identidad</Text>
  {isReviewer&&<Pressable accessibilityRole="button" onPress={()=>router.push("/identity-admin")} style={{borderWidth:1,borderColor:colors.line,padding:13,borderRadius:12}}><Text style={s.text}>Panel administrativo de verificación →</Text></Pressable>}
  <Text style={s.muted}>La insignia J representa identidad verificada, no licencias ni experiencia profesional. Los documentos son privados y no aparecen en tu JCard.</Text>
  {status==="pending"&&<View style={s.panel}><Text style={s.h3}>Solicitud en revisión</Text><Text style={s.muted}>Ya recibimos tus documentos. No es necesario enviarlos nuevamente.</Text></View>}
  {status==="rejected"&&<View style={s.panel}><Text style={s.h3}>Solicitud rechazada</Text><Text style={s.muted}>{reviewReason??"Revisa tus datos y envía una nueva solicitud."}</Text><Text style={s.muted}>Puedes presentar un nuevo documento. Las solicitudes anteriores permanecen registradas para auditoría.</Text></View>}
  {status==="approved"&&<View style={s.panel}><Text style={s.h3}>Solicitud aprobada</Text><Text style={s.muted}>La aprobación documental se registró. La insignia J se activa cuando el correo está confirmado y el servidor valida la aprobación documental. No requiere SMS.</Text></View>}
  {status!=="pending"&&status!=="approved"&&<>
   <Text style={s.h3}>País emisor</Text>
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{COUNTRIES.map(([code,label])=><Pressable key={code} onPress={()=>setCountry(code)} style={{borderWidth:1,borderColor:colors.line,backgroundColor:country===code?colors.accent:colors.paper,padding:10,borderRadius:10}}><Text style={{color:colors.ink}}>{label}</Text></Pressable>)}</View>
   <Text style={s.h3}>Tipo de documento</Text>
   {TYPES.map(t=><Pressable key={t.value} onPress={()=>{setDocType(t.value);setBack(null);}} style={{borderWidth:1,borderColor:colors.line,padding:12,borderRadius:10,backgroundColor:docType===t.value?colors.accent:colors.paper}}><Text style={s.text}>{t.label}</Text></Pressable>)}
   <Text style={s.h3}>Nombre legal completo</Text>
   <TextInput accessibilityLabel="Nombre legal" value={legalName} onChangeText={setLegalName} autoCapitalize="words" maxLength={160} placeholder="Como figura en el documento" placeholderTextColor={colors.muted} style={{borderWidth:1,borderColor:colors.line,borderRadius:10,color:colors.ink,padding:14}}/>
   <Text style={s.h3}>Vencimiento del documento (si corresponde)</Text>
   <TextInput accessibilityLabel="Vencimiento del documento" value={expiresOn} onChangeText={setExpiresOn} keyboardType="numbers-and-punctuation" maxLength={10} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} style={{borderWidth:1,borderColor:colors.line,borderRadius:10,color:colors.ink,padding:14}}/>
   <Text style={s.h3}>Fotografías del documento</Text>
   {(["front",...(needsBack?["back"]:[])] as ("front"|"back")[]).map(side=><Pressable key={side} onPress={()=>void pick(side)} style={{borderWidth:1,borderColor:colors.line,borderRadius:12,padding:15,alignItems:"center",gap:10}}>
    <Text style={s.text}>{side==="front"?"Fotografiar frente":"Fotografiar reverso"}</Text>
    {(side==="front"?front:back)&&<Image source={{uri:(side==="front"?front:back)!.preview}} style={{width:190,height:115,borderRadius:8}} resizeMode="contain"/>}
   </Pressable>)}
   <Text style={s.muted}>Usa un documento propio, vigente y legible. No se utiliza reconocimiento facial automático. No envíes documentos de terceros.</Text>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(v=>!v)} style={{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:8}}><Text style={s.text}>{consent?"☑":"☐"} Confirmo que el documento es mío y autorizo su almacenamiento privado y revisión manual.</Text></Pressable>
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void submit()} style={{backgroundColor:colors.accent,borderRadius:12,padding:17,alignItems:"center"}}>{busy?<ActivityIndicator color={colors.ink}/>:<Text style={[s.text,{fontWeight:"700"}]}>Enviar para revisión</Text>}</Pressable>
  </>}
 </ScrollView></SafeAreaView>;
}
