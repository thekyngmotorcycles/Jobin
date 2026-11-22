import {assertAccountOwner} from "./account-scope";
import {supabase} from "./supabase";
import {sessionMarkerKey} from "./session-lifetime";
import {createBusinessSessionMemory} from "./business-session-memory";
import {type MessageScope} from "./message-session";
import {mergeRecentSearches} from "./search-history-core";

// Search terms may contain names or sensitive information. Do not restore
// or overwrite the old plaintext keys; retain only this session's queries.
const memory=createBusinessSessionMemory<string[]>();
let observed:string|null=null;
supabase?.auth.onAuthStateChange((event,session)=>{
 let next:string|null=null;
 try{if(session)next=sessionMarkerKey(session.user.id,session.access_token);}catch{/* fail closed */}
 if(next!==observed||event==="SIGNED_OUT")memory.clear();
 observed=next;
});
async function confirm(ownerId:string,scope:MessageScope){
 if(!scope||scope.owner!==ownerId)throw Error("La cuenta cambió.");
 await assertAccountOwner(ownerId,scope.session);
}
export async function readRecentSearches(ownerId:string,scope:MessageScope):Promise<string[]>{
 await confirm(ownerId,scope);
 return [...(memory.read(scope)??[])];
}
export async function rememberRecentSearch(ownerId:string,query:string,scope:MessageScope):Promise<string[]>{
 await confirm(ownerId,scope);
 const next=mergeRecentSearches(memory.read(scope)??[],query);
 memory.write(scope,next);
 return [...next];
}
export async function clearRecentSearches(ownerId:string,scope:MessageScope){
 await confirm(ownerId,scope);
 memory.clear();
}
