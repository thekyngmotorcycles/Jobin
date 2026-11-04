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
 const stroke=Math.max(1.3,1.65);
 return <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessibilityLabel="Termómetro con copos de nieve">
  <Path d="M23 6a3 3 0 0 1 6 0v16.4a5 5 0 1 1-6 0V6Z" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"/>
  <Line x1="26" y1="11" x2="26" y2="23" stroke={color} strokeWidth={stroke} strokeLinecap="round"/>
  <Circle cx="26" cy="26" r="2.2" fill={color}/>
  <Path d="M7.5 4v11M2 9.5h11M3.6 5.6l7.8 7.8M11.4 5.6l-7.8 7.8M7.5 4l-2-1.5M7.5 4l2-1.5M7.5 15l-2 1.5M7.5 15l2 1.5" stroke={color} strokeWidth="1.35" strokeLinecap="round"/>
  <Path d="M11 17v11M5.5 22.5h11M7.1 18.6l7.8 7.8M14.9 18.6l-7.8 7.8M11 17l-2-1.5M11 17l2-1.5M11 28l-2 1.5M11 28l2 1.5" stroke={color} strokeWidth="1.35" strokeLinecap="round"/>
 </Svg>;
}
export function ProfessionGlyph({profession,fallback,size=22,color}:{profession:string;fallback?:IIcon;size?:number;color:string}){
 const key=profession.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
 if(key==="tecnico_hvac"||key==="tecnico_hvac_aire_acondicionado"||key==="climatizacion_hvac"||key.startsWith("tecnico_hvac_"))return <HvacThermometerGlyph size={size} color={color}/>;
 const icon=SPECIAL_ICONS[key]??Object.entries(SPECIAL_ICONS).find(([k])=>key.includes(k))?.[1];
 return icon?<MaterialCommunityIcons name={icon} size={size} color={color}/>:<Ionicons name={professionIcon(profession,fallback)} size={size} color={color}/>;
}
