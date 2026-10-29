import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../state/AppProvider";
import { ThemeProvider, useTheme } from "../state/ThemeProvider";
function Navigation() {
 const {theme,colors}=useTheme();
 return <><StatusBar style={theme==="dark"?"light":"dark"}/><Stack screenOptions={{headerStyle:{backgroundColor:colors.paper},headerTintColor:colors.ink,contentStyle:{backgroundColor:colors.paper}}}>
 <Stack.Screen name="(tabs)" options={{headerShown:false}}/>
 <Stack.Screen name="settings" options={{title:"Configuración"}}/>
 <Stack.Screen name="account" options={{title:"Crear cuenta"}}/>
 <Stack.Screen name="company" options={{title:"Compañía"}}/>
 <Stack.Screen name="live" options={{title:"Live",presentation:"modal"}}/>
 <Stack.Screen name="services" options={{title:"Servicios"}}/>
 <Stack.Screen name="communities" options={{title:"Comunidades"}}/>
 </Stack></>;
}
export default function RootLayout() {
 return <SafeAreaProvider><ThemeProvider><AppProvider><Navigation/></AppProvider></ThemeProvider></SafeAreaProvider>;
}
