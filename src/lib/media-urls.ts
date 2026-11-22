/** Supabase public Storage image transformations are optional (plan dependent).
 * Only transform known public object URLs; callers must fall back on error.
 */
export function thumbnailUrl(uri:string,width=320):string{
 if(!/^https:\/\//i.test(uri))return uri;
 try{
  const url=new URL(uri);
  if(url.username||url.password||url.search||url.hash||!url.pathname.includes("/storage/v1/object/public/"))return uri;
  if(!Number.isFinite(width)||width<32||width>2048)return uri;
  url.pathname=url.pathname.replace("/storage/v1/object/public/","/storage/v1/render/image/public/");
  url.searchParams.set("width",String(Math.round(width)));
  url.searchParams.set("quality","70");
  url.searchParams.set("resize","cover");
  return url.toString();
 }catch{return uri;}
}

/** Prefer a fresh request for user content, especially signed/private URLs.
 * RN cache policy and headers are hints, NOT encrypted disk storage or a
 * guarantee that platform/native/proxy caches are purged. No URL mutation.
 */
export function userImageSource(uri:string|undefined){
 if(!uri)return {uri};
 if(/^https?:\/\//i.test(uri))return {uri,cache:"reload" as const,headers:{"Cache-Control":"no-cache, no-store"}};
 return {uri};
}
