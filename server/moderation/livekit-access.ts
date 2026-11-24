/** Pure policy for the future trusted LiveKit bridge. No SDK, network or token minting.
 * Callers MUST obtain actor and entitlement from verified server-side authorization,
 * not from client-provided flags. This does not implement media-plane revocation.
 */
import {LIVE_MAX_UNSUPERVISED_SECONDS} from "./contracts.ts";
type LiveStatus="pending"|"processing"|"moderating"|"live"|"held"|"blocked"|"ended"|"failed";
type Source={room:string;owner:string;status:LiveStatus;providersReady:boolean};
type Actor={kind:"publisher";id:string;authorized:boolean}|{kind:"supervisor";authorized:boolean};
export function privateIngressGrant(source:Source,actor:Actor){
 if(!source.room.trim()||!source.owner.trim()||!source.providersReady||!actor.authorized||
   !["moderating","live"].includes(source.status))return null;
 if(actor.kind==="publisher"&&actor.id!==source.owner)return null;
 const publish=actor.kind==="publisher";
 return {room:source.room,roomJoin:true,canPublish:publish,canSubscribe:!publish,canPublishData:false,
  ...(publish?{canPublishSources:["camera","microphone"] as const}:{})};
}
/** Absolute delivery deadline, never a rolling 60 seconds from receipt.
 * The real gateway must also close active responses at the deadline and deny
 * cached/origin paths; returning this value is not proof of enforcement.
 */
export function deliveryDeadline(input:{status:LiveStatus;providersReady:boolean;viewerAuthorized:boolean;leaseUntilMs:number;nowMs:number}):number|null{
 const {status,providersReady,viewerAuthorized,leaseUntilMs,nowMs}=input;
 if(status!=="live"||!providersReady||!viewerAuthorized||
   !Number.isSafeInteger(nowMs)||!Number.isSafeInteger(leaseUntilMs)||
   nowMs<0||leaseUntilMs<=nowMs||leaseUntilMs-nowMs>LIVE_MAX_UNSUPERVISED_SECONDS*1000)return null;
 return leaseUntilMs;
}
