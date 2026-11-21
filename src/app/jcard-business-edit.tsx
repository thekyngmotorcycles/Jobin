import {Alert,Keyboard,Pressable,ScrollView,Text,TextInput,View} from "react-native";
import {appearanceOwner} from "../lib/jcard-appearance";
import {readJCardVisibility,saveJCardVisibility,DEFAULT_JCARD_VISIBILITY} from "../lib/jcard-visibility";
import {useEffect,useState} from "react";
import {router} from "expo-router";
import {loadCatalog} from "../lib/professional-api";
import type {ProfessionalCatalog} from "../lib/professional-types";
import {EMPTY_BUSINESS_CARD,readScopedBusinessCard,writeScopedBusinessCard} from "../lib/business-card-cache";
import {Ionicons} from "@expo/vector-icons";
import {Screen,Button,useUi} from "../components/ui";
import {JOBEEN_TYPE} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {readCloudBusiness,writeCloudBusiness,checkBusinessHandleAvailable,BUSINESS_HANDLE_PATTERN} from "../lib/jcard-cloud";
import type {BusinessCardData} from "../lib/jcard";

type Field="name"|"businessHandle"|"category"|"opened"|"closed"|"email"|"emailSecondary"|"phone"|"phoneLabel"|"phoneSecondary"|"phoneSecondaryLabel"|"location"|"services";
type Section="main"|"contact"|"services"|"privacy";
const empty:BusinessCardData=EMPTY_BUSINESS_CARD;
const fields:Record<Field,string>={name:"Nombre de empresa",businessHandle:"Usuario empresarial (opcional)",category:"Categoría profesional",opened:"Año de apertura",closed:"Año de cierre",email:"Correo empresarial",emailSecondary:"Correo secundario",phone:"Teléfono empresarial",phoneLabel:"Identificador de teléfono 1",phoneSecondary:"Teléfono secundario",phoneSecondaryLabel:"Identificador de teléfono 2",location:"Ubicación",services:"Servicios (máximo 3, separados por comas)"};
const sections:{id:Section;title:string;icon:React.ComponentProps<typeof Ionicons>["name"];keys:Field[]}[]=[
 {id:"main",title:"Datos principales",icon:"business-outline",keys:["name","businessHandle","category","opened","closed"]},
 {id:"contact",title:"Datos de contacto",icon:"mail-outline",keys:["email","emailSecondary","phone","phoneLabel","phoneSecondary","phoneSecondaryLabel","location"]},
 {id:"services",title:"Servicios y actividad",icon:"briefcase-outline",keys:["services"]}
];
export default function BusinessEditor(){
 const {s,colors}=useUi();
 const [data,setData]=useState<BusinessCardData>(empty);
 const [editorOwner,setEditorOwner]=useState("");
 const [open,setOpen]=useState<Section|null>(null);
 const [handleFeedback,setHandleFeedback]=useState("");
 const [servicesInput,setServicesInput]=useState("");
 const [catalog,setCatalog]=useState<ProfessionalCatalog|null>(null);
 const [categoryOpen,setCategoryOpen]=useState(false);
 const [categoryQuery,setCategoryQuery]=useState("");
 useEffect(()=>{let active=true;void loadCatalog().then(value=>{if(active)setCatalog(value);}).catch(()=>{});return()=>{active=false;};},[]);
 const [visibility,setVisibility]=useState(DEFAULT_JCARD_VISIBILITY);
 useEffect(()=>{let live=true;void appearanceOwner().then(readJCardVisibility).then(v=>{if(live)setVisibility(v);}).catch(()=>{});return()=>{live=false;};},[]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{
  let live=true;
  void(async()=>{
   try{
    const owner=await appearanceOwner();
    if(!live)return;
    setEditorOwner(owner);setData(EMPTY_BUSINESS_CARD);setServicesInput("");
    try{
     const cloud=await readCloudBusiness();
     if(!live||(await appearanceOwner())!==owner)return;
     const next={...EMPTY_BUSINESS_CARD,...(cloud??{})};
     setData(next);setServicesInput(next.services.join(", "));
     if(cloud)void writeScopedBusinessCard(owner,next).catch(()=>{});
    }catch{
     const cached=await readScopedBusinessCard(owner).catch(()=>null);
     if(live&&(await appearanceOwner().catch(()=>null))===owner){setData(cached??EMPTY_BUSINESS_CARD);setServicesInput((cached??EMPTY_BUSINESS_CARD).services.join(", "));}
     if(live)setNotice("Sin conexión a la nube. No se sobrescribirán datos de otra cuenta.");
    }
   }catch{if(live)setNotice("Inicia sesión para editar tu JCard.");}
   finally{if(live)setLoading(false);}
  })();
  return()=>{live=false;};
 },[]);
 // Keep the raw services text while typing. Splitting and joining on each keypress
 // previously inserted spaces after commas and moved the caret backwards.
 const update=(key:Field,value:string)=>{
  if(key==="services"){setServicesInput(value);return;}
  setData(d=>({...d,[key]:key==="businessHandle"?value.replace(/^@+/,"").toLowerCase():value}));
 };
 useEffect(()=>{
  if(open!=="main")return;
  const handle=(data.businessHandle??"").trim().toLowerCase();
  if(!handle){setHandleFeedback("Puedes dejar este campo vacío.");return;}
  if(!BUSINESS_HANDLE_PATTERN.test(handle)){setHandleFeedback("Usa 3–30 caracteres. Empieza con una letra; admite números, puntos y guiones bajos.");return;}
  let active=true;setHandleFeedback("Comprobando disponibilidad...");
  const timer=setTimeout(()=>{void checkBusinessHandleAvailable(handle).then(available=>{
   if(active)setHandleFeedback(available?"Usuario empresarial disponible.":"Este nombre de usuario está ocupado.");
  }).catch(()=>{if(active)setHandleFeedback("No se pudo comprobar la disponibilidad.");});},400);
  return()=>{active=false;clearTimeout(timer);};
 },[open,data.businessHandle]);
 const value=(key:Field)=>key==="services"?servicesInput:key==="businessHandle"?"@"+(data.businessHandle??""):String(data[key]??"");
 const categoryOptions=[
  {code:"",label:"Ninguna (opcional)"},
  ...["Climatización HVAC","Refrigeración"].filter(label=>!catalog?.categories.some(c=>c.label===label)).map(label=>({code:label,label})),
  ...(catalog?.categories??[])
 ];
 const normalizedCategoryQuery=categoryQuery.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim();
 const visibleCategories=categoryOptions.filter(item=>item.label.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").includes(normalizedCategoryQuery));
 async function save(section:Section){
  if(saving)return;
  const year=new Date().getFullYear(),opened=data.opened.trim(),closed=data.closed.trim();
  if(section==="main"&&data.name.trim().length>30){setNotice("El nombre admite máximo 30 caracteres.");return;}
  const businessHandle=(data.businessHandle??"").trim().toLowerCase();
  if(section==="main"&&businessHandle&&!BUSINESS_HANDLE_PATTERN.test(businessHandle)){setNotice("El usuario empresarial debe tener entre 3 y 30 caracteres y empezar con una letra.");return;}
  if(section==="contact"&&[data.email,data.emailSecondary].some(v=>v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))){setNotice("Revisa los correos empresariales.");return;}
  if(section==="main"&&([opened,closed].some(v=>v&&(!/^\d{4}$/.test(v)||Number(v)<1800||Number(v)>year))||(opened&&closed&&Number(closed)<Number(opened)))){setNotice("Revisa los años de apertura y cierre.");return;}
  const parsedServices=servicesInput.split(",").map(v=>v.trim()).filter(Boolean);
  if(section==="services"&&(parsedServices.length>3||servicesInput.length>100)){setNotice("Máximo 3 servicios y 100 caracteres.");return;}
  if(section==="contact"&&[data.phoneLabel,data.phoneSecondaryLabel].some(v=>v&&Array.from(v).length>4)){setNotice("Identificadores: máximo 4 caracteres.");return;}
  setSaving(true);setNotice("");
  try{if(!editorOwner||(await appearanceOwner())!==editorOwner)throw new Error("La cuenta cambió. Abre de nuevo tu JCard.");if(section==="main"&&businessHandle&&!(await checkBusinessHandleAvailable(businessHandle)))throw new Error("Este usuario empresarial ya está ocupado.");
   if(section==="privacy"){await saveJCardVisibility(visibility);}else{const stored=await readCloudBusiness()??empty;const keys=sections.find(item=>item.id===section)?.keys??[];const clean:BusinessCardData={...empty,...stored};for(const key of keys){(clean as unknown as Record<string,unknown>)[key]=key==="services"?parsedServices:key==="name"?data.name.trim():key==="businessHandle"?businessHandle:data[key];}await writeCloudBusiness(clean,editorOwner);await writeScopedBusinessCard(editorOwner,clean);setData(clean);if(section==="services")setServicesInput(clean.services.join(", "));}setOpen(null);}
  catch(e){setNotice(e instanceof Error?e.message:"No se pudieron guardar los cambios.");}finally{setSaving(false);}
 }
 return <Screen demo={false} hideHeader hideFooter title="JCard de negocio" subtitle="">
  <View style={{gap:8,paddingTop:0,paddingBottom:8}}>
   {sections.map(section=><View key={section.id} style={[s.panel,{padding:JOBEEN_CONTROL.panelPadding,gap:JOBEEN_CONTROL.panelGap}]}>
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open===section.id}} onPress={()=>setOpen(current=>current===section.id?null:section.id)} style={{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:JOBEEN_CONTROL.accordionRowVerticalPadding,minHeight:JOBEEN_CONTROL.touchTarget}}>
     <Ionicons name={section.icon} size={23} color={colors.ink}/><Text style={[s.h3,{flex:1,fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined}]}>{section.title}</Text><Ionicons name={open===section.id?"chevron-up":"chevron-down"} size={20} color={colors.muted}/>
    </Pressable>
    {open===section.id&&<View style={{gap:12,paddingBottom:12}}>{section.keys.map(key=><View key={key} style={{gap:5}}><Text style={s.muted}>{fields[key]}</Text>{key==="category"?<View style={{gap:8}}>
  <Pressable accessibilityRole="button" accessibilityLabel="Seleccionar categoría empresarial" accessibilityState={{expanded:categoryOpen}}
   onPress={()=>{Keyboard.dismiss();setCategoryOpen(v=>!v);}} style={{minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:12,borderColor:colors.line,borderWidth:1,borderRadius:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10}}>
   <Text numberOfLines={1} style={{flex:1,color:data.category?colors.ink:colors.muted}}>{data.category||"Seleccionar categoría"}</Text>
   <Ionicons name={categoryOpen?"chevron-up":"chevron-down"} size={20} color={colors.ink}/>
  </Pressable>
  {categoryOpen&&<View style={{borderWidth:1,borderColor:colors.line,borderRadius:12,padding:8,gap:7}}>
   <TextInput accessibilityLabel="Buscar categoría empresarial" placeholder="Buscar categoría…" placeholderTextColor={colors.muted}
    value={categoryQuery} onChangeText={setCategoryQuery} autoCorrect={false}
    style={{minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:12,borderWidth:1,borderColor:colors.line,borderRadius:9,color:colors.ink}}/>
   <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always" style={{maxHeight:230}} showsVerticalScrollIndicator>
    {visibleCategories.map(option=><Pressable key={option.code||"none"} accessibilityRole="button" accessibilityState={{selected:data.category===option.label}}
     onPress={()=>{setData(d=>({...d,category:option.code?option.label:""}));setCategoryOpen(false);setCategoryQuery("");Keyboard.dismiss();}}
     style={{minHeight:JOBEEN_CONTROL.touchTarget,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:10,paddingVertical:6,borderRadius:9,backgroundColor:data.category===option.label?colors.line:colors.paper}}>
     <Ionicons name={data.category===option.label?"checkmark-circle":"grid-outline"} size={18} color={colors.ink}/>
     <Text style={{color:colors.ink,flex:1}}>{option.label}</Text>
    </Pressable>)}
    {!catalog&&<Text style={{color:colors.muted,padding:10,fontSize:12}}>Cargando catálogo de categorías…</Text>}
    {catalog&&visibleCategories.length===0&&<Text style={{color:colors.muted,padding:10}}>No se encontraron categorías.</Text>}
   </ScrollView>
  </View>}
 </View>:<TextInput accessibilityLabel={fields[key]} value={value(key)} onChangeText={v=>update(key,v)} maxLength={key==="businessHandle"?31:key==="name"?30:key==="services"?100:undefined} keyboardType={key==="opened"||key==="closed"?"number-pad":key.startsWith("email")?"email-address":key.startsWith("phone")&&!key.includes("Label")?"phone-pad":"default"} autoCapitalize={key.startsWith("email")||key==="businessHandle"?"none":"sentences"} autoCorrect={key==="businessHandle"||key==="services"?false:undefined} style={{borderWidth:1,borderColor:colors.line,borderRadius:10,padding:12,minHeight:JOBEEN_CONTROL.touchTarget,color:colors.ink}}/>}{key==="businessHandle"&&<Text style={s.muted}>{handleFeedback||"Opcional. Se mostrará como @usuario en menciones."}</Text>}</View>)}<Button title={saving?"Guardando…":"Guardar"} onPress={()=>void save(section.id)}/></View>}
   </View>)}
   <View style={[s.panel,{padding:JOBEEN_CONTROL.panelPadding,gap:JOBEEN_CONTROL.panelGap}]}><Pressable accessibilityRole="button" accessibilityState={{expanded:open==="privacy"}} onPress={()=>setOpen(v=>v==="privacy"?null:"privacy")} style={{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:JOBEEN_CONTROL.accordionRowVerticalPadding,minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name="lock-closed-outline" size={23} color={colors.ink}/><Text style={[s.h3,{flex:1,fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined}]}>Privacidad</Text><Ionicons name={open==="privacy"?"chevron-up":"chevron-down"} size={20} color={colors.muted}/></Pressable>{open==="privacy"&&<View style={{gap:12,paddingBottom:12}}>{([{key:"business_show_email",label:"Mostrar correo empresarial"},{key:"business_show_phone",label:"Mostrar teléfono empresarial"},{key:"business_enabled",label:"Mostrar mi JCard de negocio en el perfil"}] as const).map(item=><Pressable key={item.key} accessibilityRole="checkbox" accessibilityState={{checked:visibility[item.key]}} onPress={()=>{if(item.key==="business_enabled"&&visibility.business_enabled&&!visibility.personal_enabled){Alert.alert("Al menos una JCard activa","Debes conservar activa la JCard personal o la de negocio.");return;}setVisibility(v=>({...v,[item.key]:!v[item.key]}));}} style={{flexDirection:"row",gap:12,alignItems:"center",paddingVertical:8}}><Ionicons name={visibility[item.key]?"checkbox":"square-outline"} size={25} color={colors.ink}/><Text style={{color:colors.ink,flex:1}}>{item.label}</Text></Pressable>)}<Button title={saving?"Guardando…":"Guardar"} onPress={()=>void save("privacy")}/></View>}</View>
   <View style={[s.panel,{padding:JOBEEN_CONTROL.panelPadding,gap:JOBEEN_CONTROL.panelGap}]}><Pressable accessibilityRole="button" onPress={()=>router.push("/jcard-business-backgrounds")} style={{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:JOBEEN_CONTROL.accordionRowVerticalPadding,minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name="color-palette-outline" size={23} color={colors.ink}/><Text style={[s.h3,{flex:1,fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined}]}>Apariencia</Text><Ionicons name="chevron-forward" size={20} color={colors.muted}/></Pressable></View>
   {!!notice&&<Text style={{color:colors.ink}}>{notice}</Text>}

  </View>
 </Screen>;
}
