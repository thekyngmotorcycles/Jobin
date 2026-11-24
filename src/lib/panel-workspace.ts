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
  {title:"Monetización",items:[entry("income","Ingresos","wallet-outline"),entry("gifts","Regalos","gift-outline"),entry("agreements","Acuerdos comerciales","handshake-outline"),entry("withdrawals","Retiros","arrow-down-outline")]}
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
 highlights:["Candidatos de Highlights","Edición y publicación como Flash","Borradores de Highlights"],
 courses:["En curso","Completados","Certificados de cursos"],
 income:["Resumen de ingresos","Historial de movimientos"],
 gifts:["Regalos recibidos","Historial"],
 agreements:["Acuerdos de colaboración","Participación en ingresos"],
 withdrawals:["Métodos de retiro","Historial de retiros"]
};
