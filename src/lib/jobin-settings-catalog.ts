import type {Ionicons} from "@expo/vector-icons";
export type JobinSettingsEntry={id:string;title:string;description:string;route?:string;icon?:keyof typeof Ionicons.glyphMap};
export type JobinSettingsGroup={title:string;description:string;items:JobinSettingsEntry[]};
export const LEGACY_SETTINGS_GROUPS:JobinSettingsGroup[]=[
 {title:"Tu cuenta",description:"Gestiona tu identidad y seguridad en Jobin.",items:[
  {id:"cuenta",title:"Cuenta y seguridad",description:"Datos personales, acceso y protección de tu cuenta.",route:"/settings/cuenta"},
  {id:"suscripciones",title:"Suscripciones",description:"Planes y beneficios de Jobin."}]},
 {title:"Privacidad y seguridad",description:"Decide qué compartes y protege tu cuenta.",items:[
  {id:"visibilidad",title:"Privacidad de la JCard",description:"Correo, teléfono e información visible.",route:"/professional"},
  {id:"zona-profesional",title:"Mi zona profesional en el mapa",description:"Elige si muestras tu empresa o zona de servicio.",route:"/map-presence"},
  {id:"bloqueos",title:"Cuentas bloqueadas",description:"Gestiona las cuentas que has bloqueado."},
  {id:"sesiones",title:"Dispositivos y sesiones",description:"Revisa desde dónde accedes a Jobin."},
  {id:"verificacion",title:"Verificación de cuenta",description:"Estado de tus verificaciones."}]},
 {title:"Tu experiencia",description:"Personaliza cómo utilizas Jobin.",items:[
  {id:"contenido",title:"Preferencias de contenido",description:"Ajusta lo que aparece en Home."},
  {id:"notificaciones",title:"Notificaciones",description:"Configura los avisos que recibes.",route:"/notifications"},
  {id:"accesibilidad",title:"Accesibilidad",description:"Opciones de lectura y visualización."},
  {id:"idioma",title:"Idioma",description:"Idioma de la aplicación.",route:"/menu/idioma"},
  {id:"apariencia",title:"Apariencia",description:"Elige Royal Hive claro, oscuro o la configuración del sistema.",route:"/menu/modo-oscuro"},
  {id:"multimedia",title:"Fotos y videos",description:"Reproducción y uso de datos."},
  {id:"tiempo",title:"Tiempo en Jobin",description:"Herramientas de bienestar digital.",route:"/menu/administracion-tiempo"}]},
 {title:"Actividad y pagos",description:"Tus movimientos y transacciones.",items:[
  {id:"actividad",title:"Registro de actividad",description:"Tus acciones dentro de Jobin."},
  {id:"pagos",title:"Pedidos y pagos",description:"Compras y métodos de pago.",route:"/menu/pedidos-pagos"},
  {id:"permisos",title:"Permisos del dispositivo",description:"Acceso a cámara, fotos y notificaciones."}]},
 {title:"Información y políticas",description:"Reglas y recursos de la comunidad.",items:[
  {id:"terminos",title:"Condiciones del servicio",description:"Consulta los términos de Jobin.",route:"/terms"},
  {id:"privacidad-politica",title:"Política de privacidad",description:"Cómo se protege tu información."},
  {id:"normas",title:"Normas comunitarias",description:"Convivencia y seguridad en Jobin.",route:"/safety"},
  {id:"ayuda",title:"Ayuda y soporte",description:"Resuelve dudas y consulta recursos."}]},
];

// Only functional destinations belong in the visible settings menu. Keep legacy
// metadata for old deep links, not as placeholders in the live navigation.
export const JOBIN_SETTINGS_GROUPS:JobinSettingsGroup[]=[
 {title:"Cuenta y privacidad",description:"",items:[
  {id:"cuenta",title:"Cuenta y seguridad",description:"Datos personales contraseña identidad verificación dispositivos sesiones recuperación acceso eliminar cuenta",route:"/settings/cuenta",icon:"person-outline"},
  {id:"privacidad",title:"Privacidad",description:"Visibilidad correo teléfono JCard mensajes permisos",route:"/menu/centro-privacidad",icon:"lock-closed-outline"},
 ]},
 {title:"Preferencias",description:"",items:[
  {id:"apariencia",title:"Apariencia",description:"Royal Hive claro oscuro sistema tema",route:"/menu/modo-oscuro",icon:"color-palette-outline"},
  {id:"notificaciones",title:"Notificaciones",description:"Centro de actividad avisos solicitudes",route:"/notifications",icon:"notifications-outline"},
 ]},
 {title:"Información y soporte",description:"",items:[
  {id:"normas-politicas",title:"Normas y políticas",description:"Términos seguridad apelaciones normas comunitarias",route:"/menu/normas-politicas",icon:"shield-checkmark-outline"},
 ]},
];
// Approved locations for unavailable capabilities; not rendered as dead links.
export const SETTINGS_RESERVED_IDS=["bloqueos","idioma","contenido","multimedia","accesibilidad","ayuda","permisos","sesiones","verificacion","suscripciones","tiempo","pagos","actividad"] as const;
export const SETTINGS_LOGOUT_ROUTE="/settings/cuenta?confirmExit=1";
export function matchesLogout(query:string){return "cerrar sesión salir desconectar logout".includes(query.trim().toLowerCase());}
