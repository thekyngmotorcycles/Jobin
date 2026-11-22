import {requireSupabase} from "./supabase";
import {assertMessageScope,captureMessageScope,type MessageScope} from "./message-session";

export type CVRequest={id:string;owner_id:string;requester_id:string;status:"pending"|"approved"|"denied"|"revoked";created_at:string};
const fields="id,owner_id,requester_id,status,created_at";
export async function requestCV(owner:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 if(owner===scope.owner)throw Error("No necesitas solicitar acceso a tu propio historial.");
 const {data,error}=await (requireSupabase() as any).rpc("request_employment_access",{p_owner:owner});
 if(error)throw error;
 await assertMessageScope(scope);
 return data;
}
export async function cvRequests(expectedScope?:MessageScope):Promise<CVRequest[]>{
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await (requireSupabase() as any).from("employment_access_requests").select(fields)
  .or(`owner_id.eq.${scope.owner},requester_id.eq.${scope.owner}`).order("created_at",{ascending:false});
 if(error)throw error;
 await assertMessageScope(scope);
 return ((data??[]) as CVRequest[]).filter(r=>r.owner_id===scope.owner||r.requester_id===scope.owner);
}
export async function respondCV(id:string,approve:boolean,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 const {error}=await (requireSupabase() as any).rpc("respond_employment_access",{p_request:id,p_approve:approve});
 if(error)throw error;
 await assertMessageScope(scope);
}
export async function revokeCV(id:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 const {error}=await (requireSupabase() as any).rpc("revoke_employment_access",{p_request:id});
 if(error)throw error;
 await assertMessageScope(scope);
}
export async function approvedCV(owner:string,expectedScope?:MessageScope){
 const scope=await captureMessageScope(expectedScope);
 const {data,error}=await (requireSupabase() as any).rpc("read_approved_employment",{p_owner:owner});
 if(error)throw error;
 await assertMessageScope(scope);
 return (data??[]) as {company:string;role:string;from_year:number;to_year:number|null}[];
}
