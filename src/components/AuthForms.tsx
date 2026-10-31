import { Ionicons } from "@expo/vector-icons";
import { JobinWordmark } from "./JobinWordmark";
import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUi } from "./ui";

export function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
 const { s } = useUi();
 return <SafeAreaView style={{ flex: 1, backgroundColor: "#B8BDC5" }}>
  <View pointerEvents="none" style={{ position:"absolute",top:"-12%",left:"-35%",width:"170%",height:"50%",backgroundColor:"#DCE0E5",transform:[{rotate:"-19deg"}] }}/>
  <View pointerEvents="none" style={{ position:"absolute",top:"43%",left:"-20%",width:"160%",height:"37%",backgroundColor:"#A6ACB5",transform:[{rotate:"21deg"}] }}/>
  <View pointerEvents="none" style={{ position:"absolute",bottom:"-14%",left:"-30%",width:"170%",height:"48%",backgroundColor:"#9099A6",transform:[{rotate:"-17deg"}] }}/>
  <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{flex:1}}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1,paddingHorizontal:26,paddingTop:40,paddingBottom:32,justifyContent:"center"}}>
    <View style={{alignItems:"center",marginBottom:26,gap:12}}>
     <View style={{backgroundColor:"rgba(255,255,255,0.75)",paddingHorizontal:20,paddingVertical:10,borderRadius:18}}><JobinWordmark width={150}/></View>
     <Text style={{color:"#30353D",fontSize:11,fontWeight:"700",letterSpacing:3}}>PERSONAS REALES. TRABAJO REAL.</Text>
    </View>
    <View style={{borderRadius:24,backgroundColor:"rgba(255,255,255,0.70)",borderWidth:1,borderColor:"rgba(255,255,255,0.85)",padding:22,gap:15,shadowColor:"#4D5662",shadowOpacity:0.15,shadowRadius:16,elevation:4}}>
     <Text style={[s.h1,{textAlign:"center",color:"#1C2229",marginBottom:6}]}>{title}</Text>
     {children}
    </View>
    <View style={{alignItems:"center",marginTop:25}}>{footer}</View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
export function AuthField({label,value,onChangeText,placeholder,secure=false,keyboardType="default",autoCapitalize="none"}:{label:string;value:string;onChangeText:(v:string)=>void;placeholder:string;secure?:boolean;keyboardType?:"default"|"email-address"|"phone-pad";autoCapitalize?:"none"|"words"}) {
 const [visible,setVisible]=useState(false);
 return <View style={{gap:6}}>
  <Text style={{fontSize:12,fontWeight:"700",color:"#343A42"}}>{label}</Text>
  <View style={{flexDirection:"row",alignItems:"center",borderRadius:12,borderColor:"rgba(255,255,255,0.8)",borderWidth:1,backgroundColor:"rgba(240,243,246,0.70)",minHeight:50,paddingHorizontal:12}}>
   <TextInput accessibilityLabel={label} style={{flex:1,color:"#20242A",fontSize:15,paddingVertical:12}} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#7C838D" secureTextEntry={secure&&!visible} keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={false}/>
   {secure&&<Pressable accessibilityRole="button" accessibilityLabel={visible?"Ocultar contraseña":"Mostrar contraseña"} onPress={()=>setVisible(v=>!v)} style={{padding:7}}><Ionicons name={visible?"eye-off-outline":"eye-outline"} color="#343A42" size={22}/></Pressable>}
  </View>
 </View>;
}
export function AuthAction({label,onPress,secondary=false,disabled=false}:{label:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={{borderRadius:28,minHeight:50,justifyContent:"center",alignItems:"center",backgroundColor:secondary?"rgba(255,255,255,0.4)":"#FDFDFD",borderWidth:1,borderColor:"rgba(255,255,255,0.85)",opacity:disabled?0.6:1}}>
  <Text style={{color:"#242A32",fontSize:15,fontWeight:"800",letterSpacing:1}}>{label}</Text>
 </Pressable>;
}
