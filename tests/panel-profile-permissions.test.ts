import {test} from "node:test";
import assert from "node:assert/strict";
import {panelAccess,panelSections,allowedPanelModule,panelPreview,assertPanelEngagement,panelMediaMatches,panelPostsInPeriod,panelPostTotals,type PanelIdentity} from "../src/lib/panel-workspace.ts";
const scope={owner:"a",session:"s"};
const personal:PanelIdentity={card:{id:"a",accountType:"personal"},organization:null,reviewer:false};
const company:PanelIdentity={card:{id:"a",accountType:"company"},organization:{profile_id:"a"},reviewer:false};
test("Panel is private and distinguishes verified company from personal identity",()=>{
 assert.equal(panelAccess(null,scope),null);
 assert.equal(panelAccess(personal,null),null);
 assert.equal(panelAccess(personal,{owner:"b",session:"s"}),null);
 assert.equal(panelAccess(personal,{owner:"a",session:""}),null);
 assert.equal(panelAccess(personal,scope)?.company,false);
 assert.equal(panelAccess(company,scope)?.company,true);
 assert.equal(panelAccess({...company,organization:{profile_id:"b"}},scope)?.company,false);
 assert.equal(panelAccess({...personal,organization:{profile_id:"a"}},scope)?.company,false);
});
test("Panel orders management areas and exposes only authorized role entries",()=>{
 const p=panelAccess(personal,scope)!;
 assert.deepEqual(panelSections(p).map(s=>s.title),["Negocio","Gestión de contenido","JAcademy","Monetización"]);
 for(const id of ["company","team","credentials","instructor","unknown"])assert.equal(allowedPanelModule(personal,scope,id),null);
 assert.equal(allowedPanelModule(company,scope,"team")?.ready,true);
 assert.equal(allowedPanelModule({...personal,reviewer:true},scope,"credentials")?.ready,true);
 assert.equal(allowedPanelModule(personal,scope,"content")?.ready,true);
 assert.equal(allowedPanelModule(personal,scope,"drafts")?.ready,true);
 assert.equal(allowedPanelModule(personal,scope,"quotes")?.ready,false);
 for(const section of panelSections(p))for(const item of section.items)if(!item.ready)assert.ok(panelPreview[item.id]?.length);
});

test("administrative statistics refuse missing and invalid counts rather than inventing zero",()=>{
 const row={post_id:"p",likes:0,comments:"2",shares:0};
 assert.doesNotThrow(()=>assertPanelEngagement(["p"],[row]));
 assert.doesNotThrow(()=>assertPanelEngagement([],[]));
 assert.throws(()=>assertPanelEngagement(["p"],[]));
 assert.throws(()=>assertPanelEngagement(["p"],[{...row,likes:-1}]));
 assert.throws(()=>assertPanelEngagement(["p"],[{...row,likes:""}]));
 assert.throws(()=>assertPanelEngagement(["p"],[{...row,likes:"NaN"}]));
});

test("panel media filters keep all real statuses visible without calling held media published",()=>{
 for(const status of ["pending","processing","moderating"])assert.equal(panelMediaMatches(status,"progress"),true);
 for(const status of ["held","blocked","failed"]){assert.equal(panelMediaMatches(status,"review"),true);assert.equal(panelMediaMatches(status,"published"),false);}
 assert.equal(panelMediaMatches("live","published"),true);
 assert.equal(panelMediaMatches("published","published"),true);
 assert.equal(panelMediaMatches("ended","ended"),true);
 assert.equal(panelMediaMatches("unknown","all"),true);
 assert.equal(panelMediaMatches("unknown","progress"),false);
});
test("panel statistics filter creation date and sum actual cumulative counts",()=>{
 const now=Date.parse("2026-11-24T12:00:00Z");
 const recent={createdAt:"2026-11-23T12:00:00Z",likes:2,comments:1,shares:0};
 const old={createdAt:"2026-11-01T12:00:00Z",likes:4,comments:3,shares:2};
 const future={createdAt:"2026-11-25T12:00:00Z",likes:10,comments:10,shares:10};
 const rows=[recent,old,future];
 assert.deepEqual(panelPostsInPeriod(rows,"7",now),[recent]);
 assert.deepEqual(panelPostsInPeriod(rows,"30",now),[recent,old]);
 assert.deepEqual(panelPostsInPeriod(rows,"all",now),rows);
 assert.deepEqual(panelPostTotals([recent,old]),{posts:2,likes:6,comments:4,shares:2});
 assert.deepEqual(panelPostTotals([]),{posts:0,likes:0,comments:0,shares:0});
 assert.deepEqual(panelPostsInPeriod([{...recent,createdAt:"invalid"}],"7",now),[]);
});
