/** Width-aware presentation for business contact numbers.
 * All measurements are density-independent pixels (dp).
 * The primary number is never silently cut to make space for actions.
 */
export type BusinessPhoneItem={number:string;label?:string|null};
export type BusinessPhonePlan={
 numbers:BusinessPhoneItem[];
 visible:BusinessPhoneItem[];
 hiddenCount:number;
 primaryText:string;
 openDetailsFromPrimary:boolean;
};
const PHONE_FONT_SIZE=11;
const ICON_SLOT=48;
const WHATSAPP_SLOT=48;
const GAP=4;
/** Conservative text-width approximation until native text is laid out.
 * Wider glyphs and font scaling are accounted for so that the layout
 * chooses the detail action before truncating a real phone number.
 */
export function estimatedBusinessPhoneWidth(value:string,fontScale=1){
 let sum=0;
 for(const ch of value){
  sum+=ch===" "?0.32:/[il1.,:|]/.test(ch)?0.49:/[MW@]/.test(ch)?0.85:0.67;
 }
 return Math.ceil(sum*PHONE_FONT_SIZE*Math.max(1,fontScale)+5);
}
function label(item:BusinessPhoneItem){return [item.label?.trim(),item.number.trim()].filter(Boolean).join(" ");}
export function planBusinessPhones(args:{
 phone?:string|null;phoneLabel?:string|null;
 phoneSecondary?:string|null;phoneSecondaryLabel?:string|null;
 availableWidth:number;fontScale?:number;whatsApp?:boolean;
}):BusinessPhonePlan{
 const numbers=[
  {number:(args.phone??"").trim(),label:args.phoneLabel??""},
  {number:(args.phoneSecondary??"").trim(),label:args.phoneSecondaryLabel??""}
 ].filter(item=>!!item.number);
 if(!numbers.length)return {numbers:[],visible:[],hiddenCount:0,primaryText:"",openDetailsFromPrimary:false};
 const scale=args.fontScale??1;
 const room=Math.max(0,args.availableWidth-ICON_SLOT-(args.whatsApp===false?0:WHATSAPP_SLOT)-2*GAP);
 const first=label(numbers[0]);
 const both=numbers.length===2&&
  estimatedBusinessPhoneWidth(first,scale)+estimatedBusinessPhoneWidth(label(numbers[1]),scale)+GAP+8<=room;
 if(both)return {numbers,visible:numbers,hiddenCount:0,primaryText:first,openDetailsFromPrimary:false};
 const hiddenCount=numbers.length-1;
 // Keep +1 as its own accessible 48dp action, directly beside the number.
 const numberRoom=Math.max(0,room-(hiddenCount?48+GAP:0));
 const fits=estimatedBusinessPhoneWidth(first,scale)<=numberRoom;
 const compact=fits?first:
  estimatedBusinessPhoneWidth("Teléfono",scale)<=numberRoom?"Teléfono":"Tel.";
 return {numbers,visible:[numbers[0]],hiddenCount,primaryText:compact,
  openDetailsFromPrimary:!fits};
}
