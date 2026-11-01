import {Ionicons,MaterialCommunityIcons} from "@expo/vector-icons";
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
 juez_de_paz:"gavel"
};
export function ProfessionGlyph({profession,fallback,size=22,color}:{profession:string;fallback?:IIcon;size?:number;color:string}){
 const key=profession.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
 const icon=SPECIAL_ICONS[key]??Object.entries(SPECIAL_ICONS).find(([k])=>key.includes(k))?.[1];
 return icon?<MaterialCommunityIcons name={icon} size={size} color={color}/>:<Ionicons name={professionIcon(profession,fallback)} size={size} color={color}/>;
}
