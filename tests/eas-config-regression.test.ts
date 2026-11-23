import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("EAS build profiles reject empty env values while security pilot gateway stays disabled",()=>{
 const eas=JSON.parse(readFileSync("eas.json","utf8"));
 for(const profile of Object.values(eas.build)){
  for(const value of Object.values(profile.env??{}))assert.notEqual(value,"");
 }
 assert.equal(Object.hasOwn(eas.build["security-pilot"].env,"EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL"),false);
 const pilot=readFileSync(".github/workflows/security-pilot-android.yml","utf8");
 assert.match(pilot,/EXPO_PUBLIC_PRIVATE_VIDEO_UPLOAD_URL: ""/);
});
