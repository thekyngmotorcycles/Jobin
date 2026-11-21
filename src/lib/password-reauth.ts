import {requireSupabase} from "./supabase";
import {sessionMarkerKey} from "./session-lifetime";

/** Retain only the session identity, never a password or OTP in persistent storage. */
export async function currentPasswordSession():Promise<string>{
 const {data,error}=await requireSupabase().auth.getSession();
 if(error)throw error;
 const session=data.session;
 if(!session)throw new Error("Inicia sesión para cambiar tu contraseña.");
 return sessionMarkerKey(session.user.id,session.access_token);
}
async function assertPasswordSession(expected:string){
 if(!expected||await currentPasswordSession()!==expected)throw new Error("La sesión cambió. Vuelve a abrir esta pantalla.");
}
export async function requestPasswordConfirmation(expected:string){
 await assertPasswordSession(expected);
 const {error}=await requireSupabase().auth.reauthenticate();
 if(error)throw error;
 await assertPasswordSession(expected);
}
export async function confirmPasswordChange(expected:string,nonce:string,password:string){
 if(!/^\d{6,10}$/.test(nonce.trim()))throw new Error("Introduce el código de verificación recibido.");
 if(password.length<8||password.length>128)throw new Error("Usa una contraseña de entre 8 y 128 caracteres.");
 await assertPasswordSession(expected);
 const {error}=await requireSupabase().auth.updateUser({password,nonce:nonce.trim()});
 if(error)throw error;
 await assertPasswordSession(expected);
}
