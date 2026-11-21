import {requireSupabase} from "./supabase";

/** Only allow private device data for the currently authenticated UUID. */
export async function assertAccountOwner(owner:string):Promise<void>{
 if(!owner||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner)))throw new Error("Inicia sesión para acceder a tus datos.");
 const {data,error}=await requireSupabase().auth.getSession();
 if(error||data.session?.user.id!==owner)throw new Error("La cuenta cambió. Vuelve a iniciar sesión.");
}
