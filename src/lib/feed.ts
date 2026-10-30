export const FEED_TABS = ["Local", "For You"] as const;
export type FeedTab = typeof FEED_TABS[number];
export interface FeedClip {
 id:string; postId:string; creatorId:string; video:string; avatar:string;
 author:string; handle:string; role:string; caption:string; audio:string;
 likes:number; comments:number; shares:number;
}
const base="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
export const FEED_POSTS: Omit<FeedClip,"id">[] = [
 {postId:"studio-light",creatorId:"ana",video:base+"ForBiggerFun.mp4",avatar:"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop&crop=faces",author:"Ana Rivera",handle:"ana.rivera",role:"Interior designer",caption:"A little light changes everything. Inside my creative process today. #Design #DayAtWork",audio:"Original sound · Ana Rivera",likes:1284,comments:24,shares:18},
 {postId:"studio-details",creatorId:"marcos",video:base+"ForBiggerBlazes.mp4",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",author:"Marcos Díaz",handle:"marcos.studio305",role:"Barber · Studio 305",caption:"The details are the job. A fresh perspective from the studio. #Craft #Miami",audio:"A day in the studio · Marcos",likes:863,comments:16,shares:32},
 {postId:"stronger-today",creatorId:"sofia",video:base+"ForBiggerEscapes.mp4",avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",author:"Sofía Torres",handle:"sofia.moves",role:"Personal trainer",caption:"Showing up is where it starts. A look at how I plan each session. #Training #Progress",audio:"Original sound · Sofía Torres",likes:2406,comments:38,shares:91},
 {postId:"new-perspective",creatorId:"ana",video:base+"ForBiggerJoyrides.mp4",avatar:"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop&crop=faces",author:"Ana Rivera",handle:"ana.rivera",role:"Interior designer",caption:"From a blank page to a new possibility. What are you working on? #CreativeWork",audio:"A new perspective · Ana",likes:472,comments:9,shares:12}
];
// Content and engagement counts are demo examples, never real user activity.
export function feedClip(tab:FeedTab,index:number):FeedClip {
 const position=index%FEED_POSTS.length;
 return {...FEED_POSTS[position],id:tab+"-"+index};
}
export function visiblePosts(tab:FeedTab,following:string[],query=""):Omit<FeedClip,"id">[] {
 const q=query.trim().toLowerCase();
 return FEED_POSTS.filter(p=>(tab!=="Local"||following.includes(p.creatorId))&&(!q||(p.author+" "+p.handle+" "+p.caption+" "+p.role).toLowerCase().includes(q)));
}
export function formatCount(value:number):string{
 const n=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
 if(n>=1000000)return (n/1000000).toFixed(1).replace(/\.0$/,"")+"M";
 if(n>=1000)return (n/1000).toFixed(1).replace(/\.0$/,"")+"K";
 return String(n);
}
