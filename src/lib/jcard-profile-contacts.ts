import type {PersonalContactDetails} from "./jcard-contact";
const fields=[
 {key:"email_primary",label:"Correo principal",kind:"email"},
 {key:"email_secondary",label:"Correo secundario",kind:"email"},
 {key:"phone_primary",label:"Teléfono principal",kind:"phone"},
 {key:"phone_secondary",label:"Teléfono secundario",kind:"phone"}
] as const;
/** Input is the server's consent-filtered contact projection, not the private editor. */
export function personalProfileContactRows(details:PersonalContactDetails){
 return fields.flatMap(field=>{
  const value=details[field.key].trim();
  if(!value)return [];
  const phone=value.replace(/[^\d+]/g,"");
  const uri=field.kind==="email"?( /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?"mailto:"+encodeURIComponent(value):null):
   (/^\+?\d+$/.test(phone)?"tel:"+phone:null);
  return [{...field,value,uri}];
 });
}
