import type {ComponentProps} from "react";
import type {Ionicons} from "@expo/vector-icons";
export type CategoryIcon=ComponentProps<typeof Ionicons>["name"];
const CATEGORIES:Record<string,{icon:CategoryIcon;tint:string}>={
 construction:{icon:"hammer-outline",tint:"#6e8190"},maintenance:{icon:"construct-outline",tint:"#71888c"},climate:{icon:"snow-outline",tint:"#568caa"},transport:{icon:"bus-outline",tint:"#6d779a"},automotive:{icon:"car-sport-outline",tint:"#72809b"},technology:{icon:"hardware-chip-outline",tint:"#657ab0"},business:{icon:"briefcase-outline",tint:"#807d9c"},commerce:{icon:"storefront-outline",tint:"#9b806a"},legal:{icon:"scale-outline",tint:"#81818f"},health:{icon:"medkit-outline",tint:"#6a9898"},animals:{icon:"paw-outline",tint:"#819c81"},hospitality:{icon:"restaurant-outline",tint:"#a0876d"},hotels:{icon:"bed-outline",tint:"#879ca7"},beauty:{icon:"sparkles-outline",tint:"#a085a3"},sports:{icon:"fitness-outline",tint:"#819d8a"},education:{icon:"school-outline",tint:"#7c91b1"},arts:{icon:"musical-notes-outline",tint:"#9b82a7"},design:{icon:"color-palette-outline",tint:"#9d8497"},engineering:{icon:"business-outline",tint:"#738d9e"},fashion:{icon:"shirt-outline",tint:"#a28b95"},security:{icon:"shield-checkmark-outline",tint:"#758a97"},industry:{icon:"settings-outline",tint:"#7c8791"},agriculture:{icon:"leaf-outline",tint:"#779b79"},logistics:{icon:"cube-outline",tint:"#898c9c"}
};
export function businessCategoryArt(category:string){
 const key=category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const aliases:Record<string,string>={climatizacion:"climate",refrigeracion:"climate",hvac:"climate",construccion:"construction",tecnologia:"technology",ventas:"commerce",comercio:"commerce",gastronomia:"hospitality",salud:"health",educacion:"education",belleza:"beauty",automotriz:"automotive"};
 const code=CATEGORIES[key]?key:Object.keys(aliases).find(term=>key.includes(term));
 return CATEGORIES[code?(aliases[code]??code):""]??{icon:"business-outline" as CategoryIcon,tint:"#858b92"};
}
