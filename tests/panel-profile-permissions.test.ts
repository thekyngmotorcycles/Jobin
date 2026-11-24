import {test} from "node:test";
import assert from "node:assert/strict";
import {panelAccess,panelSections,allowedPanelModule,panelPreview,type PanelIdentity} from "../src/lib/panel-workspace.ts";
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
