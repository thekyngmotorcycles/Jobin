import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {livePreflight,liveVisibility} from "../src/lib/live-preflight.ts";
const scope={owner:"A",session:"A1"};
const good={safety:{providersReady:true,mediaBlocked:false,accountBlocked:false,permanent:false},options:{professions:[{code:"hvac"}],employers:[{id:"good",approved:true,representative:true},{id:"pending",approved:false,representative:true},{id:"no-permission",approved:true,representative:false}]},safetyScope:scope,optionsScope:scope,loading:false,error:false,title:" Reparación ",profession:"hvac",activity:"work",consent:true};
test("Live setup fails closed when providers, safety status or session cannot be verified",()=>{
 assert.equal(livePreflight(good).ready,true);
 for(const input of [{...good,safety:null},{...good,options:null},{...good,loading:true},{...good,error:true},{...good,safety:{...good.safety,providersReady:false}},{...good,safety:{...good.safety,mediaBlocked:true}},{...good,safety:{...good.safety,accountBlocked:true}},{...good,safety:{...good.safety,permanent:true}},{...good,optionsScope:{owner:"B",session:"B1"}},{...good,optionsScope:{owner:"A",session:"A2"}},{...good,safetyScope:null}])assert.equal(livePreflight(input).ready,false);
});
test("Live preflight rejects invalid title, unlisted profession, unapproved employer and missing consent",()=>{
 for(const input of [{...good,title:" "},{...good,title:"x".repeat(161)},{...good,profession:"unknown"},{...good,activity:"unknown"},{...good,consent:false},{...good,employer:"pending"},{...good,employer:"no-permission"},{...good,employer:"unknown"}])assert.equal(livePreflight(input).ready,false);
 assert.equal(livePreflight({...good,employer:"good"}).ready,true);
 assert.equal(liveVisibility("interview","public"),"private");
 assert.equal(liveVisibility("work","public"),"public");
});
test("Live form keeps existing server authorization and private studio capabilities",()=>{
 const page=readFileSync("src/app/live.tsx","utf8");
 const fields=readFileSync("src/components/WorkRulesFields.tsx","utf8");
 const media=readFileSync("src/components/MyWorkMedia.tsx","utf8");
 assert.ok(page.includes("useWorkDraft(true)"));
 assert.ok(page.includes("safetyScope:safety.scope,optionsScope:draft.options.scope"));
 assert.ok(page.includes("if(!readiness.ready||action.busy)return"));
 assert.ok(page.includes('disabled={!readiness.ready}'));
 assert.ok(page.includes('await safetyMutation("jobin_request_work_live",payload,scope)'));
 assert.ok(page.includes('visibility:selectedVisibility,consent:draft.consent'));
 assert.ok(fields.includes("disabled={live&&(!e.approved||!e.representative)}"));
 assert.ok(media.includes("await loadStudioLink(m.id,scope);await check();await Linking.openURL(url)"));
 assert.ok(media.includes('safetyMutation("jobin_end_work_live",{media:m.id},scope)'));
 assert.ok(page.includes('<MyWorkMedia kind="live"/>'));
 assert.ok(!page.includes("CameraView"));
});
