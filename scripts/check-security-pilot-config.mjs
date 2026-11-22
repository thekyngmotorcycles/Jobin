import {readFileSync} from "node:fs";
const raw=JSON.parse(readFileSync(process.argv[2],"utf8"));
const expo=raw.expo??raw;
if(expo.name!=="Jobeen Security Pilot"||
 expo.android?.package!=="com.thekyngmotorcycles.jobin.securitypilot"||
 expo.scheme!=="jobeen-security-pilot"||
 expo.ios?.bundleIdentifier!=="com.thekyngmotorcycles.jobin.securitypilot"||
 expo.updates?.enabled!==false||
 expo.extra?.securityPilot!==true)
 throw Error("Resolved security pilot configuration differs from the reviewed isolated variant.");
console.log("Pilot Expo configuration isolated; no APK or OTA built.");
