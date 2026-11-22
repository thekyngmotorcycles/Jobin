import {assertAccountOwner} from "./account-scope";
import {supabase} from "./supabase";
import {sessionMarkerKey} from "./session-lifetime";
import {createBusinessSessionMemory} from "./business-session-memory";
import type {MessageScope} from "./message-session";
import type {JShopPlace} from "./jshop-location-core";
import {isJShopRadius} from "./jshop-geo";

// Buyer coordinates and history remain in memory for the current authenticated
// session. Legacy plaintext keys are not read, migrated, overwritten or deleted.
const memory=createBusinessSessionMemory<{selected:JShopPlace|null;recent:JShopPlace[]}>();
let observed:string|null=null;
supabase?.auth.onAuthStateChange((event,session)=>{
 let next:string|null=null;
 try{if(session)next=sessionMarkerKey(session.user.id,session.access_token);}catch{}
 if(next!==observed||event==="SIGNED_OUT")memory.clear();
 observed=next;
});
function validPlace(input:unknown):input is JShopPlace{
 if(!input||typeof input!=="object")return false;
 const p=input as Partial<JShopPlace>;
 return typeof p.label==="string"&&typeof p.city==="string"&&p.city.length<=90&&
 typeof p.lat==="number"&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&
 typeof p.lon==="number"&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180&&
 typeof p.zoom==="number"&&p.zoom>=1&&p.zoom<=18&&
 (p.radiusMiles===undefined||isJShopRadius(p.radiusMiles));
}

async function confirm(owner:string,scope:MessageScope){
 if(!scope||scope.owner!==owner)throw Error("La cuenta cambió.");
 await assertAccountOwner(owner,scope.session);
}
export async function readJShopLocation(owner:string,scope:MessageScope):Promise<JShopPlace|null>{
 await confirm(owner,scope);
 const selected=memory.read(scope)?.selected;
 return selected?{...selected}:null;
}
export async function readRecentJShopLocations(owner:string,scope:MessageScope):Promise<JShopPlace[]>{
 await confirm(owner,scope);
 return (memory.read(scope)?.recent??[]).map(p=>({...p}));
}
export async function saveJShopLocation(owner:string,place:JShopPlace|null,scope:MessageScope):Promise<void>{
 await confirm(owner,scope);
 const prior=memory.read(scope)?.recent??[];
 if(!place){memory.write(scope,{selected:null,recent:prior});return;}
 if(!validPlace(place))throw Error("La ubicación seleccionada no es válida.");
 const selected={...place,radiusMiles:place.radiusMiles??10};
 const recent=[selected,...prior.filter(x=>x.city.toLocaleLowerCase()!==place.city.toLocaleLowerCase())].slice(0,6);
 memory.write(scope,{selected,recent});
}
