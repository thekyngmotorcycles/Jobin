import type { CardData, JCardStatus, JCardSeal } from "../lib/jcard";

export const JCARD_RATING_EXAMPLES = ["Sin reseñas", "1.0–3.5 ★", "3.6–4.5 ★", "4.6–5.0 ★"] as const;
export type RatingExample = typeof JCARD_RATING_EXAMPLES[number];
export const JCARD_THEME_EXAMPLES = ["Actual", "Claro", "Oscuro"] as const;
export type ThemeExample = typeof JCARD_THEME_EXAMPLES[number];
export const JCARD_STATUS_EXAMPLES = ["ACTIVE", "AVAILABLE"] as const;
export const JCARD_ACADEMY_EXAMPLES = ["Profesional", "In academy"] as const;

const seals: readonly JCardSeal[] = [
  { id:"hvac", label:"HVAC", profession:"Climatización", icon:"snow-outline", verified:true },
  { id:"elec", label:"Elec.", profession:"Electricidad", icon:"flash-outline", verified:true },
  { id:"water", label:"Plumb.", profession:"Plomería", icon:"water-outline", verified:true },
  { id:"wood", label:"Wood", profession:"Carpintería", icon:"hammer-outline", verified:true },
  { id:"repair", label:"Repair", profession:"Reparaciones", icon:"build-outline", verified:true },
  { id:"paint", label:"Paint", profession:"Pintura", icon:"color-palette-outline", verified:true },
  { id:"garden", label:"Garden", profession:"Jardinería", icon:"leaf-outline", verified:true },
  { id:"auto", label:"Auto", profession:"Mecánica", icon:"car-outline", verified:true },
  { id:"chef", label:"Chef", profession:"Cocina", icon:"restaurant-outline", verified:true },
  { id:"photo", label:"Photo", profession:"Fotografía", icon:"camera-outline", verified:true },
  { id:"actor", label:"Actor", profession:"Actuación", icon:"mic-outline", verified:false },
];
const ratings: Record<RatingExample, number | null> = {
  "Sin reseñas": null, "1.0–3.5 ★": 3.5, "3.6–4.5 ★": 4.5, "4.6–5.0 ★": 4.8,
};
/** Deliberately independent from DEMO_PROFILE, auth and Supabase. All claims are fictional. */
export function mockJCard(
  rating: RatingExample = "3.6–4.5 ★",
  status: JCardStatus = "ACTIVE",
  inAcademy = false,
): CardData {
  return {
    name:"Luis J Salas", handle:"Luis_J_Salas",
    role:inAcademy ? "Actor" : "HVAC technician", years:6, status,
    employer:status === "ACTIVE" ? "Refri_Air" : null,
    rating:ratings[rating], reviewCount:rating === "Sin reseñas" ? 0 : 24,
    inAcademy, avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", profileUrl:"https://example.com/jobin-demo/Luis_J_Salas",
    languages:[{name:"Español",fluency:100},{name:"English",fluency:70}],
    seals,
  };
}
