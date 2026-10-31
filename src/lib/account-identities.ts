export interface AccountIdentity {name:string;initials:string;avatar:string;company:boolean}
export const ACCOUNT_IDENTITIES:Record<string,AccountIdentity>={
 refri:{name:"Refri-Air",initials:"RA",avatar:"",company:true},
 ana:{name:"Ana Rivera",initials:"AR",avatar:"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&h=160&fit=crop&crop=faces",company:false},
 marcos:{name:"Marcos Díaz",initials:"MD",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",company:false},
 sofia:{name:"Sofía Torres",initials:"ST",avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",company:false},
 maya:{name:"Maya Brooks",initials:"MB",avatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces",company:false},
};
