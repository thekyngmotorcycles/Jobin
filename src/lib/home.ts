export interface Story { id: string; name: string; kind: "persona" | "empresa"; avatar: string }
export interface PhotoPost { id: string; author: string; handle: string; avatar: string; photos: string[]; caption: string; likes: number }

export const STORIES: Story[] = [
  { id: "ana", name: "Ana R.", kind: "persona", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop&crop=faces" },
  { id: "marcos", name: "Marcos", kind: "persona", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces" },
  { id: "refri", name: "Refri-Air", kind: "empresa", avatar: "" },
  { id: "sofia", name: "Sofía", kind: "persona", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces" },
  { id: "maya", name: "Maya", kind: "persona", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces" },
];

export const PHOTO_POSTS: PhotoPost[] = [
  { id: "p1", author: "Refri-Air", handle: "refri.air", avatar: "", likes: 210, caption: "Obra terminada esta semana.", photos: [
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&fit=crop",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&fit=crop",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c1dfc7?w=800&fit=crop"] },
  { id: "p2", author: "Maya Brooks", handle: "maya.makes", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces", likes: 97, caption: "Hecho a mano, pieza por pieza.", photos: [
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&fit=crop",
    "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=800&fit=crop"] },
];

export const POSTERS: Record<string, string> = {
  "studio-light": "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=700&fit=crop",
  "studio-details": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700&fit=crop",
  "stronger-today": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&fit=crop",
  "new-perspective": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&fit=crop",
};
