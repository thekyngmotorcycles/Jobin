/**
 * Read-only recovery inventory. A legacy owner-suffixed key is NOT evidence
 * of ownership. No contents, identifiers of other accounts or raw keys are
 * returned. No destination writes, automatic migration, or deletion.
 */
import type {MessageScope} from "./session-continuity";
const prefixes={
 "post-drafts":"jobeen.post.drafts.v1.",
 "jshop-drafts":"jobeen.jshop.drafts.v1.",
 "jshop-favorites":"jobeen.jshop.favorites.v1.",
 "flash-draft":"jobeen.flash.draft.v1.",
 "professional-video-draft":"jobeen.reel.draft.v1."
} as const;
export type LegacyPrivateCategory=keyof typeof prefixes;
export type LegacyInventoryEntry={category:LegacyPrivateCategory;state:"absent"|"requires-review"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function createLegacyPrivateInventory(
 storage:{contains(key:string):Promise<boolean>},
 verify:(scope:MessageScope)=>Promise<unknown>
){
 return async function inspect(expected:MessageScope):Promise<LegacyInventoryEntry[]>{
  const scope={...expected};
  if(!uuid.test(scope.owner)||!scope.session.startsWith("jobeen.session.started.v3."+scope.owner+"."))
   throw Error("Cuenta inválida.");
  const result:LegacyInventoryEntry[]=[];
  try{
   await verify(scope);
   for(const category of Object.keys(prefixes) as LegacyPrivateCategory[]){
    await verify(scope);
    const exists=await storage.contains(prefixes[category]+scope.owner);
    await verify(scope);
    if(typeof exists!=="boolean")throw Error();
    result.push({category,state:exists?"requires-review":"absent"});
   }
   return result;
  }catch{throw Error("No se pudo verificar el inventario privado.");}
 };
}
