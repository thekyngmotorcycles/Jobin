import {Ionicons} from "@expo/vector-icons";
import {Image,Pressable,ScrollView,Text,View,useWindowDimensions} from "react-native";
import {useEffect,useRef} from "react";
import {useReducedMotion} from "react-native-reanimated";
import type {ReactNode,ComponentProps} from "react";
import {ProfileFollowCounts} from "./ProfileFollowCounts";
import {MediaThumbnail} from "./MediaThumbnail";
import {useTheme} from "../state/ThemeProvider";
import {jobeenTokens} from "../theme/jobeen";

export type ProfileSection="home"|"grid"|"cv"|"videos"|"live";
const tabs=[
 {id:"home",icon:"home-outline",label:"Inicio"},
 {id:"grid",icon:"grid-outline",label:"Todo"},
 {id:"videos",icon:"play-outline",label:"Videos"},
 {id:"live",icon:"radio-outline",label:"En vivo"},
 {id:"cv",icon:"briefcase-outline",label:"Acerca de"}
] as const;

/** Accessible horizontally scrollable tabs, pinned by the parent ScrollView. */
export function ProfileSectionTabs({section,onSelect,pinned=false}:{section:ProfileSection;onSelect:(section:ProfileSection)=>void;pinned?:boolean}){
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 const {width}=useWindowDimensions();const reducedMotion=useReducedMotion();
 const scroller=useRef<ScrollView|null>(null);
 const selectedIndex=Math.max(0,tabs.findIndex(tab=>tab.id===section));
 useEffect(()=>{
  scroller.current?.scrollTo({x:Math.max(0,selectedIndex*104-width/2+52),animated:!reducedMotion});
 },[selectedIndex,width,reducedMotion]);
 return <View style={{backgroundColor:jt.bg,borderBottomWidth:1,borderBottomColor:jt.line,
  elevation:pinned?3:0,shadowColor:jt.ink,shadowOffset:{width:0,height:2},shadowOpacity:pinned?0.09:0,
  shadowRadius:pinned?5:0,zIndex:5}}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always"
   ref={scroller} contentContainerStyle={{alignItems:"center",paddingHorizontal:4,gap:4}}>
   {tabs.map(tab=>{
    const selected=section===tab.id;
    return <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label}
      accessibilityState={{selected}} onPress={()=>onSelect(tab.id)}
      style={{minHeight:50,paddingHorizontal:12,minWidth:92,flexDirection:"row",gap:6,alignItems:"center",justifyContent:"center",
       borderBottomWidth:selected?3:0,borderBottomColor:jt.yellow}}>
     <Ionicons name={tab.icon} size={18} color={jt.ink}/>
     <Text numberOfLines={1} style={{fontSize:13,fontWeight:selected?"700":"600",color:jt.ink}}>{tab.label}</Text>
    </Pressable>;
   })}
  </ScrollView>
 </View>;
}

