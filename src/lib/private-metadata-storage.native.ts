import * as SecureStore from "expo-secure-store";
import {createPrivateMetadataVault} from "./private-metadata-vault";
import type {NativeSecretBackend} from "./credential-vault";
import {assertMessageScope} from "./message-session";
const options:SecureStore.SecureStoreOptions={
 keychainService:"jobeen.private.metadata.v1",
 keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
 requireAuthentication:false
};
const backend:NativeSecretBackend={
 isAvailableAsync:()=>SecureStore.isAvailableAsync(),
 getItemAsync:key=>SecureStore.getItemAsync(key,options),
 setItemAsync:(key,value)=>SecureStore.setItemAsync(key,value,options),
 deleteItemAsync:key=>SecureStore.deleteItemAsync(key,options)
};
// No automatic import from legacy plaintext.
export const privateMetadataStorage=createPrivateMetadataVault(backend,assertMessageScope);
