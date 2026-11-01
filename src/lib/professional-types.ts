import type { CardData } from "./jcard";
export interface Profession { code:string; category:string; label:string; short_label:string; icon:string; active:boolean }
export interface ProfessionalCatalog { categories:{code:string;label:string}[]; professions:Profession[] }
export type OrganizationKind="company"|"education"|"government";
export interface RealCard extends CardData { id:string; accountType:"personal"|"company" }
export interface PersonProfession {
 id:string; profession_code:string; label:string; training_status:"in_academy"|"graduado";
 institution_id:string|null; school:string|null; specialties?:string[]; verified_at:string|null; verified:boolean; primary_profession:boolean;
}
export interface CredentialRequest {
 id:string; owner_id:string; owner?:string; profession_code:string; label:string; storage_path:string;
 request_kind:"person"|"organization"; status:"pending"|"approved"|"rejected"; reason:string|null; created_at:string;
}
export interface CareerContact {
 id:string; student_id:string; organization_id:string; profession_code:string; profession:string;
 student:string; organization:string; kind:"application"|"invitation"; status:"pending"|"accepted"|"declined"|"withdrawn"; message:string;
}
export interface ProfessionalWorkspace {
 card:RealCard; profile:{city:string|null;region:string|null}; reviewer:boolean;
 organization:{profile_id:string;kind:OrganizationKind}|null;
 professions:PersonProfession[]; requests:CredentialRequest[]; contacts:CareerContact[];
}
export interface EducationOption { id:string; name:string; city:string|null }
export interface OrganizationData {
 id:string; name:string; kind:OrganizationKind; handle:string; city:string|null; region:string|null;
 scopes:{profession_code:string;label:string;active:boolean}[];
 ranks:{id:string;profession_code:string;label:string;short_label:string;ordinal:number}[];
 employees:{id:string;worker_id:string;name:string;handle:string;title:string;started_on:string;ended_on:string|null;approved:boolean;can_represent:boolean}[];
 students:(PersonProfession & {name:string})[];
}
export interface CareerResult { id:string;name:string;handle:string;city:string;verified:boolean }
export const ORGANIZATION_LABELS:Record<OrganizationKind,string>={company:"Empresa",education:"Centro de estudios",government:"Entidad gubernamental"};
export const CREDENTIAL_STATUS={pending:"Pendiente",approved:"Aprobado",rejected:"Rechazado"} as const;
