import type {MessageScope} from "./session-continuity";
export async function recoverVerifiedTextPosts(_grant:string,_scope:MessageScope,_confirmed:boolean):Promise<"restored"|"conflict">{
 throw Error("La recuperación requiere una aplicación nativa compatible.");
}
