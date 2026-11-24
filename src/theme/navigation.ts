import {createContext,useContext} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export const NAVIGATION_ROW_HEIGHT=58;
export function useTabClearance(){const inset=useSafeAreaInsets();return {barHeight:NAVIGATION_ROW_HEIGHT+inset.bottom,contentBottom:NAVIGATION_ROW_HEIGHT+inset.bottom+20};}

export const FLASH_NAV_HANDLE_HEIGHT=48;
export const FlashNavigationClearance=createContext<number|null>(null);
export function useFlashNavigationClearance(){const value=useContext(FlashNavigationClearance);const {barHeight}=useTabClearance();return value??barHeight;}
