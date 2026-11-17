import assert from "node:assert/strict";
import test from "node:test";
import {mergeRecentSearches,normalizeRecentQuery,suggestionsForQuery} from "../src/lib/search-history-core.ts";

test("recent searches deduplicate by text, normalize spaces and keep most recent first",()=>{
 const h=mergeRecentSearches(["electricista","The Kyng","soldador"],"  the   kyng ");
 assert.deepEqual(h,["the kyng","electricista","soldador"]);
 assert.equal(normalizeRecentQuery("  VRF   Miami  "),"VRF Miami");
});
test("recent searches suggest earlier searches as the user types",()=>{
 const h=["The Kyng Motorcycles","técnico HVAC en Miami","HVAC Lima","electricista"];
 assert.deepEqual(suggestionsForQuery(h,"hvac"),["técnico HVAC en Miami","HVAC Lima"]);
 assert.deepEqual(suggestionsForQuery(h,"",2),h.slice(0,2));
 assert.deepEqual(suggestionsForQuery(h,"no match"),[]);
});
test("search history is capped and ignores empty queries",()=>{
 const input=Array.from({length:18},(_,i)=>"búsqueda "+i);
 const h=mergeRecentSearches(input,"última");
 assert.equal(h.length,12);
 assert.deepEqual(mergeRecentSearches(input,"  "),input.slice(0,12));
});