export type ProfileTile={id:string;title:string;thumbnail?:string|null;views?:number|null;onPress?:()=>void;kind?:"photos"|"video"|"live"|"text";photoCount?:number;onOptions?:()=>void};
export function ProfileMediaGrid({items,emptyMessage}:{items:ProfileTile[];emptyMessage?:string}){
 const {theme}=useTheme();const jt=jobeenTokens(theme);
 return <View style={{position:"relative",flexDirection:"row",flexWrap:"wrap"}}>
  {items.map((item,index)=>{
   const typeIcon:ComponentProps<typeof Ionicons>["name"]|null=item.kind==="photos"?(item.photoCount??0)>1?"copy-outline":"image-outline":
    item.kind==="video"?"play-outline":item.kind==="live"?"radio-outline":item.kind==="text"?"document-text-outline":null;
   return <Pressable key={item.id} disabled={!item.onPress} accessibilityRole={item.onPress?"button":undefined}
     accessibilityLabel={item.title+(item.kind?" · "+item.kind:"")} onPress={item.onPress} style={{width:"33.33%",padding:1.5}}>
    <View style={{aspectRatio:0.82,borderRadius:7,overflow:"hidden",backgroundColor:[jt.videoTile1,jt.videoTile2,jt.videoTile3][index%3]}}>
     {item.kind==="text"?<View style={{flex:1,justifyContent:"center",padding:8}}>
       <Text numberOfLines={5} style={{color:jt.ink,fontSize:11,fontWeight:"500"}}>{item.title}</Text>
      </View>:item.kind==="photos"&&item.thumbnail?
       <Image source={{uri:item.thumbnail}} resizeMode="cover" accessibilityLabel={item.title} style={{width:"100%",height:"100%"}}/>:
       item.thumbnail?<MediaThumbnail uri={item.thumbnail} label={item.title}/>:
       <View style={{flex:1,alignItems:"center",justifyContent:"center",padding:8,gap:5}}>
        <Ionicons name={typeIcon??"image-outline"} size={26} color={jt.ink2}/>
        <Text numberOfLines={3} style={{color:jt.ink2,fontSize:10,textAlign:"center"}}>{item.title}</Text>
       </View>}
     {!!typeIcon&&<View style={{position:"absolute",right:5,top:5,alignItems:"center",justifyContent:"center",width:27,height:27,borderRadius:8,backgroundColor:jt.videoViewsOverlay}}>
       <Ionicons name={typeIcon} size={17} color={jt.videoViewsText}/>
      </View>}
     {item.onOptions&&<Pressable accessibilityRole="button" accessibilityLabel={"Opciones de "+item.title}
       onPress={event=>{event.stopPropagation();item.onOptions?.();}} style={{position:"absolute",bottom:4,right:4,width:44,height:44,alignItems:"center",justifyContent:"center"}}>
       <View style={{width:32,height:32,borderRadius:16,backgroundColor:jt.videoViewsOverlay,alignItems:"center",justifyContent:"center"}}>
        <Ionicons name="ellipsis-horizontal" size={20} color={jt.videoViewsText}/>
       </View>
      </Pressable>}
     {typeof item.views==="number"&&<View style={{position:"absolute",bottom:6,left:6,flexDirection:"row",alignItems:"center",gap:4,backgroundColor:jt.videoViewsOverlay,paddingHorizontal:6,paddingVertical:3,borderRadius:6}}>
       <Ionicons name="play" size={12} color={jt.videoViewsText}/>
       <Text style={{fontSize:12,fontWeight:"700",color:jt.videoViewsText}}>{new Intl.NumberFormat("es",{notation:"compact",maximumFractionDigits:1}).format(item.views)}</Text>
      </View>}
    </View>
   </Pressable>;
  })}
  {!items.length&&!!emptyMessage&&<Text style={{color:jt.ink2,textAlign:"center",paddingVertical:24,width:"100%"}}>{emptyMessage}</Text>}
 </View>;
}

/** Hero moves out of view while ProfileSectionTabs remain pinned. */
export function ProfileIdentityHeader({card,actions,trust,profileUserId}:{
 card:ReactNode;actions?:ReactNode;trust?:ReactNode;profileUserId?:string;
}){
 return <View style={{gap:14}}>
  {card}
  {!!profileUserId&&<ProfileFollowCounts userId={profileUserId}/>}
  {actions}
  {trust}
 </View>;
}

/** Compatibility wrapper for non-sticky presentations. */
export function UserProfileContent({
 card,actions,trust,profileUserId,section,onSelect,children
}:{
 card:ReactNode;actions?:ReactNode;trust?:ReactNode;profileUserId?:string;
 section:ProfileSection;onSelect:(section:ProfileSection)=>void;children?:ReactNode;
}){
 return <View style={{gap:14}}>
  <ProfileIdentityHeader card={card} actions={actions} trust={trust} profileUserId={profileUserId}/>
  <ProfileSectionTabs section={section} onSelect={onSelect}/>
  {children}
 </View>;
}
