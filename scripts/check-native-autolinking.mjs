import {readFileSync} from "node:fs";
const result=JSON.parse(readFileSync(process.argv[2],"utf8"));
if(!Array.isArray(result.modules))throw Error("Unexpected Android autolinking result");
const required=["expo-secure-store","jobeen-private-files","expo-camera","expo-video","expo-notifications"];
for(const name of required){
 const module=result.modules.find(m=>m.packageName===name);
 if(!module||!Array.isArray(module.projects)||module.projects.length===0)throw Error("Missing Android autolink: "+name);
}
const local=result.modules.find(m=>m.packageName==="jobeen-private-files");
if(!JSON.stringify(local).includes("expo.modules.jobeenprivatefiles.JobeenPrivateFilesModule"))throw Error("Private file module class missing");
console.log("Required Android modules resolve; no APK compiled.");
