import {readFileSync} from "node:fs";
const raw=JSON.parse(readFileSync(process.argv[2],"utf8"));
const expo=raw.expo??raw;
if(expo.name!=="Jobeen Security Pilot"||
 expo.android?.package!=="com.thekyngmotorcycles.jobin.securitypilot"||
 expo.scheme!=="jobeen-security-pilot"||
 expo.ios?.bundleIdentifier!=="com.thekyngmotorcycles.jobin.securitypilot"||
 expo.updates?.enabled!==false||
 expo.extra?.securityPilot!==true||
 expo.slug!=="jobeen-security-pilot"||
 !process.env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID||
 expo.extra?.eas?.projectId!==process.env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID||
 expo.extra?.eas?.projectId==="a6befb1a-dc03-45a8-a18c-294643e99434")
 throw Error("Resolved security pilot configuration differs from the reviewed isolated variant.");
console.log("Pilot Expo configuration isolated; no APK or OTA built.");
