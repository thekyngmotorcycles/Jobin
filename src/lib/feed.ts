export const FEED_TABS = ["Local", "For You"] as const;
export type FeedTab = typeof FEED_TABS[number];
export interface FeedClip {
 id:string; postId:string; creatorId:string; video:string; avatar:string;
 author:string; handle:string; role:string; caption:string; audio:string;
 likes:number; comments:number; shares:number;
 chapter:"My Day"|"My Evening"|"My Night"; time:string;
}
const base="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
export const FEED_POSTS: Omit<FeedClip,"id">[] = [
 {postId:"studio-light",creatorId:"ana",video:base+"ForBiggerFun.mp4",avatar:"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop&crop=faces",author:"Ana Rivera",handle:"ana.rivera",role:"Interior designer",caption:"POV: you're an interior designer and the light just hit the room right. #AdayInTheLife #Design",audio:"Original sound · Ana Rivera",likes:1284,comments:24,shares:18,chapter:"My Day",time:"17:00"},
 {postId:"studio-details",creatorId:"marcos",video:base+"ForBiggerBlazes.mp4",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",author:"Marcos Díaz",handle:"marcos.studio305",role:"Barber · Studio 305",caption:"POV: you're the barber and every detail is the job. #AdayInTheLife #Miami",audio:"A day in the studio · Marcos",likes:863,comments:16,shares:32,chapter:"My Day",time:"17:00"},
 {postId:"stronger-today",creatorId:"sofia",video:base+"ForBiggerEscapes.mp4",avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",author:"Sofía Torres",handle:"sofia.moves",role:"Personal trainer",caption:"POV: you're the trainer planning tomorrow's session. #AdayInTheLife #Training",audio:"Original sound · Sofía Torres",likes:2406,comments:38,shares:91,chapter:"My Evening",time:"23:00"},
 {postId:"new-perspective",creatorId:"ana",video:base+"ForBiggerJoyrides.mp4",avatar:"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop&crop=faces",author:"Ana Rivera",handle:"ana.rivera",role:"Interior designer",caption:"POV: a blank page turns into a new possibility. #AdayInTheLife #CreativeWork",audio:"A new perspective · Ana",likes:472,comments:9,shares:12,chapter:"My Evening",time:"23:00"}
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
