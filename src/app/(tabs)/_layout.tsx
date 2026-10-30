import { Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../state/ThemeProvider";

const routes = [
  { name: "index", title: "Home", icon: "home", outline: "home-outline" },
  { name: "streams", title: "Live", icon: "radio", outline: "radio-outline" },
  { name: "videos", title: "Videos", icon: "play-circle", outline: "play-circle-outline" },
  { name: "inbox", title: "Mensajes", icon: "mail", outline: "mail-outline" },
  { name: "profile", title: "Perfil", icon: "person", outline: "person-outline" }
] as const;
export default function TabLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const inset = useSafeAreaInsets();
  const dark = pathname === "/" || pathname === "/videos";
  const ink = dark ? "#fff" : colors.ink;
  const muted = dark ? "#a8a8a8" : colors.muted;
  const background = dark ? "#080808" : colors.card;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: ink,
        tabBarInactiveTintColor: muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: background,
          borderTopColor: dark ? "#222" : colors.line,
          height: 58 + inset.bottom,
          paddingTop: 5,
          paddingBottom: Math.max(5, inset.bottom)
        },
        tabBarIconStyle: { height: 28 }
      }}
    >
      <Tabs.Screen name="create" options={{ href: null }} />
      {routes.map(route => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.title,
            tabBarAccessibilityLabel: route.title,
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? route.icon : route.outline} size={25} color={color} />
          }}
        />
      ))}
    </Tabs>
  );
}
