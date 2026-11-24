/** Panel is an administrative workspace, not a second public profile.
 * Roles are derived from the authenticated server workspace, not route params or the JCard face.
 */
export type PanelScope={owner:string;session:string};
export type PanelIdentity={card:{id:string;accountType:"personal"|"company"};organization:{profile_id:string}|null;reviewer:boolean};
export type PanelModuleId="company"|"quotes"|"clients"|"team"|"assistant"|"credentials"|"content"|"highlights"|"drafts"|"statistics"|"courses"|"instructor"|"income"|"gifts"|"agreements"|"withdrawals";
export type PanelEntry={id:PanelModuleId;title:string;icon:string;ready:boolean};
const entry=(id:PanelModuleId,title:string,icon:string,ready=false):PanelEntry=>({id,title,icon,ready});
export function panelAccess(data:PanelIdentity|null,scope:PanelScope|null){
 if(!data||!scope||!scope.owner||!scope.session||data.card.id!==scope.owner)return null;
 const company=data.card.accountType==="company"&&data.organization?.profile_id===scope.owner;
 return {owner:scope.owner,company,reviewer:data.reviewer===true,accountType:data.card.accountType};
}
export function panelSections(access:NonNullable<ReturnType<typeof panelAccess>>){
 return [
  {title:"Negocio",items:[
   ...(access.company?[entry("company","Mi empresa","business-outline",true)]:[]),
   entry("quotes","Presupuestos","document-text-outline"),entry("clients","Clientes","people-circle-outline"),
   ...(access.company?[entry("team","Equipo","people-outline",true)]:[]),
   entry("assistant","Asistente IA","sparkles-outline"),
   ...(access.reviewer?[entry("credentials","Revisar acreditaciones","shield-checkmark-outline",true)]:[])
  ]},
  {title:"Gestión de contenido",items:[
   entry("content","Administrador de contenido","grid-outline",true),
   entry("highlights","Highlights","cut-outline"),
   entry("drafts","Borradores","file-tray-outline",true),
   entry("statistics","Estadísticas","stats-chart-outline",true)
  ]},
  {title:"JAcademy",items:[entry("courses","Mis cursos","school-outline")]},
  {title:"Monetización",items:[entry("income","Ingresos","wallet-outline"),entry("gifts","Regalos","gift-outline"),entry("agreements","Acuerdos comerciales","document-outline"),entry("withdrawals","Retiros","arrow-down-outline")]}
 ];
}
export function allowedPanelModule(data:PanelIdentity|null,scope:PanelScope|null,id:unknown):PanelEntry|null{
 const access=panelAccess(data,scope);
 if(!access||typeof id!=="string")return null;
 return panelSections(access).flatMap(section=>section.items).find(item=>item.id===id)??null;
}
export const panelPreview:Partial<Record<PanelModuleId,readonly string[]>>={
 quotes:["Solicitudes","Presupuestos","Catálogo de servicios y precios","Presupuesto asistido por IA"],
 clients:["Expedientes de servicio","Solicitudes y presupuestos"],
 assistant:["Servicios y tarifas","Horarios y cobertura","Reglas de respuesta","Revisión humana"],
 highlights:["Candidatos pendientes de revisión","Highlights guardados","Publicados como Flash"],
 courses:["En curso","Completados","Certificados de cursos"],
 income:["Resumen de ingresos","Historial de movimientos"],
 gifts:["Regalos recibidos","Historial"],
 agreements:["Acuerdos de colaboración","Participación en ingresos"],
 withdrawals:["Métodos de retiro","Historial de retiros"]
};

/** Counts used for administration must be present and nonnegative; never infer zero from absence. */
export function assertPanelEngagement(ids:readonly string[],counts:readonly {post_id:string;likes:number|string;comments:number|string;shares:number|string}[]){
 const byId=new Map(counts.map(row=>[row.post_id,row]));
 const valid=(value:unknown)=>((typeof value==="number")||(typeof value==="string"&&value.trim()!==""))&&Number.isSafeInteger(Number(value))&&Number(value)>=0;
 for(const id of ids){
  const row=byId.get(id);
  if(!row||![row.likes,row.comments,row.shares].every(valid))throw Error("Estadísticas aún no disponibles para todas las publicaciones.");
 }
}

/** Filters operate on real records; unknown moderation states remain visible. */
export const PANEL_MEDIA_FILTERS=["all","progress","published","review","ended"] as const;
export type PanelMediaFilter=typeof PANEL_MEDIA_FILTERS[number];
export const PANEL_MEDIA_LABELS:Record<PanelMediaFilter,string>={all:"Todos",progress:"En proceso",published:"Publicados",review:"En revisión",ended:"Finalizados"};
export function panelMediaMatches(status:string,filter:PanelMediaFilter){
 if(filter==="all")return true;
 if(filter==="progress")return ["pending","processing","moderating"].includes(status);
 if(filter==="published")return ["published","live"].includes(status);
 if(filter==="review")return ["held","blocked","failed"].includes(status);
 return status==="ended";
}
export const PANEL_PERIODS=["all","7","30"] as const;
export type PanelPeriod=typeof PANEL_PERIODS[number];
export const PANEL_PERIOD_LABELS:Record<PanelPeriod,string>={all:"Todo",7:"7 días",30:"30 días"};
export function panelPostsInPeriod<T extends {createdAt:string}>(posts:readonly T[],period:PanelPeriod,now:number){
 if(period==="all")return [...posts];
 const cutoff=now-Number(period)*86400000;
 return posts.filter(p=>{const at=Date.parse(p.createdAt);return Number.isFinite(at)&&at>=cutoff&&at<=now;});
}
export function panelPostTotals(posts:readonly {likes:number;comments:number;shares:number}[]){
 return {posts:posts.length,likes:posts.reduce((n,p)=>n+p.likes,0),comments:posts.reduce((n,p)=>n+p.comments,0),shares:posts.reduce((n,p)=>n+p.shares,0)};
}
