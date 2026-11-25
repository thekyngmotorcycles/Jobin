// No external dependencies or reusable signed URLs. Inject fetch for deterministic tests.
type Settings={url:string;publishable:string;service:string};
const MAX_BYTES=2*1024*1024;
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const baseHeaders={
 "Cache-Control":"private, no-store, max-age=0, must-revalidate",
 "CDN-Cache-Control":"no-store",
 "Cloudflare-CDN-Cache-Control":"no-store",
 "Pragma":"no-cache",
 "Expires":"0",
 "Vary":"Authorization, apikey, Origin",
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info, cache-control",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "X-Content-Type-Options":"nosniff",
};
function reply(status:number,data:unknown){
 return new Response(JSON.stringify(data),{status,headers:{...baseHeaders,"Content-Type":"application/json"}});
}
async function bounded(response:Request|Response,limit:number){
 const reader=response.body?.getReader();
 if(!reader)throw Error("body");
 const parts:Uint8Array[]=[];let size=0;
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;if(size>limit)throw Error("limit");parts.push(value);}
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 const data=new Uint8Array(size);let offset=0;
 for(const part of parts){data.set(part,offset);offset+=part.length;}
 return data;
}
async function json(response:Request|Response,limit=32768){
 return JSON.parse(new TextDecoder().decode(await bounded(response,limit))) as unknown;
}
function imageType(data:Uint8Array){
 if(data.length>=3&&data[0]===255&&data[1]===216&&data[2]===255)return "image/jpeg";
 if(data.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>data[i]===b))return "image/png";
 if(data.length>=12&&[82,73,70,70].every((b,i)=>data[i]===b)&&[87,69,66,80].every((b,i)=>data[i+8]===b))return "image/webp";
 return null;
}
function base64(data:Uint8Array){
 let raw="";for(let i=0;i<data.length;i+=8192)raw+=String.fromCharCode(...data.subarray(i,i+8192));
 return btoa(raw);
}
export function createCoverReader(settings:Settings,send:typeof fetch=fetch){
 const origin=new URL(settings.url);
 if(origin.protocol!=="https:"||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=="/"||!settings.publishable||!settings.service)throw Error("configuration");
 async function call(path:string,key:string,authorization:string,body?:unknown){
  const url=new URL(path,origin);
  if(url.origin!==origin.origin)throw Error("origin");
  return send(url,{method:body===undefined?"GET":"POST",headers:{apikey:key,Authorization:authorization,"Cache-Control":"no-store",...(body===undefined?{}:{"Content-Type":"application/json"})},
   body:body===undefined?undefined:JSON.stringify(body),redirect:"error",cache:"no-store",credentials:"omit",signal:AbortSignal.timeout(15000)});
 }
 async function selection(target:string,bearer:string){
  const r=await call("/rest/v1/rpc/jobeen_current_jcard_cover",settings.publishable,bearer,{target});
  if(!r.ok)throw Error("selection");
  const path=await json(r,1024);
  if(path===null)return null;
  if(typeof path!=="string"||!path.startsWith(target+"/")||!/^cover-[0-9]{10,16}-[a-z0-9]{6,24}[.](jpg|png|webp)$/.test(path.slice(target.length+1)))throw Error("path");
  return path;
 }
 return async (req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:baseHeaders});
  if(req.method!=="POST")return reply(405,{error:"method"});
  const bearer=req.headers.get("Authorization")??"";
  if(!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(bearer))return reply(401,{error:"unauthorized"});
  try{
   const body=await json(req,512);
   if(typeof body!=="object"||body===null||Array.isArray(body)||Object.keys(body).length!==1||!("target" in body)||typeof body.target!=="string"||!uuid.test(body.target))return reply(400,{error:"invalid_request"});
   const target=body.target;
   const auth=await call("/auth/v1/user",settings.publishable,bearer);
   if(auth.status===401||auth.status===403)return reply(401,{error:"unauthorized"});
   if(!auth.ok)throw Error("auth");
   const user=await json(auth);
   if(typeof user!=="object"||user===null||!("id" in user)||typeof user.id!=="string"||!uuid.test(user.id))return reply(401,{error:"unauthorized"});
   const path=await selection(target,bearer);
   if(!path)return user.id===target?reply(200,{path:null,url:null}):reply(404,{error:"not_found"});
   // Only a path resolved under caller RLS may be downloaded using server-only credentials.
   const object="/storage/v1/object/authenticated/jobeen-jcard-covers/"+path.split("/").map(encodeURIComponent).join("/")+"?cacheNonce="+crypto.randomUUID();
   const image=await call(object,settings.service,"Bearer "+settings.service);
   if(!image.ok)return reply(404,{error:"not_found"});
   const bytes=await bounded(image,MAX_BYTES),type=imageType(bytes);
   if(!type)throw Error("image");
   // Re-check after fetching bytes so a concurrent block, replacement or removal denies release.
   if(await selection(target,bearer)!==path)return reply(404,{error:"not_found"});
   return reply(200,{path,url:"data:"+type+";base64,"+base64(bytes)});
  }catch{return reply(503,{error:"unavailable"});}
 };
}
