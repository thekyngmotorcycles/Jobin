/** Presentation only. No database calls, verification logic or account state. */
export type JCardStatus = "ACTIVE" | "AVAILABLE";
export type JCardTier = "base" | "silver" | "gold";
export interface JCardSeal {
  id: string;
  label: string;
  profession: string;
  icon: "thermometer-outline" | "snow-outline" | "flash-outline" | "water-outline" | "hammer-outline" | "build-outline" | "color-palette-outline" | "leaf-outline" | "car-outline" | "restaurant-outline" | "camera-outline" | "mic-outline" | "laptop-outline" | "briefcase-outline" | "medkit-outline" | "cut-outline" | "school-outline" | "shield-checkmark-outline" | "cog-outline";
  verified: boolean;
  specialties?: readonly string[];
  months?: number;
}
export interface CardData {
  /** Server-approved identity verification only; defaults to false when absent. */
  identityVerified?: boolean;
  name: string;
  handle: string;
  /** Real follower count when supplied by the social backend; never fabricate a value. */
  followers?: number;
  role: string;
  primarySpecialties?: readonly string[];
  years: number;
  status: JCardStatus;
  employer: string | null;
  rating: number | null;
  reviewCount: number;
  inAcademy: boolean;
  trainingVerified?: boolean;
  avatar?: string;
  profileUrl: string;
  languages: readonly { name: string; fluency: number }[];
  seals: readonly JCardSeal[];
  business?: BusinessCardData;
}
export interface BusinessCardData { excellenceVotes?:Partial<Record<"service"|"prices"|"punctuality"|"professionalism"|"tenure",number>>; excellenceReviewCount?:number; bannerUrl?:string|null; avatarUrl?:string|null; category?:string|null; email?:string|null; emailSecondary?:string|null; phone?:string|null; phoneSecondary?:string|null; phoneLabel?:string|null; phoneSecondaryLabel?:string|null; name:string; opened:string; closed:string; services:string[]; location:string; licenseVerified:boolean; rating:number|null; reviewCount:number; }
export function displayedRating(rating: number | null, reviewCount: number): number | null {
  if (!reviewCount || rating === null || !Number.isFinite(rating)) return null;
  return Math.round(Math.min(5, Math.max(1, rating)) * 10) / 10;
}
export function jcardTier(rating: number | null, reviewCount: number): JCardTier {
  if(reviewCount<20)return "base";
  const rounded = displayedRating(rating, reviewCount);
  return rounded === null || rounded <= 3.5 ? "base" : rounded <= 4.5 ? "silver" : "gold";
}
/** Preserve all ten verified examples plus one pending seal, in at most two rows. */
export function sealRows(seals: readonly JCardSeal[]): JCardSeal[][] {
  const visible = [...seals];
  const split = Math.ceil(visible.length / 2);
  return visible.length <= 6 ? [visible] : [visible.slice(0, split), visible.slice(split)];
}
