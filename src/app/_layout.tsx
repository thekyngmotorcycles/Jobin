import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../state/AppProvider";
import { colors } from "../components/ui";

const screens = [
  { name: "index", title: "Descubrir", icon: "◈" },
  { name: "services", title: "Servicios", icon: "▦" },
  { name: "connect", title: "Conectar", icon: "♡" },
  { name: "communities", title: "Comunidad", icon: "◎" },
  { name: "profile", title: "Mi perfil", icon: "◉" },
];
export default function RootLayout() {
  return <SafeAreaProvider><AppProvider><StatusBar style="dark" />
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: colors.ink,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: "#fff", borderTopColor: colors.line },
      tabBarLabelStyle: { fontSize: 10 },
    }}>{screens.map(screen => <Tabs.Screen key={screen.name} name={screen.name} options={{
      title: screen.title,
      tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>{screen.icon}</Text>,
    }} />)}</Tabs>
  </AppProvider></SafeAreaProvider>;
}
