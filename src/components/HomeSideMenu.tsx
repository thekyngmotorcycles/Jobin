import {JobinMenuIcon} from "./JobinMenuIcon";
import {router} from "expo-router";
import {useEffect,useRef,useState} from "react";
import {Animated,Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useUi} from "./ui";
import {opacity} from "../theme/color";
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
 const {colors}=useUi();const {width}=useWindowDimensions();const panelWidth=Math.min(width*0.88,410);
 const touchStart=useRef<{x:number;y:number}|null>(null);
 const [mounted,setMounted]=useState(visible);
 const slide=useRef(new Animated.Value(visible?1:0)).current;
 const backdrop=useRef(new Animated.Value(visible?1:0)).current;
 useEffect(()=>{
  if(visible)setMounted(true);
  backdrop.stopAnimation();
  backdrop.setValue(visible?1:0);
  slide.stopAnimation();
  Animated.timing(slide,{toValue:visible?1:0,duration:visible?290:240,useNativeDriver:true}).start(({finished})=>{
   if(finished&&!visible)setMounted(false);
  });
  return()=>slide.stopAnimation();
 },[visible,slide,backdrop]);
 return <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent={false}>
  <View style={{flex:1,flexDirection:"row"}}>
   <Animated.View pointerEvents="none" style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:colors.scrim,opacity:backdrop}}/>
   <Animated.View style={{width:panelWidth,transform:[{translateX:slide.interpolate({inputRange:[0,1],outputRange:[-panelWidth,0]})}]}}>
    <SafeAreaView edges={["top","bottom"]} onTouchStart={event=>{touchStart.current={x:event.nativeEvent.pageX,y:event.nativeEvent.pageY};}} onTouchEnd={event=>{const start=touchStart.current;if(start&&start.x-event.nativeEvent.pageX>70&&Math.abs(start.y-event.nativeEvent.pageY)<70)onClose();touchStart.current=null;}} style={{flex:1,backgroundColor:opacity(colors.paper,0.69),borderTopRightRadius:18,borderBottomRightRadius:18,overflow:"hidden"}}>
     <ScrollView contentContainerStyle={{paddingHorizontal:18,paddingTop:22,paddingBottom:32,gap:10}}>
      <View style={{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",paddingBottom:16,gap:8}}>
       <Text accessibilityRole="header" style={{color:colors.ink,fontWeight:"700",fontSize:22,lineHeight:30,flex:1}}>Configuración y privacidad</Text>
       <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={{padding:8}}><Text style={{color:colors.ink,fontSize:24}}>×</Text></Pressable>
      </View>
      {HOME_MENU_ITEMS.map(item=><Pressable key={item.slug} accessibilityRole="button" accessibilityLabel={item.label}
       onPress={()=>{onClose();router.push({pathname:"/menu/[section]",params:{section:item.slug}});}}
       style={({pressed})=>({flexDirection:"row",alignItems:"center",paddingHorizontal:14,paddingVertical:16,minHeight:60,gap:14,borderRadius:12,backgroundColor:opacity(colors.paper,0.85),opacity:pressed?0.65:1})}>
       <View style={{width:32,alignItems:"center",flexShrink:0}}><JobinMenuIcon name={item.slug} size={25} color={colors.ink}/></View>
       <Text style={{color:colors.ink,fontSize:16,flex:1,fontWeight:"600"}}>{item.label}</Text>
      </Pressable>)}
     </ScrollView>
    </SafeAreaView>
   </Animated.View>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú tocando fuera" onPress={onClose} style={{flex:1}}/>
  </View>
 </Modal>;
}
