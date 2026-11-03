import {requireSupabase} from "./supabase";
export type CVRequest={id:string;owner_id:string;requester_id:string;status:"pending"|"approved"|"denied"|"revoked";created_at:string};
export async function requestCV(owner:string){const {data,error}=await requireSupabase().rpc("request_employment_access",{p_owner:owner});if(error)throw error;return data;}
export async function cvRequests(){const {data,error}=await requireSupabase().from("employment_access_requests").select("*").order("created_at",{ascending:false});if(error)throw error;return data as CVRequest[];}
export async function respondCV(id:string,approve:boolean){const {error}=await requireSupabase().rpc("respond_employment_access",{p_request:id,p_approve:approve});if(error)throw error;}
export async function revokeCV(id:string){const {error}=await requireSupabase().rpc("revoke_employment_access",{p_request:id});if(error)throw error;}
export async function approvedCV(owner:string){const {data,error}=await requireSupabase().rpc("read_approved_employment",{p_owner:owner});if(error)throw error;return data as {company:string;role:string;from_year:number;to_year:number|null}[];}
