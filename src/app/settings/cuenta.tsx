import {Ionicons} from "@expo/vector-icons";
import {router,useLocalSearchParams} from "expo-router";
import {useCallback,useEffect,useRef,useState} from "react";
import {captureMessageScope,type MessageScope} from "../../lib/message-session";
import {Pressable,Text,View} from "react-native";
import {endJobinSession} from "../../components/AuthGate";
import {PageFrame,useUi} from "../../components/ui";
import {SettingsMenuRow} from "../../components/SettingsMenuRow";
import {JobeenNoticeDialog} from "../../components/JobeenNoticeDialog";
import {JOBEEN_TYPE} from "../../theme/typography";
type Item={label:string;detail:string;icon:React.ComponentProps<typeof Ionicons>["name"];route?:string;action?:()=>void};
export default function AccountSecurity(){
 const {s,colors}=useUi();const [signingOut,setSigningOut]=useState(false);const [exitOpen,setExitOpen]=useState(false);const [exitError,setExitError]=useState("");
 const {confirmExit}=useLocalSearchParams<{confirmExit?:string}>();
 const exitScope=useRef<MessageScope|null>(null),exitGuard=useRef(false);
 const requestExit=useCallback(async()=>{
  if(exitGuard.current)return;exitGuard.current=true;setExitError("");
  try{exitScope.current=await captureMessageScope();setExitOpen(true);}
  catch{setExitError("No se pudo verificar la sesión actual.");setExitOpen(true);}
  finally{exitGuard.current=false;}
 },[]);
 const consumedExitLink=useRef(false);
 useEffect(()=>{if(confirmExit==="1"&&!consumedExitLink.current){consumedExitLink.current=true;router.setParams({confirmExit:""});void requestExit();}},[confirmExit,requestExit]);
 const groups:{title:string;description:string;items:Item[]}[]=[
  {title:"Información de tu cuenta",description:"Mantén tus datos y tu perfil actualizados.",items:[
   {label:"Información personal",detail:"Nombre, correo electrónico y teléfono.",icon:"person-outline",route:"/settings/datos-personales"},
   {label:"Tipo de cuenta",detail:"Personal, empresa o ambas.",icon:"people-outline",route:"/settings/tipo-cuenta"},
   {label:"Editar JCard",detail:"",icon:"id-card-outline",route:"/professional"}]},
  {title:"Acceso y protección",description:"Opciones para mantener tu cuenta segura.",items:[
   {label:"Cambiar contraseña",detail:"Actualiza tu contraseña de acceso.",icon:"key-outline",route:"/change-password"},
   {label:"Verificar identidad",detail:"Envía tu documento de identidad para revisión privada.",icon:"id-card-outline",route:"/verify-identity"},
   {label:"Recuperar acceso",detail:"Opciones de recuperación de tu cuenta.",icon:"refresh-outline",route:"/recover-account"}]},
  {title:"Administrar cuenta",description:"Acciones importantes sobre tu cuenta.",items:[
   {label:"Desactivar o eliminar cuenta",detail:"Consulta las opciones de cierre de cuenta.",icon:"alert-circle-outline",route:"/settings/cierre-cuenta"}]},
 ];
 async function signOut(){const scope=exitScope.current;if(exitGuard.current||!scope)return;exitGuard.current=true;setSigningOut(true);setExitError("");try{await endJobinSession(scope);setExitOpen(false);}catch{setExitError("No se pudo cerrar sesión. Inténtalo de nuevo.");}finally{exitGuard.current=false;setSigningOut(false);}}
 return <><PageFrame kind="settings" bottomPadding={48}>
  {groups.map(group=><View key={group.title} style={{gap:8}}>
   <Text accessibilityRole="header" style={[s.h3,{fontSize:JOBEEN_TYPE.sectionTitle,fontWeight:"800"}]}>{group.title}</Text>
   <View style={{gap:2}}>{group.items.map(item=><SettingsMenuRow key={item.label} icon={item.icon} title={item.label}
    onPress={()=>{if(item.route)router.push(item.route as any);else item.action?.();}}/>)}</View>
  </View>)}
  <Pressable accessibilityRole="button" disabled={signingOut} onPress={()=>void requestExit()} style={{padding:17,borderRadius:18,borderWidth:1,borderColor:colors.line,alignItems:"center",flexDirection:"row",justifyContent:"center",gap:12}}>
   <Ionicons name="log-out-outline" size={23} color={colors.ink}/><Text style={[s.text,{fontWeight:"700"}]}>{signingOut?"Cerrando sesión…":"Cerrar sesión"}</Text>
  </Pressable>
  </PageFrame>
  <JobeenNoticeDialog visible={exitOpen} title="Cerrar sesión" description={exitError||"¿Quieres salir de tu cuenta de Jobin?"}
   tone="warning" confirmLabel="Cerrar sesión" onCancel={()=>{exitScope.current=null;setExitError("");setExitOpen(false);}} onConfirm={()=>void signOut()} busy={signingOut}/>
 </>;
}
