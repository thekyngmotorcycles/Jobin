import { requireSupabase } from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
import type { Database, Json } from "./database.types";
import type { ProfessionalCatalog, ProfessionalWorkspace, RealCard, CredentialRequest, EducationOption, OrganizationData, CareerResult } from "./professional-types";

export function professionDisplayName(code:string,label:string):string {
 if(code==="tecnico_hvac_aire_acondicionado")return "Técnico HVAC";
 if(code==="refrigeracion")return "Técnico en Refrigeración";
 return label;
}
type Functions=Database["public"]["Functions"];
type Phase2Rpc=Extract<keyof Functions,
 "jobin_save_jcard"|"jobin_set_profession"|"jobin_remove_unverified_profession"|"jobin_set_organization_kind"|"jobin_submit_credential"|
 "jobin_decide_credential"|"jobin_verify_training"|"jobin_define_rank"|"jobin_grant_rank"|"jobin_set_representative"|"jobin_set_scope_active"|
 "jobin_contact_career"|"jobin_respond_career">;

export async function professionalMutation<N extends Phase2Rpc>(name:N,args:Functions[N]["Args"],expectedScope?:MessageScope) {
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await requireSupabase().rpc(name,args);
 if(error)throw new Error(error.message);
 await assertMessageScope(scope);
 return data;
}
function decode<T>(data:Json|null,error:{message:string}|null):T {
 if(error)throw new Error(error.message);
 if(data===null)throw new Error("No se encontró el perfil.");
 return data as unknown as T;
}
export async function replacePrimaryProfession(oldProfession:string,newProfession:string,training:"graduado"|"in_academy"|"practica",institution:string|null,expectedScope?:MessageScope):Promise<void> {
 const scope=await captureMessageScope(expectedScope);
 const {error}=await requireSupabase().rpc("jobin_replace_unverified_profession",{
  old_profession:oldProfession,new_profession:newProfession,training,institution
 });
 if(error)throw new Error(error.message);
 await assertMessageScope(scope);
}
export async function replaceSecondaryProfession(oldProfession:string,newProfession:string,training:"graduado"|"in_academy"|"practica",institution:string|null,expectedScope?:MessageScope):Promise<void> {
 const scope=await captureMessageScope(expectedScope);
 const {error}=await requireSupabase().rpc("jobin_replace_unverified_secondary_profession",{
  old_profession:oldProfession,new_profession:newProfession,training,institution
 });
 if(error)throw new Error(error.message);
 await assertMessageScope(scope);
}
export async function loadCatalog():Promise<ProfessionalCatalog> {
 const {data,error}=await requireSupabase().rpc("jobin_professional_catalog");
 const catalog=decode<ProfessionalCatalog>(data,error);
 return {...catalog,professions:catalog.professions.map(p=>({...p,label:professionDisplayName(p.code,p.label)}))};
}
export async function loadWorkspace(expectedScope?:MessageScope):Promise<ProfessionalWorkspace|null> {
 const client=requireSupabase();const {data:{session}}=await client.auth.getSession();
 if(!session&&!expectedScope)return null;
 const scope=await captureMessageScope(expectedScope);
 const user={id:scope.owner};
 if(session?.user.id!==user.id)throw Error("La sesión cambió.");
 const {data,error}=await client.rpc("jobin_professional_workspace");
 const result=decode<ProfessionalWorkspace>(data,error);
 if(!result.card)throw new Error("El perfil no está disponible.");
 if(result.card.id!==user.id)throw new Error("La sesión cambió. Vuelve a cargar el perfil.");
 await assertMessageScope(scope);
 const professions=result.professions.map(p=>({...p,label:professionDisplayName(p.profession_code,p.label)}));
 const primary=professions.find(p=>p.primary_profession);
 return {...result,professions,card:primary?{...result.card,role:primary.label}:result.card};
}
export async function loadPublicCard(id:string):Promise<RealCard> {
 const {data,error}=await requireSupabase().rpc("jobin_jcard_data",{target:id});
 return decode<RealCard>(data,error);
}
export async function loadOrganization(id?:string):Promise<OrganizationData> {
 const {data,error}=await requireSupabase().rpc("jobin_organization_data",id?{target:id}:{});
 return decode<OrganizationData>(data,error);
}
export async function loadQueue(status:"pending"|"approved"|"rejected"="pending",expectedScope?:MessageScope):Promise<CredentialRequest[]> {
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await requireSupabase().rpc("jobin_credential_queue",{status_filter:status});
 const rows=decode<CredentialRequest[]>(data,error);
 await assertMessageScope(scope);
 return rows.filter(r=>r.status===status);
}
export async function loadEducation(profession:string):Promise<EducationOption[]> {
 const {data,error}=await requireSupabase().rpc("jobin_education_options",{profession});
 return decode<EducationOption[]>(data,error);
}
export async function searchCareers(profession:string,city:string,mode:"students"|"companies"):Promise<CareerResult[]> {
 const {data,error}=await requireSupabase().rpc("jobin_career_search",{profession,city,mode});
 return decode<CareerResult[]>(data,error);
}
export async function uploadCredential(file:{uri:string;name:string;mimeType?:string|null;size?:number},profession:string,expectedScope:MessageScope) {
 const client=requireSupabase(),scope=await captureMessageScope(expectedScope),user={id:scope.owner};
 if(file.size && file.size>10485760)throw new Error("El documento no puede superar 10 MB.");
 const mime=file.mimeType||"application/pdf";
 const extension=mime==="image/jpeg"?"jpg":mime==="image/png"?"png":"pdf";
 if(!["application/pdf","image/jpeg","image/png"].includes(mime))throw new Error("Selecciona PDF, JPEG o PNG.");
 const path=user.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2)+"."+extension;
 const response=await fetch(file.uri);
 if(!response.ok)throw new Error("No se pudo leer el documento seleccionado.");
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength>10485760)throw Error("El documento no puede superar 10 MB.");
 await assertMessageScope(scope);
 const uploaded=await client.storage.from("professional-certificates").upload(path,bytes,{contentType:mime,upsert:false,cacheControl:"0"});
 if(uploaded.error)throw new Error(uploaded.error.message);
 await assertMessageScope(scope);
 try { await professionalMutation("jobin_submit_credential",{profession,path},scope); }
 catch { throw new Error("No se pudo confirmar el registro del documento. Actualiza tus solicitudes antes de reintentar."); }
}
export async function credentialPreview(path:string,expectedScope:MessageScope):Promise<string> {
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await requireSupabase().storage.from("professional-certificates").createSignedUrl(path,120);
 if(error)throw Error("No se pudo abrir el documento privado.");
 await assertMessageScope(scope);
 return data.signedUrl;
}

