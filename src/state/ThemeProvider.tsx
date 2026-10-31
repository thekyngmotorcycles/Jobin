import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance,Platform } from "react-native";
import { createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode } from "react";
import { isThemeName,themeTokens,type ThemeName,type ThemeColors } from "../theme/palettes";
export type { ThemeName } from "../theme/palettes";
const ThemeContext=createContext<{theme:ThemeName;setTheme:(theme:ThemeName)=>void;colors:ThemeColors}|null>(null);
export function ThemeProvider({children}:{children:ReactNode}){
 const [theme,setCurrentTheme]=useState<ThemeName>("light");const [ready,setReady]=useState(false);
 const touched=useRef(false);const writes=useRef(Promise.resolve());
 const setTheme=useCallback((value:ThemeName)=>{if(!isThemeName(value))return;touched.current=true;setCurrentTheme(value);},[]);
 useEffect(()=>{let mounted=true;void AsyncStorage.getItem("jobin.theme").then(value=>{if(mounted&&!touched.current&&isThemeName(value))setCurrentTheme(value);}).catch(()=>{}).finally(()=>{if(mounted)setReady(true);});return()=>{mounted=false;};},[]);
 useEffect(()=>{if(ready)writes.current=writes.current.catch(()=>{}).then(()=>AsyncStorage.setItem("jobin.theme",theme));},[theme,ready]);
 useEffect(()=>{if(Platform.OS!=="web")Appearance.setColorScheme(theme==="dark"?"dark":"light");},[theme]);
 return <ThemeContext.Provider value={{theme,setTheme,colors:themeTokens(theme)}}>{children}</ThemeContext.Provider>;
}
export function useTheme(){const value=useContext(ThemeContext);if(!value)throw new Error("ThemeProvider required");return value;}
