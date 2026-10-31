import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { SAFETY_CATEGORIES,parseModerationResult } from "../server/moderation/contracts.ts";
import { verifyWebhook } from "../server/moderation/webhook.ts";
import { HttpModerationProvider,HttpVideoProvider } from "../server/moderation/http-providers.ts";
import { TERMS_DRAFT_CLAUSES,TERMS_PROFESSIONS } from "../src/lib/terms-draft.ts";
const fixture={status:"complete",jobId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",eventId:"test-only-result",assetId:"test-only-asset",coverage:[...SAFETY_CATEGORIES],findings:[],observedAt:"2026-10-31T00:00:00Z"};
test("incomplete and partial provider responses never become clean verdicts",()=>{
 assert.throws(()=>parseModerationResult({...fixture,status:"pending"}),/incomplete/);
 assert.throws(()=>parseModerationResult({...fixture,coverage:["nudity"]}),/five/);
 assert.throws(()=>parseModerationResult({...fixture,findings:[{category:"unknown",confidence:1}]}),/category/);
 assert.throws(()=>parseModerationResult({...fixture,findings:[{category:"blood",confidence:NaN}]}),/confidence/);
 assert.throws(()=>parseModerationResult({...fixture,findings:[{category:"blood",confidence:1.01}]}),/confidence/);
 assert.equal(parseModerationResult(fixture).findings.length,0);
});
test("webhooks require a constant-time HMAC match and a fresh timestamp",()=>{
 const now=Date.parse("2026-10-31T00:00:00Z");const timestamp=String(now/1000);const raw=Buffer.from(JSON.stringify(fixture));const secret="unit-test-secret-not-a-real-credential";
 const signature="sha256="+createHmac("sha256",secret).update(timestamp+".").update(raw).digest("hex");
 assert.equal(verifyWebhook(raw,timestamp,signature,secret,now).eventId,fixture.eventId);
 assert.throws(()=>verifyWebhook(Buffer.from(JSON.stringify({...fixture,assetId:"tampered"})),timestamp,signature,secret,now),/signature/);
 assert.throws(()=>verifyWebhook(raw,timestamp,signature,secret,now+301000),/Expired/);
 assert.throws(()=>verifyWebhook(raw,timestamp,signature,"",now),/signature/);
});
test("HTTP provider failures and unmeasured outputs are not simulated approvals",async()=>{
 const fail:typeof fetch=async()=>new Response("unavailable",{status:503});
 const moderation=new HttpModerationProvider("https://provider.example.test","test-only",fail);
 await assert.rejects(()=>moderation.analyzeVideo({jobId:fixture.jobId,mediaId:fixture.jobId,assetId:fixture.assetId,kind:"video",sourceUrl:"https://private.example.test/source",callbackUrl:"https://worker.example.test/moderation/webhook"}),/503/);
 const unmeasured:typeof fetch=async()=>Response.json({assetId:"fixture",playbackUrl:"https://video.example.test/output"});
 const video=new HttpVideoProvider("https://provider.example.test","test-only",unmeasured);
 await assert.rejects(()=>video.prepareVideo({sourceUrl:"https://private.example.test/source",startMs:0,endMs:1000,mediaId:fixture.jobId}),/not measured/);
});
test("legal draft explicitly lists all 114 professional trades and all sectors",()=>{
 assert.equal(TERMS_PROFESSIONS.length,13);
 assert.equal(TERMS_PROFESSIONS.flatMap(g=>g.professions).length,114);
 const professionNames=TERMS_PROFESSIONS.flatMap(g=>g.professions).join(" ").toLowerCase();
 assert.ok(!professionNames.includes("influencer")&&!professionNames.includes("streamer")&&!professionNames.includes("cannabis"));
 assert.match(TERMS_DRAFT_CLAUSES[0].title,/BORRADOR.*REVISIÓN LEGAL/);
});
