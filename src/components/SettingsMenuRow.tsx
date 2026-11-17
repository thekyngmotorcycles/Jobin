import {Ionicons} from "@expo/vector-icons";
import {Pressable,Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {menuChrome} from "../theme/menu-chrome";
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
   flexDirection:"row",alignItems:"center",gap:12,minHeight:70,
   paddingHorizontal:14,paddingVertical:12,borderRadius:18,
   backgroundColor:pressed?chrome.selected:chrome.action,
   borderWidth:1,borderColor:chrome.border
  })}>
  <View style={{width:42,height:42,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:chrome.iconSurface}}>
   {settingId?<JobinSettingsIcon id={settingId} size={23} color={chrome.iconText}/>:<Ionicons name={icon??"settings-outline"} size={23} color={chrome.iconText}/>}
  </View>
  <View style={{flex:1,gap:3}}>
   <Text numberOfLines={2} style={{fontSize:15,fontWeight:"700",color:chrome.text}}>{title}</Text>
   {!!description&&<Text numberOfLines={2} style={{fontSize:12,lineHeight:17,color:chrome.muted}}>{description}</Text>}
  </View>
  <Ionicons name="chevron-forward" size={18} color={chrome.muted}/>
 </Pressable>;
}
