import {assertAccountOwner} from "./account-scope";
import {supabase} from "./supabase";
import {sessionMarkerKey} from "./session-lifetime";
import {createBusinessSessionMemory} from "./business-session-memory";
import type {MessageScope} from "./message-session";
import type {BusinessCardData} from "./jcard";

export const EMPTY_BUSINESS_CARD:BusinessCardData={
 name:"",businessHandle:"",category:"",opened:"",closed:"",services:[],
 location:"",email:"",emailSecondary:"",phone:"",phoneSecondary:"",
 phoneLabel:"",phoneSecondaryLabel:"",licenseVerified:false,rating:null,reviewCount:0
};
const memory=createBusinessSessionMemory<BusinessCardData>();
let observed:string|null=null;
supabase?.auth.onAuthStateChange((event,session)=>{
 let next:string|null=null;
 try{if(session)next=sessionMarkerKey(session.user.id,session.access_token);}catch{/* fail closed */}
 if(next!==observed||event==="SIGNED_OUT")memory.clear();
 observed=next;
});
/** Leave jobin.business.card.v1 and jobeen.business.card.v2.* untouched on disk.
 * Neither legacy snapshot is eligible for automatic restoration or upload. */
export function clearBusinessCardMemory(){memory.clear();}
export async function readScopedBusinessCard(owner:string,scope:MessageScope):Promise<BusinessCardData|null>{
 if(scope.owner!==owner)throw Error("La cuenta cambió.");
 await assertAccountOwner(owner,scope.session);
 return memory.read(scope);
}
export async function writeScopedBusinessCard(owner:string,card:BusinessCardData,scope:MessageScope){
 if(scope.owner!==owner)throw Error("La cuenta cambió.");
 await assertAccountOwner(owner,scope.session);
 memory.write(scope,card);
}
