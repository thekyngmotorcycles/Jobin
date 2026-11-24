import {test} from "node:test";
import assert from "node:assert/strict";
import {hasActiveOwnLive} from "../src/lib/live-preflight.ts";

const scope={owner:"a",session:"session-a"};
const item={creator_id:"a",kind:"live",status:"live",studioReady:true};
const input={ownerId:"a",workspaceScope:scope,mediaScope:scope,error:false,media:[item]};
test("profile shortcut only returns to a verified active own Live",()=>{
 assert.equal(hasActiveOwnLive(input),true);
 for(const patch of [{ownerId:undefined},{workspaceScope:null},{mediaScope:null},{mediaScope:{...scope,session:"other"}},{workspaceScope:{...scope,owner:"b"}},{mediaScope:{...scope,owner:"b"}},{error:true},{media:null},{media:[]}])assert.equal(hasActiveOwnLive({...input,...patch}),false);
 for(const patch of [{creator_id:"b"},{kind:"video"},{status:"held"},{status:"pending"},{status:"ended"},{studioReady:false},{studioReady:undefined}])assert.equal(hasActiveOwnLive({...input,media:[{...item,...patch}]}),false);
});
