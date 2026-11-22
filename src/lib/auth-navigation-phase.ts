export type AuthNavigationPhase="checking"|"signed-out"|"onboarding"|"signed-in";
export function classifyAuthNavigation(ready:boolean,handlingOAuth:boolean,sessionScope:string|null,needsUsername:boolean):AuthNavigationPhase{
 if(!ready||handlingOAuth)return "checking";
 if(!sessionScope)return "signed-out";
 return needsUsername?"onboarding":"signed-in";
}
