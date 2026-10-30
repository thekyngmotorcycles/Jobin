export const REVIEW_AUTH_DAYS = 30;
export const EXTENSION_MONTHS = [1, 3, 6] as const;
export const STRIKE_LIMIT = 2;
export const BAN_DAYS = 365;
export const LIVE_CONSENT = "Solo se permite contenido laboral. Prohibido transmitir fiestas, conciertos o vida cotidiana. Por ejemplo, un guardia de un club solo puede transmitir en el exterior, nunca dentro del local.";

const DAY = 86_400_000;

export interface ReviewAuthorization { grantedAt: number; expiresAt: number }

export function grantReviewAuthorization(now: number): ReviewAuthorization {
  return { grantedAt: now, expiresAt: now + REVIEW_AUTH_DAYS * DAY };
}

export function extendAuthorization(auth: ReviewAuthorization, months: (typeof EXTENSION_MONTHS)[number], now: number): ReviewAuthorization {
  const base = Math.max(auth.expiresAt, now);
  return { grantedAt: auth.grantedAt, expiresAt: base + months * 30 * DAY };
}

export function canReview(auth: ReviewAuthorization | null, now: number): boolean {
  return !!auth && now < auth.expiresAt;
}

export function canSendJobinCard(recipientKind: "personal" | "company", senderIsOwner: boolean, requestedByCompany: boolean): boolean {
  return senderIsOwner && recipientKind === "company" && requestedByCompany;
}

export function canSendHistory(recipientKind: "personal" | "company", senderIsOwner: boolean, requestedByCompany: boolean): boolean {
  return canSendJobinCard(recipientKind, senderIsOwner, requestedByCompany);
}

export function canDeleteApprovedEmployment(entry: { status: "approved" | "pending" }): boolean {
  return entry.status !== "approved";
}

export interface Strikes { count: number; bannedUntil: number | null }

export function addStrike(strikes: Strikes, now: number): Strikes {
  const count = strikes.count + 1;
  return count >= STRIKE_LIMIT ? { count, bannedUntil: now + BAN_DAYS * DAY } : { count, bannedUntil: null };
}

export function isBanned(strikes: Strikes, now: number): boolean {
  return strikes.bannedUntil !== null && now < strikes.bannedUntil;
}

export function canGoLive(strikes: Strikes, now: number, employerApproved: boolean | null): boolean {
  if (isBanned(strikes, now)) return false;
  return employerApproved !== false;
}

export function jobinCardStatus(employer: string | null, rating: number): string {
  return rating > 0 && employer ? "ACTIVE" : "AVAILABLE";
}

export function rankStories<T extends { id: string }>(items: T[], interactions: Record<string, number>): T[] {
  return [...items].sort((a, b) => (interactions[b.id] ?? 0) - (interactions[a.id] ?? 0));
}
