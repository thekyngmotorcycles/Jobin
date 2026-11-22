// Static app.json stays unchanged for the existing application.
// Only a specifically requested isolated build may alter native identity.
module.exports=({config})=>{
 if(process.env.JOBEEN_SECURITY_PILOT!=="1"){
  if(process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT==="1")throw Error("Security pilot requires both build and client flags.");
  return config;
 }
 if(process.env.EXPO_PUBLIC_JOBEEN_SECURITY_PILOT!=="1")throw Error("Security pilot flag missing.");
 const raw=process.env.EXPO_PUBLIC_SUPABASE_URL;
 const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 let parsed;
 try{parsed=new URL(raw??"");}catch{throw Error("Security pilot requires its own Supabase project.");}
 if(parsed.protocol!=="https:"||parsed.port||parsed.username||parsed.password||
    !/^[a-z0-9]{20}\.supabase\.co$/.test(parsed.hostname)||
    parsed.hostname!=="mkvzkvkmrribcaecvphq.supabase.co"||
    parsed.pathname!=="/"||parsed.search||parsed.hash||
    !key?.startsWith("sb_publishable_")||key.length<24)
  throw Error("Refusing a security pilot without an isolated Supabase origin and publishable key.");
 const pilotExpoProjectId=process.env.JOBEEN_SECURITY_PILOT_EAS_PROJECT_ID;
 const originalExpoProjectId=config.extra?.eas?.projectId??"a6befb1a-dc03-45a8-a18c-294643e99434";
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pilotExpoProjectId??"")||
    pilotExpoProjectId===originalExpoProjectId||
    pilotExpoProjectId==="a6befb1a-dc03-45a8-a18c-294643e99434")
  throw Error("Security pilot requires a separate Expo EAS project ID.");
 return {
  ...config,
  slug:"jobeen-security-pilot",
  name:"Jobeen Security Pilot",
  scheme:"jobeen-security-pilot",
  android:{...config.android,package:"com.thekyngmotorcycles.jobin.securitypilot"},
  ios:{...config.ios,bundleIdentifier:"com.thekyngmotorcycles.jobin.securitypilot"},
  updates:{enabled:false},
  extra:{...config.extra,eas:{...config.extra?.eas,projectId:pilotExpoProjectId},securityPilot:true}
 };
};
