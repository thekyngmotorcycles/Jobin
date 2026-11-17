/** Account-scoped recent searches. Normalization is shared by native UI and tests. */
export const MAX_RECENT_SEARCHES=12;
export function normalizeRecentQuery(query:string){
 return query.trim().replace(/\s+/g," ").slice(0,120);
}
export function mergeRecentSearches(previous:readonly string[],query:string){
 const normalized=normalizeRecentQuery(query);
 if(!normalized)return previous.slice(0,MAX_RECENT_SEARCHES);
 return [normalized,...previous.filter(q=>q.toLocaleLowerCase()!==normalized.toLocaleLowerCase())].slice(0,MAX_RECENT_SEARCHES);
}
export function suggestionsForQuery(previous:readonly string[],input:string,limit=5){
 const needle=normalizeRecentQuery(input).toLocaleLowerCase();
 return previous.filter(q=>!needle||q.toLocaleLowerCase().includes(needle)).slice(0,limit);
}
