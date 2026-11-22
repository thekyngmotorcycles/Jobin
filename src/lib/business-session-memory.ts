import type {MessageScope} from "./session-continuity";

/** A one-entry, process-only snapshot. Never migrate legacy disk contents. */
export function createBusinessSessionMemory<T>(){
 let entry:{scope:MessageScope;value:T}|null=null;
 return {
  read(scope:MessageScope):T|null{
   if(!entry)return null;
   if(entry.scope.owner!==scope.owner||entry.scope.session!==scope.session){entry=null;return null;}
   return entry.value;
  },
  write(scope:MessageScope,value:T){
   if(!scope.owner||!scope.session){entry=null;return;}
   entry={scope:{...scope},value};
  },
  clear(){entry=null;}
 };
}
