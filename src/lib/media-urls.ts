/** Supabase public Storage image transformations are optional (plan dependent).
 * Only transform known public object URLs; callers must fall back on error.
 */
export function thumbnailUrl(uri:string,width=320):string{
 if(!/^https:\/\//i.test(uri))return uri;
 try{
  const url=new URL(uri);
  if(!url.pathname.includes("/storage/v1/object/public/"))return uri;
  if(!Number.isFinite(width)||width<32||width>2048)return uri;
  url.pathname=url.pathname.replace("/storage/v1/object/public/","/storage/v1/render/image/public/");
  url.searchParams.set("width",String(Math.round(width)));
  url.searchParams.set("quality","70");
  url.searchParams.set("resize","cover");
  return url.toString();
 }catch{return uri;}
}
