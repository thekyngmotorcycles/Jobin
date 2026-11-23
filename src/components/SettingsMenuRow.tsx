import {Ionicons} from "@expo/vector-icons";
import {Pressable,Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {menuChrome} from "../theme/menu-chrome";
import {JOBEEN_TYPE,JOBEEN_LINE_HEIGHT} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {jobeenModalTokens} from "../theme/modals";
import {JobinSettingsIcon} from "./JobinSettingsIcon";

/** One settings row for the side drawer and full settings pages. */
export function SettingsMenuRow({
 title,description,onPress,settingId,icon,variant="navigation",tone="normal",disabled=false
}:{
 title:string;description?:string;onPress:()=>void;settingId?:string;icon?:keyof typeof Ionicons.glyphMap;
 variant?:"navigation"|"action";tone?:"normal"|"danger";disabled?:boolean;
}){
 const {theme,colors}=useTheme();
 const chrome=menuChrome(theme,colors);
 const danger=jobeenModalTokens(theme,"danger");
 const iconColor=tone==="danger"?danger.icon:chrome.iconText;
 return <Pressable
  accessibilityRole="button"
  accessibilityLabel={title}
  accessibilityState={{disabled}}
  onPress={onPress}
  disabled={disabled}
  style={({pressed})=>({
   opacity:disabled?0.55:1,
   flexDirection:"row",alignItems:"center",gap:12,minHeight:JOBEEN_CONTROL.settingsRowMinHeight,
   paddingHorizontal:12,paddingVertical:9,borderRadius:18,
   backgroundColor:pressed?chrome.selected:chrome.action,
   borderWidth:1,borderColor:chrome.border
  })}>
  {(settingId||icon||variant==="navigation")&&<View style={{width:38,height:38,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:chrome.iconSurface}}>
   {settingId?<JobinSettingsIcon id={settingId} size={21} color={iconColor}/>:<Ionicons name={icon??"settings-outline"} size={23} color={iconColor}/>}
  </View>}
  <View style={{flex:1,gap:3}}>
   <Text style={{fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body,fontWeight:"700",color:chrome.text}}>{title}</Text>
   {!!description&&<Text style={{fontSize:JOBEEN_TYPE.secondary,lineHeight:JOBEEN_LINE_HEIGHT.secondary,color:chrome.muted}}>{description}</Text>}
  </View>
  {variant==="navigation"&&<Ionicons name="chevron-forward" size={18} color={chrome.muted}/>}
 </Pressable>;
}
