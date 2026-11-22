import AsyncStorage from "@react-native-async-storage/async-storage";
import {captureMessageScope,assertMessageScope,type MessageScope} from "./message-session";
import {createLegacyPrivateInventory} from "./legacy-private-inventory";
// Read-only candidate for an explicit recovery screen. Never call on startup.
// AsyncStorage has no contains API; use getItem for the single approved key,
// discard the value immediately and never parse, log or return it.
const inspect=createLegacyPrivateInventory({
 async contains(key){return (await AsyncStorage.getItem(key))!==null;}
},assertMessageScope);
export async function inspectLegacyPrivateInventory(expectedScope:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 return inspect(scope);
}
