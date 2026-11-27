import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {languageProgress} from "../src/lib/profile-progress.ts";
import {employmentBannerFamily,BANNER_PALETTES} from "../src/lib/employment-banner.ts";
const source=(p:string)=>readFileSync(p,"utf8");
test("Language completion is bounded, does not round an incomplete level to 100",()=>{
 for(const [value,expected] of [[65,65],[99.9,99],[100,100],[101,100],[-5,0],[NaN,0]])assert.equal(languageProgress(value),expected);
 const shared=source("src/components/ProfileSharedSections.tsx");
 assert.ok(shared.includes("complete=percent===100"));
 assert.ok(shared.includes('accessibilityRole="progressbar"')&&shared.includes("own&&!complete"));
 assert.ok(shared.includes("Nivel declarado")&&shared.includes("todavía no están disponibles"));
});
test("Families reuse catalog groups and distinguish technical trades with safe fallback",()=>{
 assert.equal(employmentBannerFamily("Técnico HVAC"),"hvac");
 assert.equal(employmentBannerFamily("Técnico HVAC",["tecnico_hvac_aire_acondicionado"]),"hvac");
 assert.equal(employmentBannerFamily("Refrigeración"),"refrigeration");
 assert.equal(employmentBannerFamily("Electricista"),"electricity");
 assert.equal(employmentBannerFamily("Técnico de mantenimiento general / Handyman"),"maintenance");
 assert.equal(employmentBannerFamily("Unknown"),"generic");
 const groups=["construction","maintenance","climate","transport","automotive","technology","business","commerce","legal","health","animals","hospitality","hotels","beauty","sports","education","arts","design","engineering","fashion","security","industry","agriculture","logistics"];
 for(const category of groups)assert.equal(employmentBannerFamily("fixture",[],[{code:"fixture",category,label:"fixture",short_label:"fixture",icon:"",active:true}]),category);
 assert.equal(Object.keys(BANNER_PALETTES).length,28);
});
test("History uses two columns, actual verification, scoped owner edit and authorized visitor rows",()=>{
 const grid=source("src/components/ProfessionalHistoryGrid.tsx"),owner=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx");
 assert.ok(grid.includes('width:"50%"')&&grid.includes("aspectRatio:fontScale<=1.15?1:undefined"));
 assert.ok(grid.includes('row.verifiedBy===null?"No verificada":"Verificación no disponible"'));
 assert.ok(owner.includes("historyEditable&&canDeleteApprovedEmployment(entry)?()=>openEmployment(entry):undefined"));
 assert.ok(owner.includes("onAdd={historyEditable?()=>openEmployment():undefined}"));
 assert.ok(visitor.includes('user!==viewer&&cvStatus!=="approved"'));
 assert.ok(visitor.includes("cvRows.map((row,i)=>")&&!visitor.includes("onAdd={"));
 assert.ok(grid.includes("<EmploymentBanner family={family}/>"));
});
