import { createContext, useContext, useState, type ReactNode } from "react";
export type JobinNotice = { id:string; title:string; detail:string; read:boolean };
function useNoticeState(){
 const [notices,setNotices]=useState<JobinNotice[]>([]);
 const [unreadInbox,setUnreadInbox]=useState(0);
 return {notices,unreadActivity:notices.filter(n=>!n.read).length,unreadInbox,
  addNotice:(title:string,detail:string)=>setNotices(items=>[{id:String(Date.now()),title,detail,read:false},...items]),
  markActivityRead:()=>setNotices(items=>items.map(n=>({...n,read:true}))),
  receiveInbox:()=>setUnreadInbox(n=>n+1),
  markInboxRead:()=>setUnreadInbox(0)
 };
}
const Context=createContext<ReturnType<typeof useNoticeState>|null>(null);
export function NoticeProvider({children}:{children:ReactNode}){const value=useNoticeState();return <Context.Provider value={value}>{children}</Context.Provider>;}
export function useJobinNotices(){const value=useContext(Context);if(!value)throw new Error("NoticeProvider required");return value;}
