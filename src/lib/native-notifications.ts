import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { jobinNativeColors } from "../theme/native";

/**
 * Android notification setup is opt-in. Call only after a user enables push.
 * Token registration in Supabase and server-side delivery are separate tasks.
 */
export async function prepareJobinPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("jobin-activity", {
      name: "Actividad de Jobin",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: jobinNativeColors.notificationLight,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof projectId !== "string" || !projectId) {
    throw new Error("No se encontró el proyecto EAS de Jobin.");
  }
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function observeJobinNotificationTap(onOpen: (data: Record<string, unknown>) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    onOpen(data);
  });
}
