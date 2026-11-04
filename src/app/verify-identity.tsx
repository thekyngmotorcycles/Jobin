import {useEffect,useState} from "react";
import {router} from "expo-router";
import {ActivityIndicator,Alert,Image,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {useUi} from "../components/ui";
import {requireSupabase} from "../lib/supabase";

type DocumentType="passport"|"national_id"|"driver_license"|"residence_permit";
const TYPES:{value:DocumentType;label:string;needsBack:boolean}[]=[
 {value:"national_id",label:"Documento nacional de identidad",needsBack:true},
 {value:"driver_license",label:"Licencia de conducir",needsBack:true},
 {value:"passport",label:"Pasaporte",needsBack:false},
 {value:"residence_permit",label:"Permiso de residencia",needsBack:true}
];
const COUNTRIES=[["US","Estados Unidos"],["AR","Argentina"],["PE","Perú"],["MX","México"],["CO","Colombia"],["CL","Chile"],["ES","España"],["BR","Brasil"]];
type Picked={uri:string;base64:string};
function bytes(base64:string):Uint8Array{
 const binary=globalThis.atob(base64);const out=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
 return out;
}
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
 const needsBack=TYPES.find(x=>x.value===docType)?.needsBack??true;
 useEffect(()=>{let live=true;(async()=>{
  const {data:{user}}=await requireSupabase().auth.getUser();if(!user)return;
  const {data}=await (requireSupabase() as any).from("identity_verification_requests").select("status,reviewer_notes").eq("user_id",user.id).order("submitted_at",{ascending:false}).limit(1);
  if(live&&data?.[0]){setStatus(data[0].status);setReviewReason(data[0].status==="rejected"?data[0].reviewer_notes:null);}
  const {data:canReview}=await (requireSupabase() as any).rpc("is_identity_reviewer");
  if(live)setIsReviewer(canReview===true);
 })().catch(()=>{});return()=>{live=false;};},[]);
 async function pick(side:"front"|"back"){
  const permission=await ImagePicker.requestCameraPermissionsAsync();
  if(!permission.granted){Alert.alert("Permiso necesario","Habilitá la cámara para fotografiar el documento.");return;}
  const result=await ImagePicker.launchCameraAsync({mediaTypes:["images"],allowsEditing:false,quality:0.7,base64:true});
  if(result.canceled)return;
  const asset=result.assets[0];if(!asset?.base64)return Alert.alert("Error","No se pudo leer la fotografía.");
  if(asset.base64.length>12_000_000)return Alert.alert("Archivo demasiado grande","Intentá tomar otra fotografía.");
  (side==="front"?setFront:setBack)({uri:asset.uri,base64:asset.base64});
 }
 async function submit(){
  if(busy)return;
  if(!consent){Alert.alert("Consentimiento requerido","Confirmá que el documento es tuyo y que autorizás su almacenamiento privado y revisión manual.");return;}
  if(expiresOn.trim()&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(expiresOn.trim())){Alert.alert("Fecha incorrecta","Usá el formato AAAA-MM-DD.");return;}
  if(legalName.trim().length<3||!front||(needsBack&&!back)){Alert.alert("Datos incompletos","Ingresá el nombre legal y fotografiá las caras requeridas del documento.");return;}
  setBusy(true);const uploaded:string[]=[];
  try{
   const db=requireSupabase();const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user)throw Error("Iniciá sesión para continuar.");
   const {data:existing,error:checkError}=await (db as any).from("identity_verification_requests").select("id").eq("user_id",user.id).eq("status","pending").limit(1);
   if(checkError)throw checkError;
   if(existing?.length)throw Error("Ya tenés una solicitud pendiente de revisión.");
   const prefix=user.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2);
   async function upload(image:Picked,side:string){
    const path=prefix+"-"+side+".jpg";
    const {error}=await db.storage.from("identity-documents").upload(path,bytes(image.base64) as any,{contentType:"image/jpeg",upsert:false});
    if(error)throw error;uploaded.push(path);return path;
   }
   const frontPath=await upload(front,"front");
   const backPath=needsBack&&back?await upload(back,"back"):null;
   const {error}=await (db as any).from("identity_verification_requests").insert({user_id:user.id,country_code:country,document_type:docType,legal_name:legalName.trim(),document_expires_on:expiresOn.trim()||null,front_path:frontPath,back_path:backPath});
   if(error)throw error;
   setFront(null);setBack(null);setStatus("pending");setReviewReason(null);setConsent(false);Alert.alert("Solicitud enviada","Tu documento se almacenó de forma privada. La insignia J no se activará hasta que se complete la revisión.");
  }catch(e){if(uploaded.length)await requireSupabase().storage.from("identity-documents").remove(uploaded).catch(()=>{});Alert.alert("No se pudo enviar",e instanceof Error?e.message:"Intentá nuevamente.");}
  finally{setBusy(false);}
 }
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:20,gap:16,paddingBottom:60}}>
  <Text style={s.h2}>Verificar identidad</Text>
  {isReviewer&&<Pressable accessibilityRole="button" onPress={()=>router.push("/identity-admin")} style={{borderWidth:1,borderColor:colors.line,padding:13,borderRadius:12}}><Text style={s.text}>Panel administrativo de verificación →</Text></Pressable>}
  <Text style={s.muted}>La insignia J representa identidad verificada, no licencias ni experiencia profesional. Los documentos son privados y no aparecen en tu JCard.</Text>
  {status==="pending"&&<View style={s.panel}><Text style={s.h3}>Solicitud en revisión</Text><Text style={s.muted}>Ya recibimos tus documentos. No es necesario enviarlos nuevamente.</Text></View>}
  {status==="rejected"&&<View style={s.panel}><Text style={s.h3}>Solicitud rechazada</Text><Text style={s.muted}>{reviewReason??"Revisá tus datos y enviá una nueva solicitud."}</Text><Text style={s.muted}>Podés presentar un nuevo documento. Las solicitudes anteriores permanecen registradas para auditoría.</Text></View>}
  {status==="approved"&&<View style={s.panel}><Text style={s.h3}>Solicitud aprobada</Text><Text style={s.muted}>La aprobación documental se registró. La activación de la insignia requiere una comprobación adicional del servidor.</Text></View>}
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
    {(side==="front"?front:back)&&<Image source={{uri:(side==="front"?front:back)!.uri}} style={{width:190,height:115,borderRadius:8}} resizeMode="contain"/>}
   </Pressable>)}
   <Text style={s.muted}>Usá un documento propio, vigente y legible. No se utiliza reconocimiento facial automático. No envíes documentos de terceros.</Text>
   <Pressable accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(v=>!v)} style={{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:8}}><Text style={s.text}>{consent?"☑":"☐"} Confirmo que el documento es mío y autorizo su almacenamiento privado y revisión manual.</Text></Pressable>
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void submit()} style={{backgroundColor:colors.accent,borderRadius:12,padding:17,alignItems:"center"}}>{busy?<ActivityIndicator color={colors.ink}/>:<Text style={[s.text,{fontWeight:"700"}]}>Enviar para revisión</Text>}</Pressable>
  </>}
 </ScrollView></SafeAreaView>;
}
