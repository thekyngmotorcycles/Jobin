import { requireSupabase } from "./supabase";
import type { Database, Json } from "./database.types";
import type { ProfessionalCatalog, ProfessionalWorkspace, RealCard, CredentialRequest, EducationOption, OrganizationData, CareerResult } from "./professional-types";

type Functions=Database["public"]["Functions"];
type Phase2Rpc=Extract<keyof Functions,
 "jobin_save_jcard"|"jobin_set_profession"|"jobin_remove_unverified_profession"|"jobin_set_organization_kind"|"jobin_submit_credential"|
 "jobin_decide_credential"|"jobin_verify_training"|"jobin_define_rank"|"jobin_grant_rank"|"jobin_set_representative"|"jobin_set_scope_active"|
 "jobin_contact_career"|"jobin_respond_career">;

export async function professionalMutation<N extends Phase2Rpc>(name:N,args:Functions[N]["Args"]) {
 const {data,error}=await requireSupabase().rpc(name,args);
 if(error)throw new Error(error.message);
 return data;
}
function decode<T>(data:Json|null,error:{message:string}|null):T {
 if(error)throw new Error(error.message);
 if(data===null)throw new Error("No se encontró el perfil.");
 return data as unknown as T;
}
export async function loadCatalog():Promise<ProfessionalCatalog> {
 const {data,error}=await requireSupabase().rpc("jobin_professional_catalog");
 return decode<ProfessionalCatalog>(data,error);
}
export async function loadWorkspace():Promise<ProfessionalWorkspace|null> {
 const client=requireSupabase();const {data:{session}}=await client.auth.getSession();
 if(!session)return null;
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError)throw new Error(authError.message);
 if(!user)return null;
 const {data,error}=await client.rpc("jobin_professional_workspace");
 return decode<ProfessionalWorkspace>(data,error);
}
export async function loadPublicCard(id:string):Promise<RealCard> {
 const {data,error}=await requireSupabase().rpc("jobin_jcard_data",{target:id});
 return decode<RealCard>(data,error);
}
export async function loadOrganization(id?:string):Promise<OrganizationData> {
 const {data,error}=await requireSupabase().rpc("jobin_organization_data",id?{target:id}:{});
 return decode<OrganizationData>(data,error);
}
export async function loadQueue():Promise<CredentialRequest[]> {
 const {data,error}=await requireSupabase().rpc("jobin_credential_queue");
 return decode<CredentialRequest[]>(data,error);
}
export async function loadEducation(profession:string):Promise<EducationOption[]> {
 const {data,error}=await requireSupabase().rpc("jobin_education_options",{profession});
 return decode<EducationOption[]>(data,error);
}
export async function searchCareers(profession:string,city:string,mode:"students"|"companies"):Promise<CareerResult[]> {
 const {data,error}=await requireSupabase().rpc("jobin_career_search",{profession,city,mode});
 return decode<CareerResult[]>(data,error);
}
export async function uploadCredential(file:{uri:string;name:string;mimeType?:string|null;size?:number},profession:string) {
 const client=requireSupabase();const {data:{user},error}=await client.auth.getUser();
 if(error||!user)throw new Error("Inicia sesión para enviar un certificado.");
 if(file.size && file.size>10485760)throw new Error("El documento no puede superar 10 MB.");
 const mime=file.mimeType||"application/pdf";
 const extension=mime==="image/jpeg"?"jpg":mime==="image/png"?"png":"pdf";
 if(!["application/pdf","image/jpeg","image/png"].includes(mime))throw new Error("Selecciona PDF, JPEG o PNG.");
 const path=user.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2)+"."+extension;
 const response=await fetch(file.uri);
 if(!response.ok)throw new Error("No se pudo leer el documento seleccionado.");
 const bytes=await response.arrayBuffer();
 const uploaded=await client.storage.from("professional-certificates").upload(path,bytes,{contentType:mime,upsert:false});
 if(uploaded.error)throw new Error(uploaded.error.message);
 try { await professionalMutation("jobin_submit_credential",{profession,path}); }
 catch(cause) { throw new Error("El archivo se subió, pero la solicitud no se registró: "+(cause instanceof Error?cause.message:String(cause))+". Ruta para reintentar: "+path); }
}
export async function credentialPreview(path:string):Promise<string> {
 const {data,error}=await requireSupabase().storage.from("professional-certificates").createSignedUrl(path,120);
 if(error)throw new Error(error.message);
 return data.signedUrl;
}
