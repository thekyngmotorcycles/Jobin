export type ConnectionIntent = "Profesionales" | "Amistad" | "Citas";
export interface Interest { professionalId: string; intent: ConnectionIntent }
export function addInterest(current: Interest[], next: Interest): Interest[] {
  return current.some(item => item.professionalId === next.professionalId && item.intent === next.intent)
    ? current : [...current, next];
}
export function toggleItem(current: string[], id: string): string[] {
  return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
}
export function filterByCity<T extends { city: string }>(items: T[], city: string): T[] {
  return city === "Todas" ? items : items.filter(item => item.city === city);
}
