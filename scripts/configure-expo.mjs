import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const path = new URL("../app.json", import.meta.url);
let config = JSON.parse(readFileSync(path, "utf8"));
let projectId = process.env.EXPO_PROJECT_ID || config.expo.extra?.eas?.projectId;
let owner = process.env.EXPO_OWNER || config.expo.owner;
if (!owner && !projectId) {
 const output=execFileSync("eas",["whoami"],{encoding:"utf8",stdio:["ignore","pipe","inherit"]});
 owner=output.split(/\r?\n/).map(line=>line.trim()).find(line=>/^[a-zA-Z0-9_-]+$/.test(line));
 if(!owner)throw new Error("Cannot select the Expo account automatically. Set EXPO_OWNER to your account/organization.");
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
