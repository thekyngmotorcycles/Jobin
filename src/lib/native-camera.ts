import { Platform } from "react-native";
import { Camera } from "expo-camera";

export type JobinCameraAccess = { camera: boolean; microphone: boolean };

/** Request permissions only from a camera or live-recording user action. */
export async function requestJobinCameraAccess(withMicrophone = true): Promise<JobinCameraAccess> {
  if (Platform.OS === "web") return { camera: false, microphone: false };
  const camera = await Camera.requestCameraPermissionsAsync();
  if (!camera.granted) return { camera: false, microphone: false };
  if (!withMicrophone) return { camera: true, microphone: false };
  const microphone = await Camera.requestMicrophonePermissionsAsync();
  return { camera: true, microphone: microphone.granted };
}
