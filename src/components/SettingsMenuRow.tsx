import {Ionicons} from "@expo/vector-icons";
import {Pressable,Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {menuChrome} from "../theme/menu-chrome";
import {JOBEEN_TYPE} from "../theme/typography";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {JobinSettingsIcon} from "./JobinSettingsIcon";

/** One settings row for the side drawer and full settings pages. */
export function SettingsMenuRow({
 title,description,onPress,settingId,icon
}:{
 title:string;description?:string;onPress:()=>void;settingId?:string;icon?:keyof typeof Ionicons.glyphMap;
}){
 const {theme,colors}=useTheme();
 const chrome=menuChrome(theme,colors);
 return <Pressable
  accessibilityRole="button"
  accessibilityLabel={title}
  onPress={onPress}
  style={({pressed})=>({
   flexDirection:"row",alignItems:"center",gap:11,minHeight:JOBEEN_CONTROL.settingsRowMinHeight,
   paddingHorizontal:12,paddingVertical:9,borderRadius:18,
   backgroundColor:pressed?chrome.selected:chrome.action,
   borderWidth:1,borderColor:chrome.border
  })}>
  <View style={{width:38,height:38,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:chrome.iconSurface}}>
   {settingId?<JobinSettingsIcon id={settingId} size={21} color={chrome.iconText}/>:<Ionicons name={icon??"settings-outline"} size={23} color={chrome.iconText}/>}
  </View>
  <View style={{flex:1,gap:3}}>
   <Text numberOfLines={2} style={{fontSize:JOBEEN_TYPE.body,fontWeight:"700",color:chrome.text}}>{title}</Text>
   {!!description&&<Text numberOfLines={2} style={{fontSize:JOBEEN_TYPE.secondary,lineHeight:17,color:chrome.muted}}>{description}</Text>}
  </View>
  <Ionicons name="chevron-forward" size={18} color={chrome.muted}/>
 </Pressable>;
}
