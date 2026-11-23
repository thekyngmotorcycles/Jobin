import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";
export type EmployerLink={id:string;worker_id:string;company_id:string;status:"pending"|"approved"|"rejected"|"withdrawn"|"ended";name:string;handle:string;worker_name:string;requested_at:string};
export type EmployerOption={id:string;name:string;handle:string};
async function rpc<T>(name:string,scope:MessageScope,args?:Record<string,unknown>):Promise<T>{
 await assertMessageScope(scope);
 const {data,error}=await (requireSupabase() as any).rpc(name,args);
 if(error)throw new Error(error.message);
 await assertMessageScope(scope);
 return data as T;
}
export async function searchEmployers(term:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 return rpc<EmployerOption[]>("jobin_search_employers",scope,{search_term:term});
}
export async function getEmployerLinks(expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 const rows=await rpc<EmployerLink[]>("jobin_employer_links_for_me",scope);
 return (rows??[]).filter(row=>row.worker_id===scope.owner||row.company_id===scope.owner);
}
export async function requestEmployer(id:string,scope:MessageScope){
 await captureMessageScope(scope);
 return rpc<string>("jobin_request_employer",scope,{company:id});
}
export async function decideEmployer(id:string,decision:"approved"|"rejected",scope:MessageScope){
 await captureMessageScope(scope);
 return rpc<void>("jobin_decide_employer",scope,{link:id,decision});
}
export async function endEmployer(id:string,scope:MessageScope){
 await captureMessageScope(scope);
 return rpc<void>("jobin_end_employer",scope,{link:id});
}
