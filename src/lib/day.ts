export type ChapterId = "day" | "evening" | "night";
export interface Chapter { id: ChapterId; title: string; startHour: number; endHour: number; publishLabel: string; slots: { label: string; prompt: string }[] }
export const CLIP_SECONDS = 10;
export const CHAPTERS: Chapter[] = [
 { id: "day", title: "My Day", startHour: 7, endHour: 17, publishLabel: "17:00", slots: [
  { label: "Morning", prompt: "POV: how your workday starts" },
  { label: "Lunch", prompt: "POV: your lunch break" },
  { label: "Afternoon", prompt: "POV: the work in front of you" }] },
 { id: "evening", title: "My Evening", startHour: 17, endHour: 23, publishLabel: "23:00", slots: [
  { label: "18:00", prompt: "POV: leaving work" },
  { label: "20:00", prompt: "POV: your evening" },
  { label: "22:00", prompt: "POV: winding down" }] },
 { id: "night", title: "My Night", startHour: 23, endHour: 26, publishLabel: "02:00", slots: [
  { label: "23:30", prompt: "POV: still up" },
  { label: "01:00", prompt: "POV: the late shift" }] }
];
export function chapterAt(date: Date): Chapter {
 const h = date.getHours();
 return h >= 7 && h < 17 ? CHAPTERS[0] : h >= 17 && h < 23 ? CHAPTERS[1] : CHAPTERS[2];
}
export type SlotClips = Record<ChapterId, (string | null)[]>;
export function emptyClips(): SlotClips {
 return { day: [null, null, null], evening: [null, null, null], night: [null, null] };
}
export function nextOpenSlot(clips: (string | null)[]): number { return clips.findIndex(c => !c); }
