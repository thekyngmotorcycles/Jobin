// Native contact editor requires a fresh Android APK.
import {Alert,Platform} from "react-native";
import * as Contacts from "expo-contacts";

export type JCardContact={name:string;phone?:string|null;email?:string|null};

/** Open the OS's new-contact form. The user reviews and confirms; no silent writes. */
export async function presentJCardContact(data:JCardContact):Promise<void>{
 const name=data.name.trim();
 const phone=data.phone?.trim()??"";
 const email=data.email?.trim()??"";
 if(!name||(!phone&&!email)){
  Alert.alert("Contacto no disponible","Esta JCard no tiene un teléfono o correo visible para guardar.");
  return;
 }
 if(Platform.OS==="web"){
  Alert.alert("Guardar contacto","Abre esta JCard en Android o iOS para guardar el contacto.");
  return;
 }
 try{
  const contact={
   name,
   ...(phone?{phoneNumbers:[{number:phone,label:"mobile"}]}:{}),
   ...(email?{emails:[{email,label:"work"}]}:{}),
  } as Contacts.Contact;
  await Contacts.presentFormAsync(undefined,contact);
 }catch(error){
  Alert.alert("No se pudo abrir Contactos",error instanceof Error?error.message:"Inténtalo de nuevo.");
 }
}
