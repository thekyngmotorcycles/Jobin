/** Client-side readiness only. The server remains the publication authority. */
type Scope={owner:string;session:string};
type Health={providersReady:boolean;mediaBlocked:boolean;accountBlocked:boolean;permanent:boolean};
type Options={professions:{code:string}[];employers:{id:string;approved:boolean;representative:boolean}[]};
export type LiveVisibility="public"|"private";
export function liveVisibility(activity:string,choice:LiveVisibility):LiveVisibility{
 return activity==="interview"?"private":choice;
}
export function livePreflight(input:{
 safety:Health|null;options:Options|null;safetyScope:Scope|null;optionsScope:Scope|null;
 loading:boolean;error:boolean;title:string;profession:string;activity:string;
 employer?:string;consent:boolean;
}):{ready:boolean;reason:string}{
 const {safety,options,safetyScope,optionsScope}=input;
 const stop=(reason:string)=>({ready:false,reason});
 if(input.loading)return stop("Comprobando disponibilidad…");
 if(input.error||!safety||!options||!safetyScope||!optionsScope||
    safetyScope.owner!==optionsScope.owner||safetyScope.session!==optionsScope.session)
  return stop("No se pudo verificar tu cuenta y los requisitos de transmisión.");
 if(safety.permanent||safety.accountBlocked||safety.mediaBlocked)return stop("Tu cuenta tiene una restricción de publicación.");
 if(!safety.providersReady)return stop("El servicio de video y moderación aún no está disponible.");
 const title=input.title.trim();
 if(!title||title.length>160)return stop("Escribe un título de 1 a 160 caracteres.");
 if(!options.professions.some(p=>p.code===input.profession))return stop("Selecciona una profesión de tu JCard.");
 if(!["work","artist_performance","academy","film_set","consultation","office_calls","security_outside","interview"].includes(input.activity))return stop("Selecciona una actividad válida.");
 if(input.employer&&!options.employers.some(e=>e.id===input.employer&&e.approved&&e.representative))
  return stop("La empresa seleccionada no ha autorizado tu representación.");
 if(!input.consent)return stop("Acepta las reglas de contenido profesional.");
 return {ready:true,reason:""};
}

/** A shortcut label is not a capability grant; the studio route revalidates access. */
export function hasActiveOwnLive(input:{
 ownerId:string|undefined;workspaceScope:Scope|null;mediaScope:Scope|null;error:boolean;
 media:readonly {creator_id:string;kind:string;status:string;studioReady?:boolean}[]|null;
}):boolean{
 const {ownerId,workspaceScope,mediaScope,media}=input;
 return !!ownerId&&!input.error&&!!workspaceScope&&!!mediaScope&&
  workspaceScope.owner===ownerId&&mediaScope.owner===ownerId&&workspaceScope.session===mediaScope.session&&
  !!media?.some(item=>item.creator_id===ownerId&&item.kind==="live"&&item.status==="live"&&item.studioReady===true);
}
