import {Ionicons,MaterialCommunityIcons} from "@expo/vector-icons";
import Svg,{Path,Circle,Line} from "react-native-svg";
import type {ComponentProps} from "react";
import {professionIcon} from "../lib/profession-icons";
type MIcon=ComponentProps<typeof MaterialCommunityIcons>["name"];
type IIcon=ComponentProps<typeof Ionicons>["name"];
const SPECIAL_ICONS:Record<string,MIcon>={
 disenador_de_interiores:"sofa-single-outline",
 carnicero:"food-steak",
 farmaceutico:"pill",
 psicologo:"brain",
 cuidador_de_adultos_mayores:"human-cane",
 odontologo:"tooth-outline",
 tecnico_dental:"tooth-outline",
 abogado:"gavel",
 juez:"gavel",
 chef_cocinero:"chef-hat",
 mesero:"room-service-outline",
 ayudante_de_cocina:"chef-hat",
 panadero_pastelero:"bread-slice-outline",
 repostero:"cupcake",
 arquitecto:"floor-plan",
 ingeniero_civil:"bridge",
 enfermero_a:"medical-bag",
 medico:"stethoscope",
 veterinario:"paw",
 recepcionista_de_hotel:"desk",
 plomero:"pipe-wrench",
 sastre_modista:"needle",
 tapicero:"sofa-outline",
 peluquero_canino:"dog-service",
 tecnico_de_laboratorio:"flask-outline",
 notario_escribano:"file-sign",
 repartidor_cartas_paqueteria:"package-variant-closed",
 repartidor_alimentos_insumos:"food-takeout-box-outline",
 repartidor_en_automovil:"car",
 repartidor_en_bicicleta:"bicycle",
 mensajero_en_motocicleta:"motorbike",
 juez_de_paz:"gavel"
};
/** Original HVAC glyph: thermometer plus two snowflakes, not sourced from the watermarked reference. */
function HvacThermometerGlyph({size,color}:{size:number;color:string}){
 // Readable at 19px: a large thermometer, one prominent snowflake and a smaller one.
 const snow=(cx:number,cy:number,r:number)=>Array.from({length:3},(_,i)=>{
  const a=i*Math.PI/3,dx=Math.cos(a)*r,dy=Math.sin(a)*r;
  return <Line key={i} x1={cx-dx} y1={cy-dy} x2={cx+dx} y2={cy+dy} stroke={color} strokeWidth="2.3" strokeLinecap="round"/>;
 });
 return <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessibilityLabel="Termómetro con copos de nieve">
  <Path d="M22 7a3.5 3.5 0 0 1 7 0v14.4a5.6 5.6 0 1 1-7 0V7Z" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
  <Line x1="25.5" y1="11" x2="25.5" y2="23" stroke={color} strokeWidth="2.6" strokeLinecap="round"/>
  <Circle cx="25.5" cy="26" r="2.6" fill={color}/>
  {snow(9,20,7)}
  {snow(11,7,4.5)}
  <Path d="M17.5 14l-2 2" stroke={color} strokeWidth="2.1" strokeLinecap="round"/>
 </Svg>;
}
export function ProfessionGlyph({profession,fallback,size=22,color}:{profession:string;fallback?:IIcon;size?:number;color:string}){
 const key=profession.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
 if(key==="tecnico_hvac"||key==="tecnico_hvac_aire_acondicionado"||key==="climatizacion_hvac"||key.startsWith("tecnico_hvac_"))return <HvacThermometerGlyph size={size} color={color}/>;
 const icon=SPECIAL_ICONS[key]??Object.entries(SPECIAL_ICONS).find(([k])=>key.includes(k))?.[1];
 return icon?<MaterialCommunityIcons name={icon} size={size} color={color}/>:<Ionicons name={professionIcon(profession,fallback)} size={size} color={color}/>;
}
