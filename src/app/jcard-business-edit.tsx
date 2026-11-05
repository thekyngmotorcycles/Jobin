import {useEffect,useState} from "react";
import {router} from "expo-router";
import {Pressable,Text,TextInput,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Ionicons} from "@expo/vector-icons";
import {Screen,Button,useUi} from "../components/ui";
import {readCloudBusiness,writeCloudBusiness} from "../lib/jcard-cloud";
import type {BusinessCardData} from "../lib/jcard";

type Field="name"|"category"|"opened"|"closed"|"email"|"emailSecondary"|"phone"|"phoneLabel"|"phoneSecondary"|"phoneSecondaryLabel"|"location"|"services";
type Section="main"|"contact"|"services";
const empty:BusinessCardData={name:"",category:"",opened:"",closed:"",email:"",emailSecondary:"",phone:"",phoneSecondary:"",phoneLabel:"",phoneSecondaryLabel:"",location:"",services:[],licenseVerified:false,rating:null,reviewCount:0};
const fields:Record<Field,string>={name:"Nombre de empresa",category:"Categoría profesional",opened:"Año de apertura",closed:"Año de cierre",email:"Correo empresarial",emailSecondary:"Correo secundario",phone:"Teléfono empresarial",phoneLabel:"Identificador de teléfono 1",phoneSecondary:"Teléfono secundario",phoneSecondaryLabel:"Identificador de teléfono 2",location:"Ubicación",services:"Servicios (máximo 3, separados por comas)"};
const sections:{id:Section;title:string;icon:React.ComponentProps<typeof Ionicons>["name"];keys:Field[]}[]=[
 {id:"main",title:"Datos principales",icon:"business-outline",keys:["name","category","opened","closed"]},
 {id:"contact",title:"Datos de contacto",icon:"mail-outline",keys:["email","emailSecondary","phone","phoneLabel","phoneSecondary","phoneSecondaryLabel","location"]},
 {id:"services",title:"Servicios y actividad",icon:"briefcase-outline",keys:["services"]}
];
export default function BusinessEditor(){
 const {s,colors}=useUi();
 const [data,setData]=useState<BusinessCardData>(empty);
 const [open,setOpen]=useState<Section|null>(null);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{let live=true;void (async()=>{try{const local=await AsyncStorage.getItem("jobin.business.card.v1");const cached=local?JSON.parse(local) as BusinessCardData:empty;if(live)setData({...empty,...cached});const cloud=await readCloudBusiness();if(live&&cloud)setData(current=>({...current,...cloud}));}catch{if(live)setNotice("No se pudo sincronizar; revisa los datos antes de guardar.");}finally{if(live)setLoading(false);}})();return()=>{live=false;};},[]);
 const update=(key:Field,value:string)=>setData(d=>({...d,[key]:key==="services"?value.split(",").map(v=>v.trim()):value}));
 const value=(key:Field)=>key==="services"?data.services.join(", "):String(data[key]??"");
 async function save(){
  if(saving)return;
  const year=new Date().getFullYear(),opened=data.opened.trim(),closed=data.closed.trim();
  if(data.name.trim().length>30){setNotice("El nombre admite máximo 30 caracteres.");return;}
  if([data.email,data.emailSecondary].some(v=>v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))){setNotice("Revisa los correos empresariales.");return;}
  if([opened,closed].some(v=>v&&(!/^\d{4}$/.test(v)||Number(v)<1800||Number(v)>year))||(opened&&closed&&Number(closed)<Number(opened))){setNotice("Revisa los años de apertura y cierre.");return;}
  if(data.services.filter(Boolean).length>3||data.services.join(", ").length>100){setNotice("Máximo 3 servicios y 100 caracteres.");return;}
  if([data.phoneLabel,data.phoneSecondaryLabel].some(v=>v&&Array.from(v).length>4)){setNotice("Identificadores: máximo 4 caracteres.");return;}
  setSaving(true);setNotice("");
  try{const clean={...data,name:data.name.trim(),services:data.services.filter(Boolean)};await writeCloudBusiness(clean);await AsyncStorage.setItem("jobin.business.card.v1",JSON.stringify(clean));router.back();}
  catch(e){setNotice(e instanceof Error?e.message:"No se pudieron guardar los cambios.");}finally{setSaving(false);}
 }
 return <Screen demo={false} hideHeader hideFooter title="JCard de negocio" subtitle="">
  <View style={{gap:8}}>
   {sections.map(section=><View key={section.id} style={s.panel}>
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open===section.id}} onPress={()=>setOpen(current=>current===section.id?null:section.id)} style={{flexDirection:"row",alignItems:"center",gap:13,paddingVertical:16}}>
     <Ionicons name={section.icon} size={25} color={colors.ink}/><Text style={[s.h3,{flex:1,fontSize:18,fontStyle:"normal",fontFamily:undefined}]}>{section.title}</Text><Ionicons name={open===section.id?"chevron-up":"chevron-down"} size={20} color={colors.muted}/>
    </Pressable>
    {open===section.id&&<View style={{gap:12,paddingBottom:12}}>{section.keys.map(key=><View key={key} style={{gap:5}}><Text style={s.muted}>{fields[key]}</Text><TextInput accessibilityLabel={fields[key]} value={value(key)} onChangeText={v=>update(key,v)} maxLength={key==="name"?30:key==="services"?100:undefined} keyboardType={key==="opened"||key==="closed"?"number-pad":key.startsWith("email")?"email-address":key.startsWith("phone")&&!key.includes("Label")?"phone-pad":"default"} autoCapitalize={key.startsWith("email")?"none":"sentences"} style={{borderWidth:1,borderColor:colors.line,borderRadius:10,padding:12,minHeight:44,color:colors.ink}}/></View>)}</View>}
   </View>)}
   <View style={s.panel}><Pressable accessibilityRole="button" onPress={()=>router.push("/jcard-business-backgrounds")} style={{flexDirection:"row",alignItems:"center",gap:13,paddingVertical:16}}><Ionicons name="color-palette-outline" size={25} color={colors.ink}/><Text style={[s.h3,{flex:1,fontSize:18,fontStyle:"normal",fontFamily:undefined}]}>Apariencia</Text><Ionicons name="chevron-forward" size={20} color={colors.muted}/></Pressable></View>
   {!!notice&&<Text style={{color:colors.ink}}>{notice}</Text>}
   <Button title={saving?"Guardando…":"Guardar cambios de JCard"} onPress={()=>void save()}/>
  </View>
 </Screen>;
}
