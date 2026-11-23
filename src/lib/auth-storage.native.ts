import * as SecureStore from "expo-secure-store";
import {createCredentialVault,type NativeSecretBackend} from "./credential-vault";

const options:SecureStore.SecureStoreOptions={
 keychainService:"jobeen.auth.credentials.v2",
 keychainAccessible:SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
 requireAuthentication:false
};
const backend:NativeSecretBackend={
 isAvailableAsync:()=>SecureStore.isAvailableAsync(),
 getItemAsync:(key)=>SecureStore.getItemAsync(key,options),
 setItemAsync:(key,value)=>SecureStore.setItemAsync(key,value,options),
 deleteItemAsync:(key)=>SecureStore.deleteItemAsync(key,options)
};
// No AsyncStorage import, legacy credential read, or fallback on native.
// Create one vault for the single Supabase client. Auth can refresh without
// requiring biometric UI; critical operations still reauthenticate on server.
export function createAuthStorage(storageKey:string){
 return createCredentialVault(backend,storageKey);
}
