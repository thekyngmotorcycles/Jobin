import {menuChrome} from "../theme/menu-chrome";
import {useTheme} from "../state/ThemeProvider";
import {JobinSettingsIcon} from "./JobinSettingsIcon";
import {JOBIN_SETTINGS_GROUPS} from "../lib/jobin-settings-catalog";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useEffect,useMemo,useRef,useState} from "react";
import {Animated,Modal,Pressable,ScrollView,Text,TextInput,View,useWindowDimensions} from "react-native";
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
export function HomeSideMenu({visible,onClose,onNavigate}:{visible:boolean;onClose:()=>void;onNavigate?:()=>void}){
 const {colors}=useUi();const {theme}=useTheme();const chrome=menuChrome(theme,colors);const {width}=useWindowDimensions();const panelWidth=Math.min(width*0.88,410);
 const touchStart=useRef<{x:number;y:number}|null>(null);
 const [mounted,setMounted]=useState(visible);
 const [query,setQuery]=useState("");
 const filtered=useMemo(()=>JOBIN_SETTINGS_GROUPS.map(group=>({...group,items:group.items.filter(entry=>(entry.title+" "+entry.description).toLowerCase().includes(query.trim().toLowerCase()))})).filter(group=>group.items.length>0),[query]);
 const slide=useRef(new Animated.Value(visible?1:0)).current;
 const backdrop=useRef(new Animated.Value(visible?1:0)).current;
 useEffect(()=>{
  if(visible)setMounted(true);
  backdrop.stopAnimation();
  backdrop.setValue(visible?1:0);
  slide.stopAnimation();
  Animated.timing(slide,{toValue:visible?1:0,duration:visible?160:130,useNativeDriver:true}).start(({finished})=>{
   if(finished&&!visible)setMounted(false);
  });
  return()=>slide.stopAnimation();
 },[visible,slide,backdrop]);
 return <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent={false}>
  <View style={{flex:1,flexDirection:"row"}}>
   <Animated.View pointerEvents="none" style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:colors.scrim,opacity:backdrop}}/>
   <Animated.View style={{width:panelWidth,transform:[{translateX:slide.interpolate({inputRange:[0,1],outputRange:[-panelWidth,0]})}]}}>
    <SafeAreaView edges={["top","bottom"]} onTouchStart={event=>{touchStart.current={x:event.nativeEvent.pageX,y:event.nativeEvent.pageY};}} onTouchEnd={event=>{const start=touchStart.current;if(start&&start.x-event.nativeEvent.pageX>70&&Math.abs(start.y-event.nativeEvent.pageY)<70)onClose();touchStart.current=null;}} style={{flex:1,backgroundColor:chrome.surfaceTranslucent,borderTopRightRadius:18,borderBottomRightRadius:18,overflow:"hidden"}}>
     <ScrollView contentContainerStyle={{paddingHorizontal:18,paddingTop:22,paddingBottom:32,gap:10,alignItems:"stretch"}}>
      <View style={{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",paddingBottom:16,gap:8}}>
       <Text accessibilityRole="header" style={{color:chrome.text,fontWeight:"700",fontSize:22,lineHeight:30,flex:1}}>Configuración</Text>
       <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={{padding:8}}><Text style={{color:chrome.text,fontSize:24}}>×</Text></Pressable>
      </View>
      <View style={{flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:chrome.border,borderRadius:14,paddingHorizontal:12,gap:10,marginBottom:14}}>
       <Ionicons name="search-outline" size={21} color={chrome.muted}/>
       <TextInput accessibilityLabel="Buscar configuración" value={query} onChangeText={setQuery} placeholder="Buscar configuración" placeholderTextColor={chrome.muted} style={{flex:1,minHeight:50,color:chrome.text,fontSize:15}}/>
      </View>
      {filtered.map(group=><View key={group.title} style={{gap:9,marginBottom:15}}>
       <Text accessibilityRole="header" style={{color:chrome.text,fontWeight:"700",fontSize:20}}>{group.title}</Text>
       <Text style={{color:chrome.muted,fontSize:13,marginBottom:4}}>{group.description}</Text>
       {group.items.map(entry=><Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={entry.title}
        onPress={()=>{onNavigate?.();onClose();if(entry.route){router.push(entry.route as any);}else{router.push({pathname:"/settings/[item]",params:{item:entry.id}});}}}
        style={({pressed})=>({flexDirection:"row",alignItems:"center",gap:13,paddingVertical:13,paddingHorizontal:10,borderRadius:12,backgroundColor:pressed?chrome.action:chrome.sunflower?opacity(chrome.text,0.065):colors.transparent,opacity:pressed?.72:1})}>
        <JobinSettingsIcon id={entry.id} size={25} color={chrome.text}/>
        <View style={{flex:1,gap:3}}><Text style={{color:chrome.text,fontSize:15,fontWeight:"600"}}>{entry.title}</Text><Text style={{color:chrome.muted,fontSize:12}}>{entry.description}</Text></View>
        <Ionicons name="chevron-forward" size={17} color={chrome.muted}/>
       </Pressable>)}
      </View>)}
      {filtered.length===0&&<Text style={{color:chrome.muted}}>No encontramos opciones con ese nombre.</Text>}
     </ScrollView>
    </SafeAreaView>
   </Animated.View>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú tocando fuera" onPress={onClose} style={{flex:1}}/>
  </View>
 </Modal>;
}
