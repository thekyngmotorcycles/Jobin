import { NoticeProvider } from "../state/NoticeProvider";
import { AuthGate } from "../components/AuthGate";
import { SafetyAccountGate } from "../components/SafetyAccountGate";
import { JobinWordmark } from "../components/JobinWordmark";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts,loadAsync } from "expo-font";
import { useState,type ReactNode } from "react";
import { ActivityIndicator,Pressable,Text,View } from "react-native";
import { SocialProvider } from "../state/SocialProvider";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../state/AppProvider";
import { ThemeProvider, useTheme } from "../state/ThemeProvider";
function IconFontGate({children}:{children:ReactNode}){
 const [loaded,error]=useFonts(Ionicons.font);const [recovered,setRecovered]=useState(false);const [retrying,setRetrying]=useState(false);const {colors}=useTheme();
 if(loaded||recovered)return children;
 return <View style={{flex:1,backgroundColor:colors.paper,alignItems:"center",justifyContent:"center",padding:30,gap:20}}>
 <JobinWordmark width={240}/>{error?<><Text style={{color:colors.ink,textAlign:"center"}}>The navigation icons could not load.</Text><Pressable accessibilityRole="button" onPress={()=>{if(retrying)return;setRetrying(true);void loadAsync(Ionicons.font).then(()=>setRecovered(true)).catch(()=>{}).finally(()=>setRetrying(false));}} style={{padding:16,backgroundColor:colors.accent,borderRadius:12}}><Text style={{color:colors.ink}}>{retrying?"Loading…":"Try again"}</Text></Pressable></>:<ActivityIndicator color={colors.ink} accessibilityLabel="Loading navigation"/>}
 </View>;
}
function Navigation() {
 const {theme,colors}=useTheme();
 return <><StatusBar style={theme==="dark"?"light":"dark"}/><Stack screenOptions={{headerStyle:{backgroundColor:colors.paper},headerTintColor:colors.ink,contentStyle:{backgroundColor:colors.paper}}}>
 <Stack.Screen name="(tabs)" options={{headerShown:false}}/>
 <Stack.Screen name="jshop" options={{title:"JShop"}}/>
 <Stack.Screen name="notifications" options={{title:"Notificaciones"}}/>
 <Stack.Screen name="search" options={{headerShown:false}}/>
 <Stack.Screen name="stream/[id]" options={{headerShown:false}}/>
 <Stack.Screen name="connect" options={{headerShown:false}}/>
 <Stack.Screen name="settings" options={{title:"Configuración"}}/>
 <Stack.Screen name="account" options={{title:"Sign up",headerShown:false}}/>
 <Stack.Screen name="login" options={{title:"Log in",headerShown:false}}/>
 <Stack.Screen name="company" options={{title:"Empresa o institución"}}/>
 <Stack.Screen name="professional" options={{title:"Mi JCard"}}/>
 <Stack.Screen name="certificates" options={{title:"Certificados"}}/>
 <Stack.Screen name="credential-review" options={{title:"Revisión de acreditaciones"}}/>
 <Stack.Screen name="opportunities" options={{title:"Oportunidades profesionales"}}/>
 <Stack.Screen name="jcard" options={{title:"JCard"}}/>
 <Stack.Screen name="safety" options={{title:"Seguridad y apelaciones"}}/>
 <Stack.Screen name="safety-review" options={{title:"Revisión de seguridad"}}/>
 <Stack.Screen name="terms" options={{title:"Términos · Borrador"}}/>
 <Stack.Screen name="work-media/[id]" options={{title:"Trabajo profesional"}}/>
 <Stack.Screen name="live" options={{title:"Live",presentation:"modal"}}/>
 <Stack.Screen name="services" options={{title:"Servicios"}}/>
 <Stack.Screen name="communities" options={{title:"Comunidades"}}/>
 </Stack></>;
}
export default function RootLayout() {
 return <SafeAreaProvider><ThemeProvider><AppProvider><SocialProvider><NoticeProvider><IconFontGate><AuthGate><SafetyAccountGate><Navigation/></SafetyAccountGate></AuthGate></IconFontGate></NoticeProvider></SocialProvider></AppProvider></ThemeProvider></SafeAreaProvider>;
}
