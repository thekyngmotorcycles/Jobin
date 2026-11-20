import "react-native-gesture-handler";
import {GestureHandlerRootView} from "react-native-gesture-handler";
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
import {jobeenTokens} from "../theme/jobeen";
function IconFontGate({children}:{children:ReactNode}){
 const [loaded,error]=useFonts(Ionicons.font);const [recovered,setRecovered]=useState(false);const [retrying,setRetrying]=useState(false);const {colors}=useTheme();
 if(loaded||recovered)return children;
 return <View style={{flex:1,backgroundColor:colors.paper,alignItems:"center",justifyContent:"center",padding:30,gap:20}}>
 <JobinWordmark width={240}/>{error?<><Text style={{color:colors.ink,textAlign:"center"}}>The navigation icons could not load.</Text><Pressable accessibilityRole="button" onPress={()=>{if(retrying)return;setRetrying(true);void loadAsync(Ionicons.font).then(()=>setRecovered(true)).catch(()=>{}).finally(()=>setRetrying(false));}} style={{padding:16,backgroundColor:colors.accent,borderRadius:12}}><Text style={{color:colors.ink}}>{retrying?"Loading…":"Try again"}</Text></Pressable></>:<ActivityIndicator color={colors.ink} accessibilityLabel="Loading navigation"/>}
 </View>;
}
function Navigation() {
 const {theme,colors}=useTheme();const jt=jobeenTokens(theme);const shellBackground=theme==="light"?jt.bg:colors.paper;
 return <><StatusBar style={theme==="dark"?"light":"dark"}/><Stack screenOptions={{headerStyle:{backgroundColor:shellBackground},headerTintColor:colors.ink,contentStyle:{backgroundColor:shellBackground}}}>
 <Stack.Screen name="(tabs)" options={{headerShown:false}}/>
 <Stack.Screen name="map-presence" options={{title:"Mi zona profesional"}}/>
 <Stack.Screen name="post/create" options={{title:"Nueva publicación"}}/>
 <Stack.Screen name="post/[id]" options={{title:"Publicación"}}/>
 <Stack.Screen name="story/create" options={{title:"Crear historia"}}/>
 <Stack.Screen name="story/[id]" options={{headerShown:false}}/>
 <Stack.Screen name="message" options={{headerShown:false}}/>
  <Stack.Screen name="message-requests" options={{title:"Solicitudes de mensajes"}}/>
 <Stack.Screen name="jshop" options={{title:"JShop"}}/>
 <Stack.Screen name="jshop/publish" options={{title:"Nuevo anuncio"}}/>
 <Stack.Screen name="jshop/location" options={{headerShown:false,presentation:"transparentModal",animation:"slide_from_bottom"}}/>
 <Stack.Screen name="jshop/sale-location" options={{headerShown:false,presentation:"transparentModal",animation:"slide_from_bottom"}}/>
 <Stack.Screen name="jshop/mine" options={{title:"Mis anuncios"}}/>
 <Stack.Screen name="jshop/settings" options={{title:"Configuración de JShop"}}/>
 <Stack.Screen name="jshop/guide" options={{title:"Guía para publicar"}}/>
 <Stack.Screen name="jshop/favorites" options={{title:"Guardados"}}/>
 <Stack.Screen name="jshop/report" options={{title:"Denunciar artículo"}}/>
 <Stack.Screen name="jshop/item/[id]" options={{title:"Detalle del artículo"}}/>
 <Stack.Screen name="notifications" options={{title:"Notificaciones"}}/>
 <Stack.Screen name="search" options={{headerShown:false}}/>
 <Stack.Screen name="stream/[id]" options={{headerShown:false}}/>
 <Stack.Screen name="connect" options={{headerShown:false}}/>
 <Stack.Screen name="settings" options={{title:"Configuración"}}/>
 <Stack.Screen name="settings/[item]" options={{title:"Configuración de Jobin"}}/>
 <Stack.Screen name="settings/cuenta" options={{title:"Cuenta y seguridad"}}/>
 <Stack.Screen name="settings/datos-personales" options={{title:"Información personal"}}/>
 <Stack.Screen name="settings/tipo-cuenta" options={{title:"Tipo de cuenta"}}/>
 <Stack.Screen name="settings/cierre-cuenta" options={{title:"Administrar cuenta"}}/>
 <Stack.Screen name="menu/[section]" options={{title:"Configuración y privacidad"}}/>
 <Stack.Screen name="account" options={{title:"Sign up",headerShown:false}}/>
 <Stack.Screen name="choose-username" options={{title:"Nombre de usuario",headerShown:false}}/>
 <Stack.Screen name="login" options={{title:"Log in",headerShown:false}}/>
 <Stack.Screen name="recover-account" options={{title:"Recuperar cuenta",headerShown:false}}/>
 <Stack.Screen name="change-password" options={{title:"Nueva contraseña"}}/>
 <Stack.Screen name="verify-phone" options={{title:"Verificar teléfono"}}/>
 <Stack.Screen name="verify-identity" options={{title:"Verificación de identidad"}}/>
 <Stack.Screen name="identity-admin" options={{title:"Revisión administrativa"}}/>
 <Stack.Screen name="company" options={{title:"Empresa o institución"}}/>
 <Stack.Screen name="professional" options={{title:"JCard personal"}}/>
 <Stack.Screen name="certificates" options={{title:"Certificados"}}/>
 <Stack.Screen name="credential-review" options={{title:"Revisión de acreditaciones"}}/>
 <Stack.Screen name="opportunities" options={{title:"Oportunidades profesionales"}}/>
 <Stack.Screen name="jcard" options={{title:"JCard"}}/>
 <Stack.Screen name="personal-avatar-editor" options={{headerShown:false}}/>
 <Stack.Screen name="jcard-backgrounds" options={{title:"Apariencia"}}/>
 <Stack.Screen name="jcard-business-backgrounds" options={{title:"Apariencia de negocio"}}/>
 <Stack.Screen name="jcard-business-edit" options={{title:"JCard de negocio"}}/>
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
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><ThemeProvider><AppProvider><SocialProvider><NoticeProvider><IconFontGate><AuthGate><SafetyAccountGate><Navigation/></SafetyAccountGate></AuthGate></IconFontGate></NoticeProvider></SocialProvider></AppProvider></ThemeProvider></SafeAreaProvider></GestureHandlerRootView>;
}
