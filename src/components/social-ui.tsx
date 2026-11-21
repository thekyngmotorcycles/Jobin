import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps,ReactNode } from "react";
import { Image,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,StyleSheet,Text,View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import {opacity} from "../theme/color";
import {jobeenModalTokens} from "../theme/modals";
import {JOBEEN_TYPE} from "../theme/typography";
import {jobeenTokens} from "../theme/jobeen";
import { useTheme } from "../state/ThemeProvider";
export type IconName=ComponentProps<typeof Ionicons>["name"];
export function IconButton({icon,label,onPress,color,size=25,background,selected=false}:{icon:IconName;label:string;onPress:()=>void;color?:string;size?:number;background?:string;selected?:boolean}){
 const {colors}=useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress}
 style={({pressed})=>({width:44,height:44,borderRadius:22,alignItems:"center",justifyContent:"center",backgroundColor:background??colors.transparent,opacity:pressed ? 0.6 : 1})}>
 <Ionicons name={icon} size={size} color={color||colors.ink}/></Pressable>;
}
export function Avatar({uri,name,size=44,height=size,shape="circle",initials,emphasis=false,framed=true}:{uri?:string;name:string;size?:number;height?:number;shape?:"circle"|"portrait";initials?:string;emphasis?:boolean;framed?:boolean}){
 const [failed,setFailed]=useState(false);const {colors,theme}=useTheme();const t=jobeenTokens(theme);
 // Circular avatars are the default everywhere except story thumbnails and the personal JCard portrait.
 // Preserve the approved Jobeen gold keyline in both geometries.
 const border=framed?Math.max(1.5,size>=48?2:1.5):0;
 const corner=shape==="circle"?size/2:Math.max(6,Math.round(size*0.18));
 return <View style={{height,width:size,borderRadius:corner,borderWidth:border,borderColor:t.yellow,padding:framed?1.5:0,backgroundColor:emphasis?colors.ink:colors.accent,overflow:"hidden",alignItems:"center",justifyContent:"center"}}>
 {uri&&!failed?<Image source={{uri}} accessibilityLabel={name} onError={()=>setFailed(true)} resizeMode="cover" style={{width:"100%",height:"100%",borderRadius:shape==="circle"?size/2:Math.max(4,corner-border-2)}}/>:<Text style={{color:emphasis?colors.inverse:colors.ink,fontSize:size*.32,fontWeight:"700"}}>{initials??name.split(/[\s-]+/).filter(Boolean).map(n=>n[0]).slice(0,2).join("")}</Text>}
 </View>;
}
export function BottomSheet({visible,onClose,title,children,translucent=false}:{visible:boolean;onClose:()=>void;title:string;children:ReactNode;translucent?:boolean}){
 const {theme}=useTheme();const modal=jobeenModalTokens(theme);const inset=useSafeAreaInsets();
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent={false}>
  <KeyboardAvoidingView style={{flex:1,justifyContent:"flex-end"}} behavior={Platform.OS==="ios"?"padding":undefined}>
   <Pressable accessibilityRole="button" accessibilityLabel="Close panel" onPress={onClose} style={{flex:1,backgroundColor:modal.scrim}}/>
   <View accessibilityViewIsModal style={{maxHeight:"85%",minHeight:180,maxWidth:700,width:"100%",alignSelf:"center",backgroundColor:translucent?opacity(modal.surface,0.96):modal.surface,borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet,borderWidth:1,borderColor:modal.border,paddingHorizontal:20,paddingBottom:Math.max(inset.bottom,16)}}>
    <View style={{width:38,height:4,backgroundColor:modal.handle,borderRadius:4,alignSelf:"center",marginTop:10}}/>
    <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:8}}><Text accessibilityRole="header" style={{fontSize:JOBEEN_TYPE.modalTitle,fontWeight:"700",color:modal.text}}>{title}</Text><IconButton icon="close" label="Close panel" onPress={onClose}/></View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets={false} nestedScrollEnabled showsVerticalScrollIndicator contentContainerStyle={{paddingBottom:16,flexGrow:0}}>
     {children}
    </ScrollView>
   </View>
  </KeyboardAvoidingView>
 </Modal>;
}
export function useOverlayStyles(){const {colors}=useTheme();return StyleSheet.create({shadowText:{textShadowColor:colors.mediaShadow,textShadowOffset:{width:0,height:1},textShadowRadius:4}});}
