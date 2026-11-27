import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {languageProgress} from "../src/lib/profile-progress.ts";
import {employmentBannerFamily} from "../src/lib/employment-banner.ts";
import {BANNER_PALETTES} from "../src/theme/employment-art.ts";
const source=(p:string)=>readFileSync(p,"utf8");
test("Language completion is bounded, does not round an incomplete level to 100",()=>{
 for(const [value,expected] of [[65,65],[99.9,99],[100,100],[101,100],[-5,0],[NaN,0]])assert.equal(languageProgress(value),expected);
 const shared=source("src/components/ProfileSharedSections.tsx");
 assert.ok(shared.includes("complete=percent===100"));
 assert.ok(shared.includes('accessibilityRole="progressbar"')&&shared.includes("own&&!complete"));
 assert.ok(shared.includes("Nivel declarado")&&shared.includes("todavía no están disponibles"));
});
test("Official category codes drive art without a parallel profession taxonomy",()=>{
 const categories=["business","agriculture","arts","automotive","aviation","beauty","climate","commerce","construction","sports","design","education","railway","hospitality","hotels","industry","engineering","logistics","maintenance","heavy_equipment","maritime","fashion","motorcycles","refrigeration","health","animals","security","legal","technology","transport"];
 assert.deepEqual(Object.keys(BANNER_PALETTES).sort(),[...categories,"generic"].sort());
 const profession=(code:string,category:string,label=code)=>({code,category,label,short_label:label,icon:"",active:true});
 for(const category of categories)assert.equal(employmentBannerFamily("irrelevant",["fixture"],[profession("fixture",category)]),category);
 const catalog=[profession("tecnico_hvac_aire_acondicionado","climate","Técnico HVAC"),profession("refrigeracion","refrigeration","Técnico en Refrigeración"),profession("electricista","construction","Electricista"),profession("electricista_naval","maritime","Electricista naval"),profession("electricista_motocicletas","motorcycles","Electricista de motocicletas"),profession("electricista_ferroviario","railway","Electricista ferroviario"),profession("ingeniero_electrico","engineering","Ingeniero eléctrico"),profession("electricista_automotriz","automotive","Electricista automotriz")];
 assert.equal(employmentBannerFamily("Técnico HVAC",["tecnico_hvac_aire_acondicionado"],catalog),"climate");
 assert.equal(employmentBannerFamily("Técnico HVAC",["refrigeracion"],catalog),"refrigeration");
 for(const entry of catalog)assert.equal(employmentBannerFamily(entry.label,[entry.code],catalog),entry.category);
 assert.equal(employmentBannerFamily("Electricista naval",[],catalog),"maritime");
 assert.equal(employmentBannerFamily("Electricista",["missing"],catalog),"generic");
 assert.equal(employmentBannerFamily("Electricista",["electricista","electricista_naval"],catalog),"generic");
 assert.equal(employmentBannerFamily("Electricista",[],[...catalog,profession("other","technology","Electricista")]),"generic");
 assert.equal(employmentBannerFamily("Electricista",[],[]),"generic");
 assert.equal(employmentBannerFamily("fixture",["fixture"],[profession("fixture","new_category")]),"generic");
 assert.equal(employmentBannerFamily("fixture",["fixture"],[profession("fixture","toString")]),"generic");
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

test("Premium About uses established Royal Hive typography and plain history title",()=>{
 const owner=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx"),grid=source("src/components/ProfessionalHistoryGrid.tsx"),shared=source("src/components/ProfileSharedSections.tsx");
 assert.ok(owner.includes('<Text accessibilityRole="header" style={s.h3}>Historial profesional</Text>'));
 assert.ok(!owner.includes('<Text style={s.h2}>Historial profesional</Text>'));
 assert.ok(visitor.includes('fontSize:JOBEEN_TYPE.sectionTitle,lineHeight:JOBEEN_LINE_HEIGHT.sectionTitle,color:colors.ink}}>Historial profesional'));
 assert.ok(grid.includes("fontSize:JOBEEN_TYPE.body")&&grid.includes("fontSize:JOBEEN_TYPE.caption")&&grid.includes("fontSize:JOBEEN_TYPE.micro"));
 assert.ok(!/fontSize:\s*\d/.test(grid));
 const languages=shared.slice(shared.indexOf("export function ProfilePersonalLanguages"),shared.indexOf("/** Business fields"));
 assert.ok(languages.includes("fontSize:JOBEEN_TYPE.sectionTitle")&&languages.includes("fontSize:JOBEEN_TYPE.caption"));
 assert.ok(!/fontSize:\s*\d/.test(languages));
});
