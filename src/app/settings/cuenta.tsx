import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useState} from "react";
import {Alert,Pressable,ScrollView,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {endJobinSession} from "../../components/AuthGate";
import {useUi} from "../../components/ui";
import {requireSupabase} from "../../lib/supabase";
type Item={label:string;detail:string;icon:React.ComponentProps<typeof Ionicons>["name"];route?:string;action?:()=>void};
export default function AccountSecurity(){
 const {s,colors}=useUi();const [signingOut,setSigningOut]=useState(false);
 const groups:{title:string;description:string;items:Item[]}[]=[
  {title:"Información de tu cuenta",description:"Mantén tus datos y tu perfil actualizados.",items:[
   {label:"Información personal",detail:"Nombre, correo electrónico y teléfono.",icon:"person-outline",route:"/settings/datos-personales"},
   {label:"Tipo de cuenta",detail:"Personal, empresa o ambas.",icon:"people-outline",route:"/settings/tipo-cuenta"},
   {label:"Editar mi perfil",detail:"Actualiza tu perfil y tu JCard.",icon:"id-card-outline",route:"/professional"}]},
  {title:"Acceso y protección",description:"Opciones para mantener tu cuenta segura.",items:[
   {label:"Cambiar contraseña",detail:"Actualiza tu contraseña de acceso.",icon:"key-outline",route:"/change-password"},
   {label:"Verificación de cuenta",detail:"Consulta la verificación de correo y teléfono.",icon:"shield-checkmark-outline",route:"/settings/verificacion"},
   {label:"Dispositivos y sesiones",detail:"Consulta los accesos y dispositivos.",icon:"phone-portrait-outline",route:"/settings/sesiones"},
   {label:"Recuperar acceso",detail:"Opciones de recuperación de tu cuenta.",icon:"refresh-outline",route:"/recover-account"}]},
  {title:"Administrar cuenta",description:"Acciones importantes sobre tu cuenta.",items:[
   {label:"Desactivar o eliminar cuenta",detail:"Consulta las opciones de cierre de cuenta.",icon:"alert-circle-outline",route:"/settings/cierre-cuenta"}]},
 ];
 async function signOut(){if(signingOut)return;setSigningOut(true);try{await endJobinSession();router.replace("/login");}catch{Alert.alert("No se pudo cerrar sesión","Inténtalo de nuevo.");}finally{setSigningOut(false);}}
 return <SafeAreaView edges={["bottom"]} style={s.screen}><ScrollView contentContainerStyle={{padding:22,paddingBottom:48,gap:28,maxWidth:720,width:"100%",alignSelf:"center"}}>
  <View style={{gap:8}}><Text style={[s.h2,{fontWeight:"700",fontStyle:"normal",fontFamily:undefined}]}>Cuenta y seguridad</Text><Text style={s.muted}>Tus datos, tu acceso y tu seguridad en un solo lugar.</Text></View>
  {groups.map(group=><View key={group.title} style={{gap:12}}>
   <Text accessibilityRole="header" style={[s.h3,{fontSize:20}]}>{group.title}</Text><Text style={s.muted}>{group.description}</Text>
   <View style={{gap:4}}>{group.items.map(item=><Pressable key={item.label} accessibilityRole="button" onPress={()=>{if(item.route)router.push(item.route as any);}} style={({pressed})=>({flexDirection:"row",alignItems:"center",gap:15,paddingVertical:16,opacity:pressed?0.6:1,minHeight:70})}>
    <Ionicons name={item.icon} size={25} color={colors.ink}/><View style={{flex:1,gap:4}}><Text style={[s.text,{fontSize:16,fontWeight:"600"}]}>{item.label}</Text><Text style={s.muted}>{item.detail}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.muted}/>
   </Pressable>)}</View>
  </View>)}
  <Pressable accessibilityRole="button" disabled={signingOut} onPress={()=>Alert.alert("Cerrar sesión","¿Quieres salir de tu cuenta de Jobin?",[{text:"Cancelar",style:"cancel"},{text:"Cerrar sesión",style:"destructive",onPress:()=>void signOut()}])} style={{padding:17,borderRadius:14,borderWidth:1,borderColor:colors.line,alignItems:"center",flexDirection:"row",justifyContent:"center",gap:12}}>
   <Ionicons name="log-out-outline" size={23} color={colors.ink}/><Text style={[s.text,{fontWeight:"700"}]}>{signingOut?"Cerrando sesión…":"Cerrar sesión"}</Text>
  </Pressable>
 </ScrollView></SafeAreaView>;
}
