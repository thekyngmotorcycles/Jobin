import {BUSINESS_ART_COLORS} from "../theme/business-art";
import type {ComponentProps} from "react";
import type {Ionicons} from "@expo/vector-icons";
export type CategoryIcon=ComponentProps<typeof Ionicons>["name"];
const CATEGORIES:Record<string,{icon:CategoryIcon;tint:string}>={
 construction:{icon:"hammer-outline",tint:BUSINESS_ART_COLORS[0]},maintenance:{icon:"construct-outline",tint:BUSINESS_ART_COLORS[1]},climate:{icon:"snow-outline",tint:BUSINESS_ART_COLORS[2]},transport:{icon:"bus-outline",tint:BUSINESS_ART_COLORS[3]},automotive:{icon:"car-sport-outline",tint:BUSINESS_ART_COLORS[4]},technology:{icon:"hardware-chip-outline",tint:BUSINESS_ART_COLORS[5]},business:{icon:"briefcase-outline",tint:BUSINESS_ART_COLORS[6]},commerce:{icon:"storefront-outline",tint:BUSINESS_ART_COLORS[7]},legal:{icon:"scale-outline",tint:BUSINESS_ART_COLORS[8]},health:{icon:"medkit-outline",tint:BUSINESS_ART_COLORS[9]},animals:{icon:"paw-outline",tint:BUSINESS_ART_COLORS[10]},hospitality:{icon:"restaurant-outline",tint:BUSINESS_ART_COLORS[11]},hotels:{icon:"bed-outline",tint:BUSINESS_ART_COLORS[12]},beauty:{icon:"sparkles-outline",tint:BUSINESS_ART_COLORS[13]},sports:{icon:"fitness-outline",tint:BUSINESS_ART_COLORS[14]},education:{icon:"school-outline",tint:BUSINESS_ART_COLORS[15]},arts:{icon:"musical-notes-outline",tint:BUSINESS_ART_COLORS[16]},design:{icon:"color-palette-outline",tint:BUSINESS_ART_COLORS[17]},engineering:{icon:"business-outline",tint:BUSINESS_ART_COLORS[18]},fashion:{icon:"shirt-outline",tint:BUSINESS_ART_COLORS[19]},security:{icon:"shield-checkmark-outline",tint:BUSINESS_ART_COLORS[20]},industry:{icon:"settings-outline",tint:BUSINESS_ART_COLORS[21]},agriculture:{icon:"leaf-outline",tint:BUSINESS_ART_COLORS[22]},logistics:{icon:"cube-outline",tint:BUSINESS_ART_COLORS[23]}
};
export function businessCategoryArt(category:string){
 const key=category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const aliases:Record<string,string>={climatizacion:"climate",refrigeracion:"climate",hvac:"climate",construccion:"construction",tecnologia:"technology",ventas:"commerce",comercio:"commerce",gastronomia:"hospitality",salud:"health",educacion:"education",belleza:"beauty",automotriz:"automotive"};
 const code=CATEGORIES[key]?key:Object.keys(aliases).find(term=>key.includes(term));
 return CATEGORIES[code?(aliases[code]??code):""]??{icon:"business-outline" as CategoryIcon,tint:BUSINESS_ART_COLORS[24]};
}
