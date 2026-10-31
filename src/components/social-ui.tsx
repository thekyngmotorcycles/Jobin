import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps,ReactNode } from "react";
import { Image,KeyboardAvoidingView,Modal,Platform,Pressable,StyleSheet,Text,View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useTheme } from "../state/ThemeProvider";
export type IconName=ComponentProps<typeof Ionicons>["name"];
export function IconButton({icon,label,onPress,color,size=25,background,selected=false}:{icon:IconName;label:string;onPress:()=>void;color?:string;size?:number;background?:string;selected?:boolean}){
 const {colors}=useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress}
 style={({pressed})=>({width:44,height:44,borderRadius:22,alignItems:"center",justifyContent:"center",backgroundColor:background??colors.transparent,opacity:pressed ? 0.6 : 1})}>
 <Ionicons name={icon} size={size} color={color||colors.ink}/></Pressable>;
}
export function Avatar({uri,name,size=44,initials,emphasis=false}:{uri?:string;name:string;size?:number;initials?:string;emphasis?:boolean}){
 const [failed,setFailed]=useState(false);const {colors}=useTheme();
 return <View style={{height:size,width:size,borderRadius:size/2,backgroundColor:emphasis?colors.ink:colors.accent,overflow:"hidden",alignItems:"center",justifyContent:"center"}}>
 {uri&&!failed?<Image source={{uri}} accessibilityLabel={name} onError={()=>setFailed(true)} style={{width:size,height:size}}/>:<Text style={{color:emphasis?colors.inverse:colors.ink,fontSize:size*.32,fontWeight:"700"}}>{initials??name.split(/[\s-]+/).filter(Boolean).map(n=>n[0]).slice(0,2).join("")}</Text>}
 </View>;
}
export function BottomSheet({visible,onClose,title,children}:{visible:boolean;onClose:()=>void;title:string;children:ReactNode}){
 const {colors}=useTheme();const inset=useSafeAreaInsets();
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
 <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":"height"}>
 <Pressable accessibilityRole="button" accessibilityLabel="Close panel" onPress={onClose} style={{flex:1,backgroundColor:colors.scrim}}/>
 <View accessibilityViewIsModal style={{height:"68%",maxWidth:700,width:"100%",alignSelf:"center",backgroundColor:colors.card,borderTopLeftRadius:24,borderTopRightRadius:24,paddingHorizontal:20,paddingBottom:Math.max(inset.bottom,16)}}>
 <View style={{width:38,height:4,backgroundColor:colors.line,borderRadius:4,alignSelf:"center",marginTop:10}}/>
 <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:8}}><Text accessibilityRole="header" style={{fontSize:18,fontWeight:"700",color:colors.ink}}>{title}</Text><IconButton icon="close" label="Close panel" onPress={onClose}/></View>
 {children}</View></KeyboardAvoidingView></Modal>;
}
export function useOverlayStyles(){const {colors}=useTheme();return StyleSheet.create({shadowText:{textShadowColor:colors.mediaShadow,textShadowOffset:{width:0,height:1},textShadowRadius:4}});}
