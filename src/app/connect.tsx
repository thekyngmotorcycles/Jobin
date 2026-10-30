import { Redirect } from "expo-router";
// Old saved links lead to the new live hub; Meet People is no longer a tab.
export default function LegacyMeet(){return <Redirect href="/streams"/>;}
