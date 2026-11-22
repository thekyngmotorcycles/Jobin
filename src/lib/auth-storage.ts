import {Platform} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Existing browser behavior is separate from native credentials. Never use
// this implementation on Android/iOS if platform resolution is incorrect.
export function createAuthStorage(_storageKey:string){
 if(Platform.OS!=="web")throw Error("Almacenamiento seguro nativo no disponible.");
 return AsyncStorage;
}
