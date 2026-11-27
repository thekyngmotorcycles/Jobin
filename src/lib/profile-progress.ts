/** A progress bar displays the self-declared level; only an actual 100 earns the gold completion treatment. */
export function languageProgress(value:number):number{
 if(!Number.isFinite(value))return 0;
 return Math.max(0,Math.min(100,Math.floor(value)));
}
