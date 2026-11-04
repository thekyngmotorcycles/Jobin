import {requireSupabase} from "./supabase";
export async function identityVerified(userId:string):Promise<boolean>{
 if(!userId)return false;
 const {data,error}=await (requireSupabase() as any).rpc("identity_verified",{p_user:userId});
 if(error)throw error;
 return data===true;
}
