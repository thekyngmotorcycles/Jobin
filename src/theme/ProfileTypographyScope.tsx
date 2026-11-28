import {createContext,useContext,type ReactNode} from "react";
import {useWindowDimensions} from "react-native";
import {royalHiveTypography} from "./typography";

// A scope, not a separate type system: shared components retain legacy values outside the profile.
const ProfileTypographyContext=createContext(false);
export function ProfileTypographyScope({children}:{children:ReactNode}){
 return <ProfileTypographyContext.Provider value={true}>{children}</ProfileTypographyContext.Provider>;
}
export function useRoyalHiveTypography(allowProfile=true){
 const profile=useContext(ProfileTypographyContext);
 const {width}=useWindowDimensions();
 return royalHiveTypography(width,profile&&allowProfile);
}
