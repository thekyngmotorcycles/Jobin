import {Ionicons} from "@expo/vector-icons";
import {Modal,Pressable,Text,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {jobeenModalTokens,type JobeenNoticeTone} from "../theme/modals";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";

/** Branded, accessible confirmation for ordinary and important notices.
 * In the light theme the surface stays warm; only icons/actions carry severity.
 */
export function JobeenNoticeDialog({visible,title,description,tone="neutral",confirmLabel="Aceptar",cancelLabel="Cancelar",onConfirm,onCancel,busy=false}:{
 visible:boolean;title:string;description:string;tone?:JobeenNoticeTone;confirmLabel?:string;cancelLabel?:string;
 onConfirm:()=>void;onCancel:()=>void;busy?:boolean;
}){
 const {theme}=useTheme();
 const t=jobeenModalTokens(theme,tone);
 const {width}=useWindowDimensions();
 const inset=useSafeAreaInsets();
 const icon=tone==="danger"?"alert-circle-outline":tone==="warning"?"warning-outline":
  tone==="success"?"checkmark-circle-outline":tone==="info"?"information-circle-outline":"help-circle-outline";
 const destructive=tone==="danger";
 return <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={false} onRequestClose={onCancel}>
  <View style={{flex:1,justifyContent:"center",alignItems:"center",paddingHorizontal:18,paddingVertical:inset.top+20}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={onCancel}
    style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:t.scrim}}/>
   <View accessibilityViewIsModal style={{width:"100%",maxWidth:Math.min(420,width-36),borderRadius:t.radius.dialog,
    backgroundColor:t.surface,borderColor:t.border,borderWidth:1,padding:19,gap:14}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:11}}>
     <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.background,
      justifyContent:"center",alignItems:"center"}}>
      <Ionicons name={icon} size={24} color={t.icon}/>
     </View>
     <Text accessibilityRole="header" style={{flex:1,color:t.text,fontSize:JOBEEN_TYPE.modalTitle,
      lineHeight:JOBEEN_LINE_HEIGHT.modalTitle,fontWeight:"800"}}>{title}</Text>
    </View>
    <Text style={{color:t.muted,fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body}}>{description}</Text>
    <View style={{flexDirection:"row",gap:10,marginTop:4}}>
     <Pressable accessibilityRole="button" accessibilityLabel={cancelLabel} disabled={busy} onPress={onCancel}
      style={{flex:1,minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:t.radius.control,borderColor:t.border,borderWidth:1,
       alignItems:"center",justifyContent:"center",backgroundColor:t.inner}}>
      <Text style={{color:t.text,fontSize:JOBEEN_TYPE.action,fontWeight:"700"}}>{cancelLabel}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={confirmLabel} disabled={busy} onPress={onConfirm}
      style={{flex:1,minHeight:JOBEEN_CONTROL.touchTarget,borderRadius:t.radius.control,alignItems:"center",justifyContent:"center",
       backgroundColor:destructive&&theme==="light"?t.icon:t.accent,opacity:busy?0.5:1}}>
      <Text style={{fontSize:JOBEEN_TYPE.action,fontWeight:"800",
       color:destructive&&theme==="light"?t.destructiveOnColor:t.text}}>{busy?"Procesando...":confirmLabel}</Text>
     </Pressable>
    </View>
   </View>
  </View>
 </Modal>;
}
