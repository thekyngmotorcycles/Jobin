import {JobinMenuIcon} from "./JobinMenuIcon";
import {router} from "expo-router";
import {useRef} from "react";
import {Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useUi} from "./ui";
export const HOME_MENU_ITEMS=[
 {slug:"configuracion",label:"Configuración",icon:"person-circle-outline",description:"Preferencias generales de tu cuenta."},
 {slug:"centro-privacidad",label:"Centro de privacidad",icon:"lock-closed-outline",description:"Controla quién puede ver tu información."},
 {slug:"administracion-tiempo",label:"Administración del tiempo",icon:"time-outline",description:"Gestiona cuánto tiempo utilizas Jobin."},
 {slug:"solicitudes-dispositivos",label:"Solicitudes de dispositivos",icon:"shield-checkmark-outline",description:"Revisa solicitudes y sesiones de dispositivos."},
 {slug:"actividad-publicitaria",label:"Tu actividad publicitaria",icon:"desktop-outline",description:"Consulta y administra tu actividad publicitaria."},
 {slug:"pedidos-pagos",label:"Pedidos y pagos",icon:"card-outline",description:"Consulta tus pedidos y métodos de pago."},
 {slug:"historial-enlaces",label:"Historial de enlaces",icon:"link-outline",description:"Consulta los enlaces que hayas abierto."},
 {slug:"modo-oscuro",label:"Modo oscuro",icon:"moon-outline",description:"Personaliza la apariencia de Jobin."},
 {slug:"idioma",label:"Idioma",icon:"globe-outline",description:"Elige el idioma de la aplicación."},
 {slug:"icono-app",label:"Ícono de la app",icon:"apps-outline",description:"Personaliza el ícono de Jobin."},
 {slug:"uso-datos",label:"Uso de datos del celular",icon:"phone-portrait-outline",description:"Administra el consumo de datos móviles."},
] as const;
export function HomeSideMenu({visible,onClose}:{visible:boolean;onClose:()=>void}){
 const {colors}=useUi();const {width}=useWindowDimensions();const touchStart=useRef<{x:number;y:number}|null>(null);
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent={false}>
  <View style={{flex:1,flexDirection:"row",backgroundColor:"rgba(0,0,0,0.46)"}}>
   <SafeAreaView edges={["top","bottom"]} onTouchStart={event=>{touchStart.current={x:event.nativeEvent.pageX,y:event.nativeEvent.pageY};}} onTouchEnd={event=>{const start=touchStart.current;if(start&&start.x-event.nativeEvent.pageX>70&&Math.abs(start.y-event.nativeEvent.pageY)<70)onClose();touchStart.current=null;}} style={{width:Math.min(width*0.88,410),backgroundColor:colors.paper,flex:1}}>
    <ScrollView contentContainerStyle={{paddingTop:14,paddingBottom:32}}>
     <View style={{paddingHorizontal:24,paddingTop:15,paddingBottom:12}}><Text accessibilityRole="header" style={{color:colors.ink,fontWeight:"700",fontSize:23,lineHeight:30}}>Configuración y privacidad</Text></View>
     {HOME_MENU_ITEMS.map(item=><Pressable key={item.slug} accessibilityRole="button" accessibilityLabel={item.label}
      onPress={()=>{onClose();router.push({pathname:"/menu/[section]",params:{section:item.slug}});}}
      style={({pressed})=>({flexDirection:"row",alignItems:"center",paddingHorizontal:28,paddingVertical:15,minHeight:68,gap:22,opacity:pressed?0.55:1})}>
      <JobinMenuIcon name={item.slug} size={29} color={colors.ink}/>
      <Text style={{color:colors.ink,fontSize:17,flex:1,fontWeight:"400"}}>{item.label}</Text>
     </Pressable>)}
    </ScrollView>
   </SafeAreaView>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={{flex:1}}/>
  </View>
 </Modal>;
}
