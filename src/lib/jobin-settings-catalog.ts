export type JobinSettingsEntry={id:string;title:string;description:string;route?:string};
export type JobinSettingsGroup={title:string;description:string;items:JobinSettingsEntry[]};
export const JOBIN_SETTINGS_GROUPS:JobinSettingsGroup[]=[
 {title:"Tu cuenta",description:"Gestiona tu identidad y seguridad en Jobin.",items:[
  {id:"cuenta",title:"Cuenta y seguridad",description:"Datos personales, acceso y protección de tu cuenta.",route:"/settings/cuenta"},
  {id:"suscripciones",title:"Suscripciones",description:"Planes y beneficios de Jobin."}]},
 {title:"Privacidad y seguridad",description:"Decide qué compartes y protege tu cuenta.",items:[
  {id:"visibilidad",title:"Privacidad de la JCard",description:"Correo, teléfono e información visible.",route:"/professional"},
  {id:"bloqueos",title:"Cuentas bloqueadas",description:"Gestiona las cuentas que has bloqueado."},
  {id:"sesiones",title:"Dispositivos y sesiones",description:"Revisa desde dónde accedes a Jobin."},
  {id:"verificacion",title:"Verificación de cuenta",description:"Estado de tus verificaciones."}]},
 {title:"Tu experiencia",description:"Personaliza cómo utilizas Jobin.",items:[
  {id:"contenido",title:"Preferencias de contenido",description:"Ajusta lo que aparece en Home."},
  {id:"notificaciones",title:"Notificaciones",description:"Configura los avisos que recibes.",route:"/notifications"},
  {id:"accesibilidad",title:"Accesibilidad",description:"Opciones de lectura y visualización."},
  {id:"idioma",title:"Idioma",description:"Idioma de la aplicación.",route:"/menu/idioma"},
  {id:"apariencia",title:"Apariencia",description:"Elige entre los cinco temas de Jobin.",route:"/menu/modo-oscuro"},
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
