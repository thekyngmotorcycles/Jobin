import {Ionicons} from "@expo/vector-icons";
import {Pressable,Text,View} from "react-native";
import {MediaThumbnail} from "./MediaThumbnail";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

export type ProfileSection="grid"|"cv"|"videos"|"live";
const tabs=[{id:"cv",icon:"school-outline",label:"Historial profesional"},{id:"videos",icon:"play-outline",label:"Videos"},{id:"live",icon:"radio-outline",label:"Transmisiones en vivo"}] as const;

/** Shared profile presentation; owner and visitors keep the same tab arrangement. */
export function ProfileSectionTabs({section,onSelect}:{section:ProfileSection;onSelect:(section:ProfileSection)=>void}){
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 return <View style={{flexDirection:"row",justifyContent:"space-around",alignItems:"center",borderBottomWidth:1,borderBottomColor:jt.line,paddingVertical:0}}>
  {tabs.map(tab=><Pressable key={tab.id} accessibilityRole="button" accessibilityLabel={tab.label} accessibilityState={{selected:section===tab.id}} onPress={()=>onSelect(tab.id)} style={{width:54,height:44,borderBottomWidth:section===tab.id?3:0,borderBottomColor:jt.yellow,alignItems:"center",justifyContent:"center"}}>
   <Ionicons name={tab.icon} size={22} color={section===tab.id?jt.ink:jt.ink2}/>
  </Pressable>)}
 </View>;
}
export type ProfileTile={id:string;title:string;thumbnail?:string|null;onPress?:()=>void};
export function ProfileMediaGrid({items,emptyMessage}:{items:ProfileTile[];emptyMessage?:string}){
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 return <View style={{position:"relative",flexDirection:"row",flexWrap:"wrap"}}>
  {items.map((item,index)=><Pressable key={item.id} disabled={!item.onPress} accessibilityRole={item.onPress?"button":undefined} accessibilityLabel={item.title} onPress={item.onPress} style={{width:"33.33%",padding:1.5}}>
   <View style={{height:160,borderRadius:10,overflow:"hidden",backgroundColor:[jt.videoTile1,jt.videoTile2,jt.videoTile3][index%3]}}>
    <MediaThumbnail uri={item.thumbnail??undefined} label={item.title}/>
   </View>
  </Pressable>)}
  {!items.length&&!!emptyMessage&&<Text style={{color:jt.ink2,textAlign:"center",paddingVertical:24,width:"100%"}}>{emptyMessage}</Text>}
 </View>;
}
