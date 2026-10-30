export const LIVE_CATEGORIES=["Popular","Nearby","Games","Shop"] as const;
export type LiveCategory=typeof LIVE_CATEGORIES[number];
export interface LiveStream {
 id:string; hostId:string; host:string; handle:string; avatar:string; thumbnail:string;
 title:string; profession:string; city:string; category:"Work"|"Games"|"Shop";
 viewers:number; video:string;
}
const video="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";
export const LIVE_STREAMS:LiveStream[]=[
 {id:"design-studio",hostId:"ana",host:"Ana Rivera",handle:"ana.rivera",avatar:"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop&crop=faces",thumbnail:"https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=700&fit=crop",title:"Inside my design process",profession:"Interior designer",city:"Miami",category:"Work",viewers:124,video},
 {id:"barber-studio",hostId:"marcos",host:"Marcos Díaz",handle:"marcos.studio305",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",thumbnail:"https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700&fit=crop",title:"An afternoon at Studio 305",profession:"Barber",city:"Miami",category:"Work",viewers:86,video},
 {id:"training-room",hostId:"sofia",host:"Sofía Torres",handle:"sofia.moves",avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",thumbnail:"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&fit=crop",title:"Let's build a stronger routine",profession:"Personal trainer",city:"Orlando",category:"Work",viewers:217,video},
 {id:"game-workshop",hostId:"leo",host:"Leo Chen",handle:"leo.builds",avatar:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces",thumbnail:"https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&fit=crop",title:"Building a game, one detail at a time",profession:"Game developer",city:"Orlando",category:"Games",viewers:342,video},
 {id:"makers-shop",hostId:"maya",host:"Maya Brooks",handle:"maya.makes",avatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces",thumbnail:"https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=700&fit=crop",title:"Made by hand, made to last",profession:"Maker & shop owner",city:"Miami",category:"Shop",viewers:65,video}
];
// These are preview rooms and sample counts; no actual live broadcast is represented.
export function browseStreams(category:LiveCategory,city:string,query=""):LiveStream[]{
 const q=query.trim().toLowerCase();
 return LIVE_STREAMS.filter(room=>
 (category!=="Nearby"||city==="Todas"||room.city===city)&&
 (category!=="Games"&&category!=="Shop"||room.category===category)&&
 (!q||(room.host+" "+room.title+" "+room.profession+" "+room.city).toLowerCase().includes(q)))
 .sort((a,b)=>b.viewers-a.viewers);
}
