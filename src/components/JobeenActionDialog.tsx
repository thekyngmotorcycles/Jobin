import {Ionicons} from "@expo/vector-icons";
import {Modal,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTheme} from "../state/ThemeProvider";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {SettingsMenuRow} from "./SettingsMenuRow";

export type JobeenMenuAction={
 label:string;description?:string;icon?:keyof typeof Ionicons.glyphMap;
 tone?:"normal"|"danger";onPress:()=>void;
};

/** Compact, semantic Jobeen action menu with no compulsory decorative icons. */
export function JobeenActionDialog({visible,title,description,actions,onClose,busy=false,error=""}:{
 visible:boolean;title:string;description?:string;actions:JobeenMenuAction[];
 onClose:()=>void;busy?:boolean;error?:string;
}){
 const {theme}=useTheme();const modal=jobeenModalTokens(theme);
 const {width}=useWindowDimensions();const insets=useSafeAreaInsets();
 const close=()=>{if(!busy)onClose();};
 return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent={false} onRequestClose={close}>
  <View style={{flex:1,alignItems:"center",justifyContent:"center",
   paddingHorizontal:18,paddingVertical:Math.max(insets.top,insets.bottom)+16}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones" disabled={busy} onPress={close}
    style={{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:modal.scrim}}/>
   <View accessibilityViewIsModal style={{width:"100%",maxWidth:Math.min(420,width-36),maxHeight:"90%",
    backgroundColor:modal.surface,borderRadius:modal.radius.dialog,borderWidth:1,borderColor:modal.border,
    paddingHorizontal:16,paddingTop:12,paddingBottom:16,gap:8}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
     <Text accessibilityRole="header" style={{flex:1,color:modal.text,fontSize:JOBEEN_TYPE.modalTitle,
      lineHeight:JOBEEN_LINE_HEIGHT.modalTitle,fontWeight:"800"}}>{title}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" disabled={busy} onPress={close}
      style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,
       alignItems:"center",justifyContent:"center"}}>
      <Ionicons name="close" size={22} color={modal.text}/>
     </Pressable>
    </View>
    {!!description&&<Text style={{fontSize:JOBEEN_TYPE.secondary,color:modal.muted,
     lineHeight:JOBEEN_LINE_HEIGHT.secondary,marginBottom:4}}>{description}</Text>}
    <ScrollView style={{flexShrink:1}} keyboardShouldPersistTaps="always"
     contentContainerStyle={{gap:8}}>
     {actions.map(action=><SettingsMenuRow key={action.label} variant="action"
      title={action.label} description={action.description} icon={action.icon}
      tone={action.tone} disabled={busy} onPress={action.onPress}/>)}
    </ScrollView>
    {!!error&&<Text accessibilityLiveRegion="polite" style={{color:modal.text,
     fontSize:JOBEEN_TYPE.secondary,lineHeight:JOBEEN_LINE_HEIGHT.secondary}}>{error}</Text>}
   </View>
  </View>
 </Modal>;
}
