import { Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../state/ThemeProvider";

const routes = [
  { name: "index", title: "Home", icon: "play", outline: "play-outline" },
  { name: "streams", title: "Live", icon: "radio", outline: "radio-outline" },
  { name: "create", title: "Create", icon: "add-circle", outline: "add-circle-outline" },
  { name: "inbox", title: "Inbox", icon: "mail", outline: "mail-outline" },
  { name: "profile", title: "Me", icon: "person", outline: "person-outline" }
] as const;
export default function TabLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const inset = useSafeAreaInsets();
  const dark = pathname === "/";
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
      {routes.map(route => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.title,
            tabBarAccessibilityLabel: route.title,
            tabBarIcon: ({ color, focused }) =>
              route.name === "create" ? (
                <View
                  style={{
                    width: 43,
                    height: 29,
                    borderRadius: 8,
                    backgroundColor: ink,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Ionicons name="add-circle" size={27} color={dark ? "#111" : colors.inverse} />
                </View>
              ) : (
                <Ionicons name={focused ? route.icon : route.outline} size={25} color={color} />
              )
          }}
        />
      ))}
    </Tabs>
  );
}
