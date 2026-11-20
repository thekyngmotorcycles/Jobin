/** Scheme already registered in the Jobeen Android app. */
export type SharedJCardSide="personal"|"business";
export type SharedJCard={userId:string;side:SharedJCardSide;name:string;url:string;message:string};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LINK=/jobin:\/\/jcard\?user=([0-9a-f-]{36})&card=(personal|business)/i;
export function buildSharedJCard(targetId:string,side:SharedJCardSide,name:string):SharedJCard{
 if(!UUID.test(targetId)||!["personal","business"].includes(side))throw Error("La JCard no está disponible para compartir.");
 const label=(name.trim()||"Jobeen").replace(/[\r\n]+/g," ").slice(0,120);
 const url="jobin://jcard?user="+targetId+"&card="+side;
 const message="JCard "+(side==="business"?"de negocio":"personal")+" de "+label+": "+url;
 return {userId:targetId,side,name:label,url,message};
}
export function sharedJCardFromMessage(body:string):{userId:string;side:SharedJCardSide}|null{
 const found=body.match(LINK);
 if(!found||!UUID.test(found[1]))return null;
 return {userId:found[1],side:found[2].toLowerCase() as SharedJCardSide};
}
