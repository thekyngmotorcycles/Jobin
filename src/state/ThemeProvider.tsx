import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export type ThemeName = "light" | "dark" | "pink";
const palettes = {
 light: { ink: "#161616", muted: "#696969", paper: "#ffffff", line: "#dedede", accent: "#f0f0f0", card: "#ffffff", inverse: "#ffffff", reaction: "#e34f7f" },
 dark: { ink: "#fafafa", muted: "#b5b5b5", paper: "#090909", line: "#343434", accent: "#252525", card: "#151515", inverse: "#090909", reaction: "#ff7ba4" },
 pink: { ink: "#54243a", muted: "#80566a", paper: "#fce5ef", line: "#e5b5cb", accent: "#f7cddd", card: "#fff6fa", inverse: "#ffffff", reaction: "#b7386c" },
};
const ThemeContext = createContext<{ theme: ThemeName; setTheme: (theme: ThemeName) => void; colors: typeof palettes.light } | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
 const [theme,setTheme] = useState<ThemeName>("light");
 const [ready,setReady] = useState(false);
 useEffect(() => { let mounted=true; AsyncStorage.getItem("jobin.theme").then(value => {
  if(mounted && (value==="light"||value==="dark"||value==="pink")) setTheme(value);
 }).catch(()=>{}).finally(()=>{if(mounted)setReady(true);}); return()=>{mounted=false;}; },[]);
 useEffect(()=>{if(ready)void AsyncStorage.setItem("jobin.theme",theme).catch(()=>{});},[theme,ready]);
 return <ThemeContext.Provider value={{theme,setTheme,colors:palettes[theme]}}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const value=useContext(ThemeContext); if(!value)throw new Error("ThemeProvider required"); return value; }