/** Public catalog of specialty options, grouped by stable profession code. */
export async function loadSpecialtyCatalog():Promise<Record<string,string[]>> {
 const {data,error}=await requireSupabase().rpc("jobin_specialty_catalog" as never);
 if(error)throw new Error(error.message);
 return (data??{}) as Record<string,string[]>;
}
/** Only the signed-in owner can change their declared specialties. */
export async function saveProfessionSpecialties(profession:string,specialties:string[],expectedScope?:MessageScope):Promise<void> {
 const scope=await captureMessageScope(expectedScope);
 const {error}=await requireSupabase().rpc("jobin_set_profession_specialties" as never,{p_profession:profession,p_specialties:specialties} as never);
 if(error)throw new Error(error.message);
 await assertMessageScope(scope);
}

export interface ProfessionalSearchResult {
 id:string;name:string;handle:string;city:string|null;region:string|null;
 profession:string;profession_code:string;specialties:string[];verified:boolean;
 verified_seals:number;business_rating:number;business_reviews:number;
 account_type:"personal"|"company";match_rank:number;trust_rank:number;
}
/** Server ranks relevance first and verified professional evidence second.
 * Personal profiles never receive fabricated star ratings. */
export async function findProfessionals(query:string,city:string,profession:string,specialty:string):Promise<ProfessionalSearchResult[]> {
 const {data,error}=await requireSupabase().rpc("jobin_find_professionals" as never,{
  p_query:query.trim(),p_city:city.trim(),p_profession:profession,p_specialty:specialty,p_limit:50
 } as never);
 if(error)throw new Error(error.message);
 return (data??[]) as ProfessionalSearchResult[];
}

/** People are personal accounts with no profession declared; they are not professionals. */
export interface PersonSearchResult {id:string;name:string;handle:string;city:string|null;region:string|null}
export async function findPeople(query:string,city:string):Promise<PersonSearchResult[]>{
 const {data,error}=await requireSupabase().rpc("jobeen_find_people" as never,{p_query:query.trim(),p_city:city.trim(),p_limit:50} as never);
 if(error)throw new Error(error.message);
 return (data??[]) as PersonSearchResult[];
}

/** Unified search for every registered, active account, regardless of profession. */
export interface AllAccountSearchResult {id:string;name:string;handle:string;city:string|null;region:string|null;account_type:"person"|"professional"|"company";profession:string}
export async function findAllAccounts(query:string,city:string):Promise<AllAccountSearchResult[]>{
 const {data,error}=await requireSupabase().rpc("jobeen_find_all_accounts" as never,{p_query:query.trim(),p_city:city.trim(),p_limit:50} as never);
 if(error)throw new Error(error.message);
 return (data??[]) as AllAccountSearchResult[];
}
