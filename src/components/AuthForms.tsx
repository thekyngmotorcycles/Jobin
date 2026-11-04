import { authSilver } from "../theme/auth-silver";
import { Ionicons } from "@expo/vector-icons";
import { JobinWordmark } from "./JobinWordmark";
import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
 const { width } = useWindowDimensions();
 const isWeb = Platform.OS === "web";
 return <SafeAreaView style={{ flex: 1, backgroundColor: authSilver.tone4 }}>
  <View pointerEvents="none" style={{ position:"absolute",top:"-12%",left:"-35%",width:"170%",height:"50%",backgroundColor:authSilver.tone5,transform:[{rotate:"-19deg"}] }}/>
  <View pointerEvents="none" style={{ position:"absolute",top:"43%",left:"-20%",width:"160%",height:"37%",backgroundColor:authSilver.tone6,transform:[{rotate:"21deg"}] }}/>
  <View pointerEvents="none" style={{ position:"absolute",bottom:"-14%",left:"-30%",width:"170%",height:"48%",backgroundColor:authSilver.tone7,transform:[{rotate:"-17deg"}] }}/>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1,paddingHorizontal:20,paddingTop:24,paddingBottom:24,justifyContent:"center"}}>
    <View style={{alignItems:"center",marginBottom:18,gap:8}}>
     <JobinWordmark width={isWeb?112:122}/>
    </View>
    <View style={{width:"100%",maxWidth:410,alignSelf:"center",borderRadius:18,backgroundColor:authSilver.tone10,borderWidth:1,borderColor:authSilver.tone11,padding:width<390?18:22,gap:13,shadowColor:authSilver.tone12,shadowOpacity:0.10,shadowRadius:10,elevation:2}}>
     <Text style={{textAlign:"center",color:authSilver.tone13,fontSize:25,fontWeight:"600",marginBottom:5}}>{title}</Text>
     {children}
    </View>
    <View style={{alignItems:"center",marginTop:16}}>{footer}</View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
export function AuthField({label,value,onChangeText,placeholder,secure=false,keyboardType="default",autoCapitalize="none"}:{label:string;value:string;onChangeText:(v:string)=>void;placeholder:string;secure?:boolean;keyboardType?:"default"|"email-address"|"phone-pad";autoCapitalize?:"none"|"words"}) {
 const [visible,setVisible]=useState(false);
 return <View style={{gap:6}}>
  <Text style={{fontSize:12,fontWeight:"700",color:authSilver.tone14}}>{label}</Text>
  <View style={{flexDirection:"row",alignItems:"center",borderRadius:12,borderColor:authSilver.tone15,borderWidth:1,backgroundColor:authSilver.tone16,minHeight:44,paddingHorizontal:12}}>
   <TextInput accessibilityLabel={label} style={{flex:1,color:authSilver.tone17,fontSize:14,paddingVertical:10}} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={authSilver.tone18} secureTextEntry={secure&&!visible} keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={false}/>
   {secure&&<Pressable accessibilityRole="button" accessibilityLabel={visible?"Ocultar contraseña":"Mostrar contraseña"} onPress={()=>setVisible(v=>!v)} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}><Ionicons name={visible?"eye-off-outline":"eye-outline"} color={authSilver.tone14} size={22}/></Pressable>}
  </View>
 </View>;
}
export function AuthAction({label,onPress,secondary=false,disabled=false}:{label:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={{borderRadius:28,minHeight:46,paddingHorizontal:16,paddingVertical:9,justifyContent:"center",alignItems:"center",backgroundColor:secondary?authSilver.tone19:authSilver.tone20,borderWidth:1,borderColor:authSilver.tone11,opacity:disabled?0.6:1}}>
  <Text numberOfLines={2} style={{color:authSilver.tone2,fontSize:14,fontWeight:"700",letterSpacing:0.2,textAlign:"center",flexShrink:1}}>{label}</Text>
 </Pressable>;
}
