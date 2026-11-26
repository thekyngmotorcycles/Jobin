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
 assert.ok(owned.includes('{__DEV__&&<SettingsMenuRow title="Ver perfil ficticio (demo)"'),"Demo remains available only in development");
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
 const chunk=sections.slice(sections.indexOf("const tabs=["),sections.indexOf("export type ProfileAboutSide"));
 const matches=chunk.match(/label:"(?:Todo|JCards|Videos|En vivo|Acerca de)"/g)??[];
 assert.equal(matches.length,5);
 assert.ok(chunk.includes("minWidth:compact?JOBEEN_CONTROL.touchTarget:54,flexGrow:1,flexShrink:0"));
 assert.ok(chunk.includes("<ScrollView horizontal")&&!chunk.includes("numberOfLines"),"Large text remains reachable by horizontal scrolling");
 assert.ok(chunk.includes("onLayout={event=>{tabLayouts.current[tab.id]"),"Keep scrolling to measured selected tab");
 assert.ok(!chunk.includes('name={tab.icon}'),"No decorative icons in five creator tabs");
 assert.ok(global.includes('JobeenMessageIcon'),"Global tab icon language stays unchanged");
 assert.ok(layout.includes("JobinTabIcon"),"Global bottom navigation is preserved");
});

test("Create menu retains four routes with growable controls and safe scroll",()=>{
 const create=src("src/components/JobeenCreateMenu.tsx");
 for(const route of ["/post/create","/story/create","/create","/live"])assert.ok(create.includes('route:"'+route+'"'));
 assert.ok(create.includes("width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget"));
 assert.ok(create.includes("minHeight:MENU_ROW_HEIGHT"));
 assert.ok(create.includes("maxHeight:Math.max(0,bottomMax-menuTop)"));
 assert.ok(create.includes("<ScrollView style={{flexShrink:1}}"));
 assert.ok(create.includes("fontSize:JOBEEN_TYPE.body,lineHeight:JOBEEN_LINE_HEIGHT.body"));
});

test("Approved minimalist menus render titles only while keeping search metadata and critical confirmations",()=>{
 const home=src("src/components/HomeSideMenu.tsx");
 const settings=src("src/app/menu/[section].tsx");
 const owned=src("src/app/(tabs)/profile.tsx");
 const visitor=src("src/components/ProfileCommunityActions.tsx");
 const account=src("src/app/settings/cuenta.tsx");
 const row=src("src/components/SettingsMenuRow.tsx");
 for(const source of [home,settings]){
  assert.ok(source.includes('entry.title+" "+entry.description'),"Settings search retains keyword metadata");
  assert.ok(!source.includes("description={entry.description}"));
  assert.ok(!source.includes("{group.description}</Text>"));
 }
 assert.ok(!/<SettingsMenuRow[^>]*description=/.test(owned));
 assert.ok(!/<SettingsMenuRow[^>]*description=/.test(visitor));
 assert.ok(!account.includes("description={item.detail}"));
 assert.ok(!account.includes("{group.description}</Text>"));
 assert.ok(visitor.includes('description={confirm==="remove"?"La relación profesional se eliminará para ambos perfiles."'));
 assert.ok(account.includes('description={exitError||"¿Quieres salir de tu cuenta de Jobin?"}'));
 assert.ok(row.includes("minHeight:JOBEEN_CONTROL.touchTarget"));
 assert.ok(row.includes("borderRadius:JOBEEN_CONTROL.buttonRadius"));
 assert.ok(row.includes("backgroundColor:pressed?chrome.selected:colors.transparent"));
 assert.ok(row.includes("flex:1,minWidth:0"));
 assert.ok(row.includes("!!description"),"Essential explanations remain possible");
 assert.ok(owned.includes('width:JOBEEN_CONTROL.touchTarget,height:JOBEEN_CONTROL.touchTarget'));
 assert.ok(visitor.includes("maxHeight:Math.max(0,height-insets.top-insets.bottom-81)"));
 assert.ok(visitor.includes("<ScrollView"));
 assert.ok(visitor.includes("await assertMessageScope(scope)"));
 assert.ok(visitor.includes("await removeContactRequest(contact.id,scope)"));
 assert.ok(account.includes("await endJobinSession(scope)"));
});

