import type {ComponentProps} from "react";
import type {Ionicons} from "@expo/vector-icons";
export type CategoryGlyphName=ComponentProps<typeof Ionicons>["name"];
/** One stable sector-level symbol per live professional catalog category. */
export const CATEGORY_GLYPHS:Record<string,CategoryGlyphName>={
 agriculture:"leaf-outline",animals:"paw-outline",arts:"color-palette-outline",automotive:"car-sport-outline",
 aviation:"airplane-outline",beauty:"sparkles-outline",business:"briefcase-outline",climate:"snow-outline",
 commerce:"storefront-outline",construction:"hammer-outline",design:"brush-outline",education:"school-outline",
 engineering:"construct-outline",fashion:"shirt-outline",health:"medkit-outline",heavy_equipment:"build-outline",
 hospitality:"restaurant-outline",hotels:"bed-outline",industry:"settings-outline",legal:"scale-outline",
 logistics:"cube-outline",maintenance:"build-outline",maritime:"boat-outline",motorcycles:"bicycle-outline",
 railway:"train-outline",refrigeration:"snow-outline",security:"shield-checkmark-outline",
 sports:"fitness-outline",technology:"hardware-chip-outline",transport:"bus-outline"
};
export function categoryGlyph(code:string):CategoryGlyphName{return CATEGORY_GLYPHS[code]??"grid-outline";}
