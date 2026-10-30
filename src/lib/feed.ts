import { professionals } from "./data";

export const FEED_TABS = ["Para ti", "Amigos"] as const;
export type FeedTab = typeof FEED_TABS[number];

// Public Google sample clips, all under the 3-minute limit. Demo playback only, not user uploads.
const SAMPLE_VIDEOS = [
 "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
 "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
 "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
 "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
];

export interface FeedClip { id: string; video: string; author: string; caption: string }

// The feed is endless: any index maps to a clip, so the list just keeps asking for more.
// "Amigos" starts from a different point so the two tabs never show the same first clip.
export function feedClip(tab: FeedTab, index: number): FeedClip {
  const offset = tab === "Amigos" ? 1 : 0;
  const position = index + offset;
  const person = professionals[position % professionals.length];
  return {
    id: `${tab}-${index}`,
    video: SAMPLE_VIDEOS[position % SAMPLE_VIDEOS.length],
    author: person.name,
    caption: person.headline,
  };
}
