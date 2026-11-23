import {Ionicons} from "@expo/vector-icons";
import {Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {jobeenModalTokens,type JobeenNoticeTone} from "../theme/modals";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";

/** Branded, accessible confirmation for ordinary and important notices.
 * Royal Hive surfaces stay neutral; only icons/actions carry severity.
 */
export function JobeenNoticeDialog({visible,title,description,tone="neutral",confirmLabel="Aceptar",cancelLabel="Cancelar",onConfirm,onCancel,busy=false}:{
 visible:boolean;title:string;description:string;tone?:JobeenNoticeTone;confirmLabel?:string;cancelLabel?:string;
 onConfirm:()=>void;onCancel:()=>void;busy?:boolean;
}){
 const {theme}=useTheme();
 const t=jobeenModalTokens(theme,tone);
 const {width,fontScale}=useWindowDimensions();
 const inset=useSafeAreaInsets();
 const icon=tone==="danger"?"alert-circle-outline":tone==="warning"?"warning-outline":
  tone==="success"?"checkmark-circle-outline":tone==="info"?"information-circle-outline":"help-circle-outline";
 const destructive=tone==="danger";
 return <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={false} onRequestClose={()=>{if(!busy)onCancel();}}>
  <View style={{flex:1,justifyContent:"center",alignItems:"center",paddingHorizontal:JOBEEN_CONTROL.modalHorizontalPadding,paddingTop:inset.top+16,paddingBottom:inset.bottom+16}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" disabled={busy} onPress={onCancel}
    style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:t.scrim}}/>
   <View accessibilityViewIsModal style={{width:"100%",maxWidth:Math.min(420,width-2*JOBEEN_CONTROL.modalHorizontalPadding),maxHeight:"100%",borderRadius:t.radius.dialog,
    backgroundColor:t.surface,borderColor:t.border,borderWidth:1,padding:16}}>
    <ScrollView style={{flexShrink:1}} contentContainerStyle={{gap:12}} keyboardShouldPersistTaps="handled">
    <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
     <View style={{width:42,height:42,borderRadius:21,backgroundColor:t.background,
      justifyContent:"center",alignItems:"center"}}>
      <Ionicons name={icon} size={24} color={t.icon}/>
     </View>
     <Text accessibilityRole="header" style={{flex:1,color:t.text,fontSize:JOBEEN_TYPE.modalTitle,
      lineHeight:JOBEEN_LINE_HEIGHT.modalTitle,fontWeight:"800"}}>{title}</Text>
    </View>
    <Text style={{color:t.muted,fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body}}>{description}</Text>
    <View style={{flexDirection:fontScale>1.3||width<280?"column":"row",gap:8,marginTop:4}}>
     <Pressable accessibilityRole="button" accessibilityLabel={cancelLabel} disabled={busy} onPress={onCancel}
      style={{flexGrow:1,flexBasis:fontScale>1.3||width<280?"auto":0,minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:8,paddingVertical:10,borderRadius:t.radius.control,borderColor:t.outline,borderWidth:1,
       alignItems:"center",justifyContent:"center",backgroundColor:t.inner}}>
      <Text style={{color:t.text,fontSize:JOBEEN_TYPE.action,textAlign:"center",fontWeight:"700"}}>{cancelLabel}</Text>
     </Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={confirmLabel} disabled={busy} onPress={onConfirm}
      style={{flexGrow:1,flexBasis:fontScale>1.3||width<280?"auto":0,minHeight:JOBEEN_CONTROL.touchTarget,paddingHorizontal:8,paddingVertical:10,borderRadius:t.radius.control,alignItems:"center",justifyContent:"center",
       backgroundColor:destructive?t.background:t.accent,opacity:busy?0.5:1}}>
      <Text style={{fontSize:JOBEEN_TYPE.action,fontWeight:"800",
       color:destructive?t.destructiveOnColor:t.onAccent}}>{busy?"Procesando...":confirmLabel}</Text>
     </Pressable>
    </View>
    </ScrollView>
   </View>
  </View>
 </Modal>;
}
