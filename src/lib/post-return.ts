import {createBusinessSessionMemory} from "./business-session-memory";
import {supabase} from "./supabase";
import {sessionMarkerKey} from "./session-lifetime";
import {type MessageScope} from "./message-session";

// One-shot handoff never crosses an authentication session.
const memory=createBusinessSessionMemory<string>();
let observed:string|null=null;
supabase?.auth.onAuthStateChange((event,session)=>{
 let next:string|null=null;
 try{if(session)next=sessionMarkerKey(session.user.id,session.access_token);}catch{}
 if(next!==observed||event==="SIGNED_OUT")memory.clear();
 observed=next;
});
export function markPublishedPostForHome(postId:string,scope:MessageScope){
 memory.write(scope,postId);
}
export function takePublishedPostForHome(scope:MessageScope){
 const postId=memory.read(scope)??"";
 memory.clear();
 return postId;
}
