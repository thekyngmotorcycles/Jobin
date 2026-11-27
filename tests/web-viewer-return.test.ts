import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {readViewerReturn,viewerFramePage} from "../src/lib/web-viewer-return.ts";
import {jcardProfileBodyHeight,jcardProfileIdentitySpace,jcardProfilePortraitMetrics} from "../src/theme/jcard.ts";
test("viewer return preserves safe selected route, device and custom width, rejects tampering",()=>{
 const now=1000000, valid={created:now,device:"iphone",width:402,page:"/profile"};
 assert.equal(readViewerReturn(JSON.stringify(valid),now),"/device-preview.html?device=iphone&width=402&page=%2Fprofile");
 for(const changes of [{page:"//evil.test"},{page:"/settings"},{width:441},{device:"bad"},{created:now+1},{created:now-900001}])assert.equal(readViewerReturn(JSON.stringify({...valid,...changes}),now),null);
 assert.equal(viewerFramePage("/device-preview.html","/profile"),"/profile");
 assert.equal(viewerFramePage("/other","/profile"),null);
 assert.equal(viewerFramePage("/device-preview.html","https://evil.test"),null);
});
test("profile geometry reserves 16 logical pixels after three touch rows",()=>{
 for(const screen of [320,360,390,402,440])for(const scale of [1,1.3,2]){
  const width=screen-32,identity=jcardProfileIdentitySpace(jcardProfilePortraitMetrics(width),scale).minHeight;
  assert.ok(jcardProfileBodyHeight(width,scale)>=identity+3*48+16);
 }
});
test("public experience is an authenticated scalar projection, not a private CV read",()=>{
 const sql=readFileSync("supabase/security-review/public-primary-experience.sql","utf8");
 assert.ok(sql.includes("auth.uid() is not null")&&sql.includes("not private.is_blocked")&&sql.includes("coalesce(v.personal_enabled,true)"));
 assert.ok(sql.includes("not h.ownership_review_pending and not h.ownership_review_excluded")&&sql.includes("select distinct m.month_index"));
 assert.ok(sql.includes("returns integer")&&sql.includes("from public,anon,authenticated"));
 const api=readFileSync("src/lib/professional-api.ts","utf8");
 assert.ok(api.includes('rpc("jobeen_public_primary_experience"')&&api.includes("primaryExperienceMonths:!experience.error"));
});
