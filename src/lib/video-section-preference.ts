/** This device stores only the last visited section, never viewing history or post IDs. */
export type VideoSection="streams"|"videos";
type Scope={owner:string;session:string};
type Storage={getItem:(key:string)=>Promise<string|null>;setItem:(key:string,value:string)=>Promise<void>};
type Verify=(scope:Scope)=>Promise<void>;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function videoSectionForPath(path:string):VideoSection|null{
 if(path==="/streams"||path==="/(tabs)/streams")return "streams";
 if(path==="/videos"||path==="/(tabs)/videos")return "videos";
 return null;
}
export function videoSectionRoute(section:VideoSection):"/(tabs)/streams"|"/(tabs)/videos"{
 return section==="videos"?"/(tabs)/videos":"/(tabs)/streams";
}
export function videoSectionKey(owner:string){
 if(!uuid.test(owner))throw Error("Cuenta inválida.");
 return "jobeen.video.section.v1."+owner;
}
export function createVideoSectionPreference(storage:Storage,verify:Verify){
 return {
  async read(scope:Scope):Promise<VideoSection>{
   const key=videoSectionKey(scope.owner);
   await verify(scope);
   let raw:string|null=null;
   try{raw=await storage.getItem(key);}catch{/* A storage failure falls back only after checking the original account again. */}
   await verify(scope);
   return raw==="videos"?"videos":"streams";
  },
  async write(scope:Scope,section:VideoSection):Promise<void>{
   const key=videoSectionKey(scope.owner);
   if(section!=="videos"&&section!=="streams")throw Error("Sección inválida.");
   await verify(scope);
   await storage.setItem(key,section);
   await verify(scope);
  }
 };
}
