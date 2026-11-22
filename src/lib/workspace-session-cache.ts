import type { MessageScope } from "./session-continuity";

function workspaceOwner(value:unknown):string|null{
 if(!value||typeof value!=="object"||!("card" in value))return null;
 const card=(value as {card?:{id?:unknown}}).card;
 return typeof card?.id==="string"?card.id:null;
}
/** One memory-only snapshot, belonging to one exact authenticated session. */
export function createWorkspaceSessionCache(){
 let entry:{scope:MessageScope;value:unknown}|null=null;
 return {
  read(scope:MessageScope):unknown|null{
   if(!entry)return null;
   if(entry.scope.owner!==scope.owner||entry.scope.session!==scope.session||workspaceOwner(entry.value)!==scope.owner){
    entry=null;return null;
   }
   return entry.value;
  },
  write(scope:MessageScope,value:unknown):boolean{
   if(!scope.owner||!scope.session||workspaceOwner(value)!==scope.owner){entry=null;return false;}
   entry={scope:{...scope},value};
   return true;
  },
  clear(){entry=null;}
 };
}
