/** Presentation only. No database calls, verification logic or account state. */
export type JCardStatus = "ACTIVE" | "AVAILABLE";
export type JCardTier = "base" | "silver" | "gold";
export interface JCardSeal {
  id: string;
  label: string;
  profession: string;
  icon: "snow-outline" | "flash-outline" | "water-outline" | "hammer-outline" | "build-outline" | "color-palette-outline" | "leaf-outline" | "car-outline" | "restaurant-outline" | "camera-outline" | "mic-outline";
  verified: boolean;
}
export interface CardData {
  name: string;
  handle: string;
  role: string;
  years: number;
  status: JCardStatus;
  employer: string | null;
  rating: number | null;
  reviewCount: number;
  inAcademy: boolean;
  avatar?: string;
  profileUrl: string;
  languages: readonly { name: string; fluency: number }[];
  seals: readonly JCardSeal[];
}
export function displayedRating(rating: number | null, reviewCount: number): number | null {
  if (!reviewCount || rating === null || !Number.isFinite(rating)) return null;
  return Math.round(Math.min(5, Math.max(1, rating)) * 10) / 10;
}
export function jcardTier(rating: number | null, reviewCount: number): JCardTier {
  const rounded = displayedRating(rating, reviewCount);
  return rounded === null || rounded <= 3.5 ? "base" : rounded <= 4.5 ? "silver" : "gold";
}
/** Preserve all ten verified examples plus one pending seal, in at most two rows. */
export function sealRows(seals: readonly JCardSeal[]): JCardSeal[][] {
  const visible = [
    ...seals.filter(seal => seal.verified).slice(0, 10),
    ...seals.filter(seal => !seal.verified).slice(0, 1),
  ];
  const split = Math.ceil(visible.length / 2);
  return visible.length <= 6 ? [visible] : [visible.slice(0, split), visible.slice(split)];
}
