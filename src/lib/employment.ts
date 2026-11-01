import type { EmploymentEntry } from "./me";
export function employmentMonths(entries:readonly EmploymentEntry[],profession?:string,now=new Date()):number{
 const months=new Set<number>();
 for(const e of entries){
  if(profession && !(e.professions?.includes(profession) || (!e.professions?.length && e.role.toLowerCase().includes(profession.toLowerCase()))))continue;
  const start=e.from*12+(e.fromMonth??1)-1;
  const end=e.to===null?now.getFullYear()*12+now.getMonth():e.to*12+(e.toMonth??12)-1;
  for(let m=start;m<=Math.min(end,now.getFullYear()*12+now.getMonth());m++)months.add(m);
 }
 return months.size;
}
export function experienceLabel(months:number):string{
 const years=Math.floor(months/12),remaining=months%12;
 if(years===0)return remaining+"M";
 return years+"Años"+(remaining?" + "+remaining+"M":"");
}
