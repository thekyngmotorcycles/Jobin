/** Presentation only: never modifies stored ratings, counts or reputation rules. */
export function businessReviewDisplay(rating:number|null,reviewCount:number){
 const count=Number.isFinite(reviewCount)?Math.max(0,Math.trunc(reviewCount)):0;
 const unlocked=count>=10&&rating!==null&&Number.isFinite(rating)&&rating>=1&&rating<=5;
 const average=unlocked?Math.round(rating!*10)/10:0;
 const halfUnits=Math.round(average*2);
 const stars=Array.from({length:5},(_,i)=>halfUnits>=2*i+2?"full":halfUnits===2*i+1?"half":"empty");
 const countLabel=count===0?"Sin reseñas":count===1?"1 reseña":count+" reseñas";
 return {unlocked,score:average.toFixed(1),stars,countLabel,accessibilityLabel:unlocked?average.toFixed(1)+" de 5, "+countLabel:countLabel+(count>0?", calificación disponible a partir de 10 reseñas":", aún sin calificación")};
}
/** Normalize the approved language abbreviations without changing custom labels or saved data. */
export function businessPhoneLabel(label?:string|null){const value=label?.trim()??"";return /^(esp|eng)$/i.test(value)?value.toUpperCase():value;}
