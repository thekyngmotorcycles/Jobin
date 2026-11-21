import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=(file:string)=>readFileSync(file,"utf8");

test("Jobeen's permanent vision is live-first for mobile workers, with gifts explicitly future",()=>{
 const agents=src("AGENTS.md");
 const vision=src("docs/JOBEEN_PRODUCT_VISION.md");
 const handoff=src("docs/CHAT_HANDOFF.md");
 for(const text of [agents,vision,handoff]){
  assert.ok(text.includes("mobile-first"),"The phone-first product mission must survive future chats");
  assert.ok(text.includes("EN VIVO"),"Live work content is central");
  assert.ok(text.includes("Flashes"),"Short-form videos complement the main livestream journey");
 }
 assert.ok(vision.includes("regalos/donaciones"),"Gifts belong to the future vision");
 assert.ok(vision.includes("no"),"The document includes implementation safeguards");
 assert.ok(agents.includes("Misma composición en todos los teléfonos"),"The small-phone design invariant is retained");
});

test("Home settings, owned profile, and visitor profile reuse the same menu-row system",()=>{
 const home=src("src/components/HomeSideMenu.tsx");
 const owned=src("src/app/(tabs)/profile.tsx");
 const visitor=src("src/components/ProfileCommunityActions.tsx");
 const shared=src("src/components/SettingsMenuRow.tsx");
 assert.ok(home.includes("<SettingsMenuRow"));
 assert.ok(owned.includes('<SettingsMenuRow title="Reseñas de empresas"'));
 assert.ok(owned.includes('<SettingsMenuRow title="Certificados y sellos"'));
 assert.ok(owned.includes('<SettingsMenuRow title="Oportunidades laborales"'));
 assert.ok(owned.includes('router.push("/demo-profile")'),"Owned profile demo navigation stays available");
 assert.ok(visitor.includes('<SettingsMenuRow variant="action" title="Compartir perfil"'));
 assert.ok(visitor.includes('<SettingsMenuRow variant="action" tone="danger" title="Bloquear perfil"'));
 assert.ok(visitor.includes('<SettingsMenuRow variant="action" title="Denunciar perfil"'));
 assert.ok(shared.includes('variant?:"navigation"|"action"'));
 assert.ok(shared.includes('variant==="navigation"&&<Ionicons name="chevron-forward"'));
 assert.ok(shared.includes('tone==="danger"?danger.icon:chrome.iconText'),"Only the danger icon changes tone");
 assert.ok(shared.includes('fontSize:JOBEEN_TYPE.body'),"Keep existing Jobeen typography");
 assert.ok(shared.includes("menuChrome(theme,colors)"),"Preserve the brand palette");
 assert.ok(!shared.includes("numberOfLines={2}"),"Long menu titles and descriptions should wrap, not truncate on small phones");
});

test("Creator profile section strip has five text-only choices while global bottom icons remain",()=>{
 const sections=src("src/components/ProfileSharedSections.tsx");
 const global=src("src/components/JobinTabIcon.tsx");
 const layout=src("src/app/(tabs)/_layout.tsx");
 const chunk=sections.slice(sections.indexOf("const tabs=["),sections.indexOf("export type ProfileTile"));
 const matches=chunk.match(/label:"(?:Inicio|Todo|Videos|En vivo|Acerca de)"/g)??[];
 assert.equal(matches.length,5);
 assert.ok(chunk.includes("minWidth:54,flexGrow:1"));
 assert.ok(chunk.includes("numberOfLines={2}"),"Long text labels may wrap but not be hidden on Jelly");
 assert.ok(chunk.includes("onLayout={event=>{tabLayouts.current[tab.id]"),"Keep scrolling to measured selected tab");
 assert.ok(!chunk.includes('name={tab.icon}'),"No decorative icons in five creator tabs");
 assert.ok(global.includes('JobeenMessageIcon'),"Global tab icon language stays unchanged");
 assert.ok(layout.includes("JobinTabIcon"),"Global bottom navigation is preserved");
});
