import {requireSupabase} from "./supabase";
export type EmployerLink={id:string;worker_id:string;company_id:string;status:"pending"|"approved"|"rejected"|"withdrawn"|"ended";name:string;handle:string;worker_name:string;requested_at:string};
export type EmployerOption={id:string;name:string;handle:string};
async function rpc<T>(name:string,args?:Record<string,unknown>):Promise<T>{
 const {data,error}=await (requireSupabase() as any).rpc(name,args);
 if(error)throw new Error(error.message);
 return data as T;
}
export const searchEmployers=(term:string)=>rpc<EmployerOption[]>("jobin_search_employers",{search_term:term});
export const getEmployerLinks=()=>rpc<EmployerLink[]>("jobin_employer_links_for_me");
export const requestEmployer=(id:string)=>rpc<string>("jobin_request_employer",{company:id});
export const decideEmployer=(id:string,decision:"approved"|"rejected")=>rpc<void>("jobin_decide_employer",{link:id,decision});
export const endEmployer=(id:string)=>rpc<void>("jobin_end_employer",{link:id});
