import { useSafeAreaInsets } from "react-native-safe-area-context";
export const NAVIGATION_ROW_HEIGHT=58;
export function useTabClearance(){const inset=useSafeAreaInsets();return {barHeight:NAVIGATION_ROW_HEIGHT+inset.bottom,contentBottom:NAVIGATION_ROW_HEIGHT+inset.bottom+20};}
