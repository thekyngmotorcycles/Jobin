/** Pure continuity guard. Authentication and authorization remain with the server. */
export type MessageScope={owner:string;session:string};
type SessionReader=()=>Promise<MessageScope>;
type UserVerifier=()=>Promise<string|null>;
type ScopeVerifier=(owner:string,session:string)=>Promise<unknown>;

/** Check the captured scope, confirm the server user and re-check the local session. */
export async function verifyMessageSession(
 read:SessionReader,verify:UserVerifier,assertCurrent:ScopeVerifier,expected?:MessageScope
):Promise<MessageScope>{
 const {owner,session}=await read();
 if(expected&&(expected.owner!==owner||expected.session!==session))throw Error("La sesión cambió.");
 const verified=await verify();
 if(verified!==owner)throw Error("La sesión cambió.");
 await assertCurrent(owner,session);
 return {owner,session};
}
