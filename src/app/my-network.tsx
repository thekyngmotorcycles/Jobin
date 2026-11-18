import {Redirect} from "expo-router";

/** Legacy link redirects to the activity center. Followers now open from profile counters. */
export default function MyNetworkRedirect(){return <Redirect href="/notifications"/>;}
