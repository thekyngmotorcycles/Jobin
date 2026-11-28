import {Ionicons} from "@expo/vector-icons";
import {Pressable,Text,View} from "react-native";
import {useTheme} from "../state/ThemeProvider";
import {menuChrome} from "../theme/menu-chrome";
import {useRoyalHiveTypography} from "../theme/ProfileTypographyScope";
import {JOBEEN_CONTROL} from "../theme/control-metrics";
import {jobeenModalTokens} from "../theme/modals";
import {JobinSettingsIcon} from "./JobinSettingsIcon";

/** Compact shared settings/action row. Descriptions are opt-in only for essential consequences; search metadata is not rendered here. */
export function SettingsMenuRow({
 title,description,value,onPress,settingId,icon,variant="navigation",tone="normal",disabled=false
}:{
 title:string;description?:string;value?:string;onPress:()=>void;settingId?:string;icon?:keyof typeof Ionicons.glyphMap;
 variant?:"navigation"|"action";tone?:"normal"|"danger";disabled?:boolean;
}){
 const {theme,colors}=useTheme();
 const {type:JOBEEN_TYPE,lineHeight:JOBEEN_LINE_HEIGHT,adaptive}=useRoyalHiveTypography();
 const chrome=menuChrome(theme,colors);
 const danger=jobeenModalTokens(theme,"danger");
 const iconColor=tone==="danger"?danger.icon:chrome.iconText;
 return <Pressable
  accessibilityRole="button"
  accessibilityLabel={value?title+", "+value:title}
  accessibilityState={{disabled}}
  onPress={onPress}
  disabled={disabled}
  style={({pressed})=>({
   opacity:disabled?0.55:1,
   flexDirection:"row",alignItems:"center",gap:12,minHeight:JOBEEN_CONTROL.touchTarget,
   paddingHorizontal:12,paddingVertical:10,borderRadius:JOBEEN_CONTROL.buttonRadius,
   backgroundColor:pressed?chrome.selected:colors.transparent
  })}>
  {(settingId||icon||variant==="navigation")&&<View style={{width:JOBEEN_CONTROL.icon,height:JOBEEN_CONTROL.icon,alignItems:"center",justifyContent:"center"}}>
   {settingId?<JobinSettingsIcon id={settingId} size={JOBEEN_CONTROL.icon} color={iconColor}/>:<Ionicons name={icon??"settings-outline"} size={JOBEEN_CONTROL.icon} color={iconColor}/>}
  </View>}
  <View style={{flex:1,minWidth:0,gap:3}}>
   <Text style={{fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body,fontWeight:adaptive?"500":"700",color:chrome.text}}>{title}</Text>
   {!!value&&<Text style={{fontSize:JOBEEN_TYPE.secondary,lineHeight:JOBEEN_LINE_HEIGHT.secondary,color:chrome.muted}}>{value}</Text>}
   {!!description&&<Text style={{fontSize:JOBEEN_TYPE.secondary,lineHeight:JOBEEN_LINE_HEIGHT.secondary,color:chrome.muted}}>{description}</Text>}
  </View>
  {variant==="navigation"&&<Ionicons name="chevron-forward" size={18} color={chrome.muted}/>}
 </Pressable>;
}
