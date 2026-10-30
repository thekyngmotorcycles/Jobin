import { createContext,useContext,useState,type ReactNode } from "react";
export interface LocalComment {id:string;author:string;text:string}
function useSocialState(){
 const [likedPosts,setLikedPosts]=useState<string[]>([]);
 const [following,setFollowing]=useState<string[]>([]);
 const [savedPosts,setSavedPosts]=useState<string[]>([]);
 const [comments,setComments]=useState<Record<string,LocalComment[]>>({});
 const [shares,setShares]=useState<Record<string,number>>({});
 const [roomMessages,setRoomMessages]=useState<Record<string,LocalComment[]>>({});
 const [roomHearts,setRoomHearts]=useState<Record<string,number>>({});
 function toggle(items:string[],id:string){return items.includes(id)?items.filter(x=>x!==id):[...items,id];}
 function makeComment(author:string,text:string):LocalComment{return{id:Date.now()+"-"+Math.random().toString(36).slice(2),author,text:text.trim().slice(0,500)};}
 return{likedPosts,following,savedPosts,comments,shares,roomMessages,roomHearts,
 toggleLike:(id:string)=>setLikedPosts(items=>toggle(items,id)),
 toggleFollow:(id:string)=>setFollowing(items=>toggle(items,id)),
 toggleSave:(id:string)=>setSavedPosts(items=>toggle(items,id)),
 addComment:(id:string,author:string,text:string)=>{if(text.trim())setComments(items=>({...items,[id]:[...(items[id]||[]),makeComment(author,text)]}));},
 addShare:(id:string)=>setShares(items=>({...items,[id]:(items[id]||0)+1})),
 sendRoomMessage:(id:string,author:string,text:string)=>{if(text.trim())setRoomMessages(items=>({...items,[id]:[...(items[id]||[]),makeComment(author,text)].slice(-50)}));},
 sendRoomHeart:(id:string)=>setRoomHearts(items=>({...items,[id]:(items[id]||0)+1}))
 };
}
const SocialContext=createContext<ReturnType<typeof useSocialState>|null>(null);
export function SocialProvider({children}:{children:ReactNode}){const value=useSocialState();return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;}
export function useSocial(){const value=useContext(SocialContext);if(!value)throw new Error("SocialProvider required");return value;}
