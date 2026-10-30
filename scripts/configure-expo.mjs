import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const path = new URL("../app.json", import.meta.url);
let config = JSON.parse(readFileSync(path, "utf8"));
let projectId = process.env.EXPO_PROJECT_ID || config.expo.extra?.eas?.projectId;
let owner = process.env.EXPO_OWNER || config.expo.owner;
if (!owner && !projectId) {
 const response=await fetch("https://api.expo.dev/graphql",{
  method:"POST",
  headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.EXPO_TOKEN},
  body:JSON.stringify({query:"query JobinAccount { meActor { accounts { name } ... on UserActor { primaryAccount { name } } } }"})
 });
 const result=await response.json();
 if(!response.ok||result.errors)throw new Error("Expo account lookup failed: "+(result.errors?.map(e=>e.message).join("; ")||response.status));
 const actor=result.data?.meActor;
 owner=actor?.primaryAccount?.name||(actor?.accounts?.length===1?actor.accounts[0].name:null);
 if(!owner)throw new Error("Several Expo accounts are available. Set EXPO_OWNER to the intended account.");
}

if(!projectId){
 execFileSync("eas",["init","--account",owner,"--non-interactive"],{stdio:"inherit"});
 config=JSON.parse(readFileSync(path,"utf8"));
 projectId=config.expo.extra?.eas?.projectId;
}else if(!config.expo.extra?.eas?.projectId){
 execFileSync("eas",["init","--id",projectId,"--non-interactive"],{stdio:"inherit"});
 config=JSON.parse(readFileSync(path,"utf8"));
}
if(!projectId)throw new Error("Expo did not return a project ID.");
config.expo.updates = { ...config.expo.updates, url: "https://u.expo.dev/" + projectId };
config.expo.runtimeVersion = { policy: "fingerprint" };
writeFileSync(path,JSON.stringify(config,null,2)+"\n");
console.log("Expo project:",projectId);
