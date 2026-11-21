import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useState} from "react";
import {Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {endJobinSession} from "../../components/AuthGate";
import {useUi} from "../../components/ui";
import {SettingsMenuRow} from "../../components/SettingsMenuRow";
import {JobeenNoticeDialog} from "../../components/JobeenNoticeDialog";
import {JOBEEN_TYPE} from "../../theme/typography";
import {JOBEEN_CONTROL} from "../../theme/control-metrics";
type Item={label:string;detail:string;icon:React.ComponentProps<typeof Ionicons>["name"];route?:string;action?:()=>void};
export default function AccountSecurity(){
 const {s,colors}=useUi();const [signingOut,setSigningOut]=useState(false);const [exitOpen,setExitOpen]=useState(false);const [exitError,setExitError]=useState("");
 const groups:{title:string;description:string;items:Item[]}[]=[
  {title:"Información de tu cuenta",description:"Mantén tus datos y tu perfil actualizados.",items:[
   {label:"Información personal",detail:"Nombre, correo electrónico y teléfono.",icon:"person-outline",route:"/settings/datos-personales"},
   {label:"Tipo de cuenta",detail:"Personal, empresa o ambas.",icon:"people-outline",route:"/settings/tipo-cuenta"},
   {label:"Editar mi perfil",detail:"Actualiza tu perfil y tu JCard.",icon:"id-card-outline",route:"/professional"}]},
  {title:"Acceso y protección",description:"Opciones para mantener tu cuenta segura.",items:[
   {label:"Cambiar contraseña",detail:"Actualiza tu contraseña de acceso.",icon:"key-outline",route:"/change-password"},
   {label:"Verificación de cuenta",detail:"Consulta la verificación de correo y teléfono.",icon:"shield-checkmark-outline",route:"/settings/verificacion"},
   {label:"Verificar identidad",detail:"Envía tu documento de identidad para revisión privada.",icon:"id-card-outline",route:"/verify-identity"},
   {label:"Dispositivos y sesiones",detail:"Consulta los accesos y dispositivos.",icon:"phone-portrait-outline",route:"/settings/sesiones"},
   {label:"Recuperar acceso",detail:"Opciones de recuperación de tu cuenta.",icon:"refresh-outline",route:"/recover-account"}]},
  {title:"Administrar cuenta",description:"Acciones importantes sobre tu cuenta.",items:[
   {label:"Desactivar o eliminar cuenta",detail:"Consulta las opciones de cierre de cuenta.",icon:"alert-circle-outline",route:"/settings/cierre-cuenta"}]},
 ];
 async function signOut(){if(signingOut)return;setSigningOut(true);setExitError("");try{await endJobinSession();setExitOpen(false);router.replace("/login");}catch{setExitError("No se pudo cerrar sesión. Inténtalo de nuevo.");}finally{setSigningOut(false);}}
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:JOBEEN_CONTROL.pageHorizontalPadding,paddingBottom:48,gap:16,maxWidth:720,width:"100%",alignSelf:"center"}}>
  <Text style={s.muted}>Tus datos, tu acceso y tu seguridad en un solo lugar.</Text>
  {groups.map(group=><View key={group.title} style={{gap:8}}>
   <Text accessibilityRole="header" style={[s.h3,{fontSize:JOBEEN_TYPE.sectionTitle,fontWeight:"800"}]}>{group.title}</Text><Text style={s.muted}>{group.description}</Text>
   <View style={{gap:7}}>{group.items.map(item=><SettingsMenuRow key={item.label} icon={item.icon} title={item.label} description={item.detail}
    onPress={()=>{if(item.route)router.push(item.route as any);else item.action?.();}}/>)}</View>
  </View>)}
  <Pressable accessibilityRole="button" disabled={signingOut} onPress={()=>setExitOpen(true)} style={{padding:17,borderRadius:18,borderWidth:1,borderColor:colors.line,alignItems:"center",flexDirection:"row",justifyContent:"center",gap:12}}>
   <Ionicons name="log-out-outline" size={23} color={colors.ink}/><Text style={[s.text,{fontWeight:"700"}]}>{signingOut?"Cerrando sesión…":"Cerrar sesión"}</Text>
  </Pressable>
 {!!exitError&&<Text accessibilityLiveRegion="polite" style={[s.muted,{color:colors.ink}]}>{exitError}</Text>}
  </ScrollView>
  <JobeenNoticeDialog visible={exitOpen} title="Cerrar sesión" description="¿Quieres salir de tu cuenta de Jobeen?"
   tone="warning" confirmLabel="Cerrar sesión" onCancel={()=>setExitOpen(false)} onConfirm={()=>void signOut()} busy={signingOut}/>
 </SafeAreaView>;
}
