export interface EmploymentEntry {
  id: string;
  company: string;
  role: string;
  professions?: string[];
  fromMonth?: number;
  toMonth?: number;
  from: number;
  to: number | null;
  status: "approved" | "pending";
  verifiedBy: string | null;
}
export interface ProfileVideo { id: string; title: string; likes: number; views: number; thumbnail: string }

export const DEMO_PROFILE = {
  name: "Luis J Salas",
  handle: "luis.hvac",
  role: "HVAC technician",
  years: 6,
  employer: "REFRI-AIR" as string | null,
  rating: 4.5,
  licensed: false,
  streamingNow: false,
  streamId: "design-studio",
  avatar: "",
  profileUrl: "https://jobin.app/u/luis.hvac",
  isOwner: true,
};

export const DEMO_HISTORY: EmploymentEntry[] = [
  { id: "h1", company: "REFRI-AIR", role: "Technician", from: 2010, to: null, status: "approved", verifiedBy: "REFRI-AIR" },
  { id: "h2", company: "Refri-Air", role: "Technician", from: 2000, to: 2010, status: "approved", verifiedBy: "REFRI-AIR" },
  { id: "h3", company: "AC-Cooling", role: "Helper tech", from: 1992, to: 2000, status: "pending", verifiedBy: null },
];

export const DEMO_VIDEOS: ProfileVideo[] = [
  { id: "v1", title: "Morning setup to the blower fix", likes: 42, views: 318, thumbnail: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&fit=crop" },
  { id: "v2", title: "Diagnosing a frozen coil", likes: 17, views: 140, thumbnail: "https://images.unsplash.com/photo-1504328345606-18bbc8c1dfc7?w=500&fit=crop" },
  { id: "v3", title: "Tune-up in 10 minutes", likes: 88, views: 902, thumbnail: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&fit=crop" },
];

export const DEMO_REQUESTING_COMPANIES: string[] = [];
