import test from "node:test";
import assert from "node:assert/strict";
import {privateIngressGrant,deliveryDeadline} from "../server/moderation/livekit-access.ts";
const source={room:"private-live-unique",owner:"A",status:"moderating" as const,providersReady:true};
test("LiveKit private ingress grants have only the rights needed by owner and trusted supervisor",()=>{
 assert.deepEqual(privateIngressGrant(source,{kind:"publisher",id:"A",authorized:true}),{room:source.room,roomJoin:true,canPublish:true,canSubscribe:false,canPublishData:false,canPublishSources:["camera","microphone"]});
 assert.deepEqual(privateIngressGrant(source,{kind:"supervisor",authorized:true}),{room:source.room,roomJoin:true,canPublish:false,canSubscribe:true,canPublishData:false});
 assert.equal(privateIngressGrant(source,{kind:"publisher",id:"B",authorized:true}),null);
 assert.equal(privateIngressGrant(source,{kind:"supervisor",authorized:false}),null);
 assert.equal(privateIngressGrant({...source,providersReady:false},{kind:"publisher",id:"A",authorized:true}),null);
 for(const status of ["pending","processing","held","blocked","ended","failed"] as const)assert.equal(privateIngressGrant({...source,status},{kind:"publisher",id:"A",authorized:true}),null);
});
test("Delivery authorization keeps the original absolute lease deadline and fails closed",()=>{
 const valid={status:"live" as const,providersReady:true,viewerAuthorized:true,nowMs:100000,leaseUntilMs:160000};
 assert.equal(deliveryDeadline(valid),160000);
 assert.equal(deliveryDeadline({...valid,nowMs:159999}),160000);
 assert.equal(deliveryDeadline({...valid,nowMs:120000}),160000);
 assert.equal(deliveryDeadline({...valid,status:"held"}),null);
 for(const change of [{nowMs:160000},{nowMs:160001},{leaseUntilMs:160001},{leaseUntilMs:NaN},{leaseUntilMs:Infinity},{nowMs:NaN},{viewerAuthorized:false},{providersReady:false},{status:"moderating" as const},{status:"ended" as const},{status:"blocked" as const}])assert.equal(deliveryDeadline({...valid,...change}),null);
});
