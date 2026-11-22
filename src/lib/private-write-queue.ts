// Serialize read-modify-write for one private storage key, even across sessions.
const tails=new Map<string,Promise<void>>();
export async function serializePrivateWrite<T>(key:string,task:()=>Promise<T>):Promise<T>{
 const previous=tails.get(key)??Promise.resolve();
 const result=previous.then(task);
 const tail=result.then(()=>{},()=>{});
 tails.set(key,tail);
 try{return await result;}finally{if(tails.get(key)===tail)tails.delete(key);}
}
