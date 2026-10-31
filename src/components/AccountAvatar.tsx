import { ACCOUNT_IDENTITIES } from "../lib/account-identities";
import { Avatar } from "./social-ui";
export function AccountAvatar({accountId,size=44,fallbackName}:{accountId:string;size?:number;fallbackName?:string}){
 const identity=ACCOUNT_IDENTITIES[accountId];
 return <Avatar uri={identity?.avatar||undefined} name={identity?.name??fallbackName??accountId} initials={identity?.initials} emphasis={identity?.company} size={size}/>;
}
