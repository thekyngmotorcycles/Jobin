export type JCardProfileSide="personal"|"business";

/** Preserve the requested face while the public business loads; never expose an unavailable face. */
export function resolveProfileCardSide(requested:JCardProfileSide,personalAvailable:boolean,businessAvailable:boolean):JCardProfileSide{
 if(personalAvailable&&businessAvailable)return requested;
 if(businessAvailable)return "business";
 // With neither face available the profile itself is not rendered.
 return "personal";
}
