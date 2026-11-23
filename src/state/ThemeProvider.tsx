import AsyncStorage from "@react-native-async-storage/async-storage";
import {Appearance,Platform,useColorScheme} from "react-native";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import {isThemePreference,normalizeThemePreference,resolveThemePreference,themeTokens,type ThemeName,type ThemePreference,type ThemeColors} from "../theme/palettes";
export type {ThemeName,ThemePreference} from "../theme/palettes";
const ThemeContext=createContext<{theme:ThemeName;preference:ThemePreference;setTheme:(theme:ThemePreference)=>void;colors:ThemeColors}|null>(null);
export function ThemeProvider({children}:{children:ReactNode}){
 const [preference,setPreference]=useState<ThemePreference>("system");const [ready,setReady]=useState(false);
 const system=useColorScheme();const theme=resolveThemePreference(preference,system);
 const touched=useRef(false);const writes=useRef(Promise.resolve());
 const setTheme=useCallback((value:ThemePreference)=>{if(!isThemePreference(value))return;touched.current=true;setPreference(value);},[]);
 useEffect(()=>{let mounted=true;void AsyncStorage.getItem("jobin.theme").then(value=>{if(mounted&&!touched.current)setPreference(normalizeThemePreference(value));}).catch(()=>{}).finally(()=>{if(mounted)setReady(true);});return()=>{mounted=false;};},[]);
 useEffect(()=>{if(ready)writes.current=writes.current.catch(()=>{}).then(()=>AsyncStorage.setItem("jobin.theme",preference));},[preference,ready]);
 // Release the native override when System is selected; useColorScheme subscribes to changes.
 useEffect(()=>{if(ready&&Platform.OS!=="web")Appearance.setColorScheme(preference==="system"?null:preference);},[preference,ready]);
 return <ThemeContext.Provider value={{theme,preference,setTheme,colors:themeTokens(theme)}}>{children}</ThemeContext.Provider>;
}
export function useTheme(){const value=useContext(ThemeContext);if(!value)throw new Error("ThemeProvider required");return value;}
