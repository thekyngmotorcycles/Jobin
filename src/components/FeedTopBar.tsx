import {useRef,useState} from "react";
import {Modal,Pressable,Text,View,useWindowDimensions} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {FEED_TABS,type FeedTab} from "../lib/feed";
import {WORK_FILTERS,type WorkFilter} from "./WorkCategoryFilters";
import {TopNavigationFade} from "./TopNavigationFade";
import {JobeenFlashIcon} from "./JobeenFlashIcon";
import {IconButton} from "./social-ui";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";
import {Ionicons} from "@expo/vector-icons";

/** One shared, single-line top bar for Flashes and Lives. The selected tab owns the category menu. */
export function FeedTopBar({tab,onTab,onLeading,leading,onSearch,category,onCategory}:{
 tab:FeedTab;onTab:(tab:FeedTab)=>void;onLeading:()=>void;leading:"live"|"videos";
 onSearch:()=>void;category:WorkFilter;onCategory:(category:WorkFilter)=>void;
}){
 const {theme,colors}=useTheme();
 const jt=jobeenTokens(theme);
 const insets=useSafeAreaInsets();
 const {width,height}=useWindowDimensions();
 const [opened,setOpened]=useState(false);
 const [anchor,setAnchor]=useState({top:insets.top+56,left:12});
 const activeRef=useRef<View>(null);
 const menuWidth=Math.min(236,Math.max(180,width-24));
 const labelSize=width<350?12:13;
 const textColor=colors.navIcon;
 function openMenu(){
  if(opened){setOpened(false);return;}
  activeRef.current?.measureInWindow((x,y,w,h)=>{
   setAnchor({top:Math.max(insets.top+4,Math.min(y+h+6,height-insets.bottom-248)),
    left:Math.max(12,Math.min(x+w/2-menuWidth/2,width-menuWidth-12))});
   setOpened(true);
  });
 }
 return <View style={{height:56,justifyContent:"center",backgroundColor:colors.transparent}}>
  <TopNavigationFade/>
  <View style={{flexDirection:"row",alignItems:"center",paddingHorizontal:4,gap:5}}>
   <Pressable accessibilityRole="button" accessibilityLabel={leading==="live"?"Abrir Lives":"Volver a Flashes"} onPress={onLeading}
    style={({pressed})=>({width:48,height:44,flexShrink:0,alignItems:"center",justifyContent:"center",
      backgroundColor:theme==="light"?jt.bar:jt.surface,borderRadius:13,borderWidth:1,borderColor:jt.line,
      shadowColor:jt.ink,shadowOpacity:0.11,shadowOffset:{width:0,height:3},shadowRadius:5,elevation:3,
      opacity:pressed?0.73:1})}>
    {leading==="live"?<View style={{alignItems:"center",justifyContent:"center",gap:0}}>
      <Ionicons name="radio-outline" size={19} color={textColor}/>
      <Text numberOfLines={1} style={{fontSize:9,fontWeight:"800",color:textColor,lineHeight:12}}>LIVE</Text>
    </View>:<JobeenFlashIcon size={27}/>}
   </Pressable>
   <View style={{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"space-around",minWidth:0}}>
    {FEED_TABS.map(item=>{
     const selected=tab===item;
     return <Pressable key={item} ref={selected?activeRef:undefined} accessibilityRole="tab"
      accessibilityLabel={selected?item+", filtrar "+category:item} accessibilityState={{selected,expanded:selected&&opened}}
      onPress={()=>{if(selected)openMenu();else{setOpened(false);onTab(item);}}}
      style={({pressed})=>({height:44,minWidth:0,flexShrink:1,justifyContent:"center",alignItems:"center",
       paddingHorizontal:width<350?2:5,borderRadius:11,backgroundColor:selected?(theme==="light"?jt.cream:colors.line):colors.transparent,
       borderBottomWidth:selected?2:0,borderBottomColor:theme==="light"?jt.yellow:textColor,opacity:pressed?0.75:1})}>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:selected?1:0,flexShrink:1}}>
       <Text numberOfLines={1} adjustsFontSizeToFit minFontScale={0.8}
        style={{fontSize:labelSize,fontWeight:selected?"800":"500",color:selected?textColor:colors.muted,flexShrink:1}}>
        {item==="Following"?"Siguiendo":item}
       </Text>
       {selected&&<Ionicons name={opened?"chevron-up":"chevron-down"} size={11} color={textColor}/>}
      </View>
     </Pressable>;
    })}
   </View>
   <IconButton icon="search-outline" label="Buscar" size={25} onPress={onSearch}/>
  </View>
  <Modal visible={opened} transparent animationType="fade" statusBarTranslucent onRequestClose={()=>setOpened(false)}>
   <View style={{flex:1}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar filtros" onPress={()=>setOpened(false)} style={{position:"absolute",top:0,bottom:0,left:0,right:0}}/>
    <View accessibilityViewIsModal style={{position:"absolute",top:anchor.top,left:anchor.left,width:menuWidth,
     backgroundColor:theme==="light"?jt.bar:jt.surface,borderWidth:1,borderColor:jt.line,
     borderRadius:18,padding:6,shadowColor:jt.ink,shadowOpacity:0.16,shadowOffset:{width:0,height:5},
     shadowRadius:12,elevation:8}}>
     {WORK_FILTERS.map(filter=><Pressable key={filter} accessibilityRole="button" accessibilityState={{selected:category===filter}}
      accessibilityLabel={"Filtrar "+tab+" por "+filter}
      onPress={()=>{onCategory(filter);setOpened(false);}}
      style={({pressed})=>({minHeight:43,paddingHorizontal:12,borderRadius:12,flexDirection:"row",alignItems:"center",
       justifyContent:"space-between",backgroundColor:category===filter?jt.cream:pressed?jt.line:colors.transparent})}>
      <Text numberOfLines={1} style={{fontSize:13,fontWeight:category===filter?"700":"500",color:jt.ink}}>{filter}</Text>
      {category===filter&&<Ionicons name="checkmark" color={jt.ink} size={17}/>}
     </Pressable>)}
    </View>
   </View>
  </Modal>
 </View>;
}