test("Approved Home/Profile separation uses existing destinations and reserves unavailable functions",()=>{
 const catalog=src("src/lib/jobin-settings-catalog.ts");
 const active=catalog.slice(catalog.indexOf("export const JOBIN_SETTINGS_GROUPS:"));
 const home=src("src/components/HomeSideMenu.tsx");
 const menu=src("src/app/menu/[section].tsx");
 const owned=src("src/app/(tabs)/profile.tsx");
 const counts=src("src/components/ProfileFollowCounts.tsx");
 const account=src("src/app/settings/cuenta.tsx");
 for(const title of ["Cuenta y privacidad","Preferencias","Información y soporte"])assert.ok(active.includes(title));
 for(const id of ["zona-profesional","actividad","pagos","suscripciones","tiempo","idioma","bloqueos","sesiones","verificacion"])
  assert.ok(!active.includes('id:"'+id+'"'),"Unavailable or moved items must not be visible in Home");
 assert.ok(active.includes('route:"/menu/centro-privacidad"'));
 assert.ok(active.includes('route:"/menu/normas-politicas"'));
 assert.ok(menu.includes('router.push("/terms")')&&menu.includes('router.push("/safety")'));
 assert.ok(menu.includes('router.push("/professional")')&&menu.includes('router.push("/message-requests")'));
 assert.ok(home.includes('variant="action" tone="danger" icon="log-out-outline" title="Cerrar sesión"'));
 assert.ok(account.includes('confirmExit==="1"&&!consumedExitLink.current'));
 assert.ok(account.includes("exitScope.current=await captureMessageScope()"));
 assert.ok(account.includes("await endJobinSession(scope)"));
 assert.ok(owned.includes('title="Mi zona profesional"'));
 assert.ok(owned.includes('router.push("/map-presence")'));
 assert.ok(owned.includes('title="Mis contactos"'));
 assert.ok(owned.includes("contactsMenuRef.current?.openContacts(contactsRequested)"));
 assert.ok(counts.includes('expectedOwner===userId&&isOwner&&scopeRef.current?.owner===expectedOwner'));
 assert.ok(counts.includes('openList("contacts")'));
 assert.ok(counts.includes("await myContacts(scope)"));
 assert.ok(counts.includes("await captureMessageScope(scope)"));
 assert.ok(owned.includes('!!workspace.data?.organization&&<SettingsMenuRow'));
 assert.ok(owned.includes('!!workspace.data?.reviewer&&<SettingsMenuRow'));
 assert.ok(!owned.includes('title="Guardados"')&&!owned.includes('title="Registro de actividad"'));
});

test("Home and profile drawers center the title in the full window with equal side reservations",()=>{
 const header=src("src/components/SettingsDrawerHeader.tsx");
 const home=src("src/components/HomeSideMenu.tsx"),owned=src("src/app/(tabs)/profile.tsx");
 assert.ok(home.includes('<SettingsDrawerHeader title="Configuración" onClose={onClose}/>'));
 assert.ok(owned.includes('<SettingsDrawerHeader title="Mi perfil" onClose={closeProfileMenu}/>'));
 assert.equal((header.match(/width:JOBEEN_CONTROL\.touchTarget/g)??[]).length,2);
 assert.ok(header.includes('flex:1,minWidth:0,textAlign:"center"'));
 assert.ok(header.includes('alignItems:"center"'));
 assert.ok(header.includes('fontSize:JOBEEN_TYPE.modalTitle,lineHeight:JOBEEN_LINE_HEIGHT.modalTitle'));
 assert.ok(!header.includes("numberOfLines")&&!header.includes("adjustsFontSizeToFit"));
 assert.ok(header.includes('accessibilityLabel="Cerrar menú" onPress={onClose}'));
 assert.ok(owned.includes('setContactsRequested(ownerId);closeProfileMenu();'));
 assert.ok(home.includes('onNavigate?.();onClose();'));
});
