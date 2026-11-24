import {Ionicons} from "@expo/vector-icons";
import {Pressable,Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {jobeenModalTokens} from "../theme/modals";

/** Equal reserved space on both sides centers the title in the entire drawer,
 * not just in the space left over from the close button. Allow wrapping at large font sizes.
 */
export function SettingsDrawerHeader({title,onClose}:{title:string;onClose:()=>void}){
 const {theme}=useTheme();const modal=jobeenModalTokens(theme);
 return <View style={{flexDirection:"row",alignItems:"center",paddingBottom:8,gap:4,minHeight:JOBEEN_CONTROL.touchTarget}}>
  <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{width:JOBEEN_CONTROL.touchTarget}}/>
  <Text accessibilityRole="header" style={{flex:1,minWidth:0,textAlign:"center",color:modal.text,fontWeight:"700",fontSize:JOBEEN_TYPE.modalTitle,lineHeight:JOBEEN_LINE_HEIGHT.modalTitle}}>{title}</Text>
  <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={{width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name="close" size={24} color={modal.text}/>
  </Pressable>
 </View>;
}
