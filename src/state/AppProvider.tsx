import { createContext, useContext, useState, type ReactNode } from "react";
import type { Intent, Relationship } from "../lib/data";
import { addInterest, toggleItem, type Interest } from "../lib/domain";

function useSession() {
  const [city, setCity] = useState("Todas");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("Prefiero no decirlo");
  const [intent, setIntent] = useState<Intent>("Profesionales");
  const [likes, setLikes] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  return {
    city, setCity, name, setName, relationship, setRelationship, intent, setIntent,
    likes, saved, joined, interests,
    toggleLike: (id: string) => setLikes(items => toggleItem(items, id)),
    toggleSaved: (id: string) => setSaved(items => toggleItem(items, id)),
    toggleJoined: (id: string) => setJoined(items => toggleItem(items, id)),
    expressInterest: (professionalId: string, mode: Intent) =>
      setInterests(items => addInterest(items, { professionalId, intent: mode })),
  };
}
const SessionContext = createContext<ReturnType<typeof useSession> | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
export function useApp() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useApp must be used within AppProvider");
  return session;
}
