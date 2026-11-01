import Svg,{Circle,Path,Rect,Line,Polyline} from "react-native-svg";
export type JobinMenuIconName="configuracion"|"centro-privacidad"|"administracion-tiempo"|"solicitudes-dispositivos"|"actividad-publicitaria"|"pedidos-pagos"|"historial-enlaces"|"modo-oscuro"|"idioma"|"icono-app"|"uso-datos";
export function JobinMenuIcon({name,size=30,color}:{name:JobinMenuIconName;size?:number;color?:string}){
 const stroke={stroke:color,strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,fill:"none"};
 const drawings={
 configuracion:<><Path {...stroke} d="M5 8h14M5 16h14"/><Circle {...stroke} cx="10" cy="8" r="3" fill="none"/><Circle {...stroke} cx="16" cy="16" r="3" fill="white"/></>,
 "centro-privacidad":<><Path {...stroke} d="M12 2 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6z"/><Path {...stroke} d="m9 12 2 2 4-4"/></>,
 "administracion-tiempo":<><Circle {...stroke} cx="12" cy="12" r="9"/><Path {...stroke} d="M12 6v7l5 3M8 3l-2-2M16 3l2-2"/></>,
 "solicitudes-dispositivos":<><Rect {...stroke} x="5" y="2" width="14" height="20" rx="3"/><Path {...stroke} d="m9 12 2 2 4-4M10 19h4"/></>,
 "actividad-publicitaria":<><Path {...stroke} d="M3 10v4h4l9 5V5L7 10zM7 14l2 7h3l-2-6M19 8q4 4 0 8"/></>,
 "pedidos-pagos":<><Path {...stroke} d="M3 7h18l-2 13H5L3 7zM8 7V5a4 4 0 0 1 8 0v2M9 12h6M9 16h4"/></>,
 "historial-enlaces":<><Path {...stroke} d="M8 7H6a4 4 0 0 0 0 8h5M16 17h2a4 4 0 0 0 0-8h-5M8 12h8"/><Circle cx="19" cy="5" r="2" fill={color}/></>,
 "modo-oscuro":<><Path {...stroke} d="M18 3a9 9 0 1 0 3 15A8 8 0 0 1 18 3z"/><Path {...stroke} d="M17 8h3M18.5 6.5v3"/></>,
 idioma:<><Circle {...stroke} cx="12" cy="12" r="9"/><Path {...stroke} d="M3 12h18M12 3c-6 5-6 13 0 18M12 3c6 5 6 13 0 18M5 7h14M5 17h14"/></>,
 "icono-app":<><Rect {...stroke} x="3" y="3" width="18" height="18" rx="5"/><Path {...stroke} d="M8 16V8h5a3 3 0 0 1 0 6H8M14 14l3 3"/></>,
 "uso-datos":<><Rect {...stroke} x="6" y="2" width="12" height="20" rx="3"/><Path {...stroke} d="M10 17h4M9 13V9M12 13V6M15 13v-3"/></>,
 };
 return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>{drawings[name]}</Svg>;
}
