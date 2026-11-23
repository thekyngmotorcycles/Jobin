import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const dynamic=require("../app.config.js") as (options:{config:Record<string,unknown>})=>Record<string,any>;
const base=JSON.parse(readFileSync("app.json","utf8")).expo;
const eas=JSON.parse(readFileSync("eas.json","utf8"));
test("Default app identity, update endpoint and data source remain unchanged",()=>{
 const saved=process.env.JOBEEN_SECURITY_PILOT;
 try{
  delete process.env.JOBEEN_SECURITY_PILOT;
  assert.deepEqual(dynamic({config:base}),base);
 }finally{if(saved===undefined)delete process.env.JOBEEN_SECURITY_PILOT;else process.env.JOBEEN_SECURITY_PILOT=saved;}
});
test("Security pilot requires distinct backend, native identity, and disables OTA",()=>{
 const keys=["JOBEEN_SECURITY_PILOT","EXPO_PUBLIC_JOBEEN_SECURITY_PILOT","EXPO_PUBLIC_SUPABASE_URL","EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY","JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID"] as const;
 const original=keys.map(k=>process.env[k]);
 try{
  delete process.env.JOBEEN_SECURITY_PILOT;
  process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT="1";
  assert.throws(()=>dynamic({config:base}),/both build and client flags/);
  process.env.JOBEEN_SECURITY_PILOT="1";
  delete process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT;
  assert.throws(()=>dynamic({config:base}),/flag missing/);
  process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT="1";
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  assert.throws(()=>dynamic({config:base}),/its own Supabase/);
  process.env.EXPO_PUBLIC_SUPABASE_URL="https://nwiimdmtddjquwxtjxmw.supabase.co";
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_synthetic-not-real";
  assert.throws(()=>dynamic({config:base}),/isolated Supabase/);
  process.env.EXPO_PUBLIC_SUPABASE_URL="https://abcdefghijklmnopqrst.supabase.co";
  assert.throws(()=>dynamic({config:base}),/isolated Supabase/);
  process.env.EXPO_PUBLIC_SUPABASE_URL="https://mkvzkvkmrribcaecvphq.supabase.co";
  delete process.env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID;
  assert.throws(()=>dynamic({config:base}),/separate Expo EAS project ID/);
  process.env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID=base.extra.eas.projectId;
  assert.throws(()=>dynamic({config:base}),/separate Expo EAS project ID/);
  process.env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID="11111111-2222-4333-8444-555555555555";
  assert.throws(()=>dynamic({config:base}),/separate Expo EAS project ID/);
  const pilotExpoId="de0b71bb-0646-48fa-a875-6b9662c3c2c7";
  process.env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID=pilotExpoId;
  const variant=dynamic({config:base});
  assert.equal(variant.android.package,"com.thekyngmotorcycles.jobin.securitypilot");
  assert.equal(variant.slug,"jobeen-security-pilot");
  assert.equal(variant.extra.eas.projectId,pilotExpoId);
  assert.equal(eas.build["security-pilot"].environment,"preview");
  assert.equal(eas.build["security-pilot"].env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID,pilotExpoId);
  assert.equal(variant.ios.bundleIdentifier,"com.thekyngmotorcycles.jobin.securitypilot");
  assert.equal(variant.scheme,"jobeen-security-pilot");
  assert.equal(variant.updates.enabled,false);
  assert.equal(variant.extra.securityPilot,true);
  assert.notEqual(variant.android.package,base.android.package);
  assert.equal(base.updates.url,"https://u.expo.dev/a6befb1a-dc03-45a8-a18c-294643e99434");
  assert.equal(eas.build["security-pilot"].env.JOBEEN_SECURITY_PILOT,"1");
  assert.equal(eas.build["security-pilot"].env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT,"1");
 }finally{keys.forEach((k,i)=>{if(original[i]===undefined)delete process.env[k];else process.env[k]=original[i];});}
});
test("Client pilot mode cannot fall back to the live backend",()=>{
 const source=readFileSync("src/lib/supabase.ts","utf8");
 assert.ok(source.includes("const url=pilot?(pilotValid?candidateUrl"));
 assert.ok(source.includes("const key=pilot?(pilotValid?candidateKey"));
 assert.ok(source.includes("u.hostname!==new URL(backendConfig.url).hostname"));
 assert.ok(source.includes('u.hostname==="mkvzkvkmrribcaecvphq.supabase.co"'));
 assert.ok(readFileSync("app.config.js","utf8").includes('parsed.hostname!=="mkvzkvkmrribcaecvphq.supabase.co"'));
});
