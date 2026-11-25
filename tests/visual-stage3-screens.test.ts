import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");

test("Stack navigation has one compact title and duplicate in-page headings are removed",()=>{
 const nav=src("src/app/_layout.tsx");
 const type=src("src/theme/typography.ts");
 assert.ok(type.includes("navigationTitle:18"));
 assert.ok(nav.includes("headerTitleStyle:{fontSize:JOBEEN_TYPE.navigationTitle"));
 const security=src("src/app/settings/cuenta.tsx");
 assert.ok(!security.includes('fontFamily:undefined}]}>Cuenta y seguridad</Text>'));
 assert.ok(!security.includes("Tus datos, tu acceso y tu seguridad en un solo lugar."),"Approved minimalist settings must omit redundant introductory copy");
 assert.ok(security.includes("Información de tu cuenta"));
 assert.ok(security.includes("Acceso y protección"));
 assert.ok(security.includes("Administrar cuenta"));
 const requests=src("src/app/message-requests.tsx");
 assert.ok(requests.includes('<Stack.Screen options={{title:"Solicitudes de mensajes"}}/>'));
 assert.ok(!requests.includes('fontSize:20,fontWeight:"800",color:t.ink}}>Solicitudes de mensajes'));
});
test("Settings list and side menu reuse one proportional row and section typography",()=>{
 const row=src("src/components/SettingsMenuRow.tsx");
 const side=src("src/components/HomeSideMenu.tsx");
 const settings=src("src/app/settings/cuenta.tsx");
 assert.ok(row.includes("minHeight:JOBEEN_CONTROL.touchTarget"));
 assert.ok(row.includes("fontSize:JOBEEN_TYPE.body"));
 assert.ok(side.includes("minHeight:JOBEEN_CONTROL.touchTarget"),"Settings search should use the 48dp shared touch target");
 assert.ok(settings.includes("fontSize:JOBEEN_TYPE.sectionTitle"));
 assert.ok(settings.includes('<PageFrame kind="settings" bottomPadding={48}>'));
 assert.ok(settings.includes("<JobeenNoticeDialog"));
 assert.ok(!settings.includes('Alert.alert("Cerrar sesión"'));
});
test("Account sign-out errors remain visible in the confirmation dialog",()=>{
 const settings=src("src/app/settings/cuenta.tsx");
 assert.ok(settings.includes('description={exitError||"¿Quieres salir de tu cuenta de Jobin?"}'),"Errors must appear above the scrim");
 assert.ok(settings.includes('onCancel={()=>{exitScope.current=null;setExitError("");setExitOpen(false);}}'),"Dismissing clears the failure and its captured session");
 assert.ok(settings.includes('onPress={()=>void requestExit()}'),"Reopening must verify the active session");
 assert.ok(settings.includes('exitScope.current=await captureMessageScope()'),"The confirmation must bind the session that opened it");
 assert.ok(settings.includes('if(exitGuard.current||!scope)return'),"A missing or in-progress scope cannot sign out");
 assert.ok(settings.includes('await endJobinSession(scope)'),"Sign-out acts only on the captured session");
 assert.ok(!settings.includes('!!exitError&&<Text'),"Do not render the failure behind the dialog");
});
test("Personal and business JCard editors use compact accessible accordion sections",()=>{
 const personal=src("src/app/professional.tsx");
 const business=src("src/app/jcard-business-edit.tsx");
 const controls=src("src/theme/control-metrics.ts");
 assert.ok(controls.includes("accordionRowVerticalPadding:9"));
 for(const page of [personal,business]){
  assert.ok(page.includes("fontSize:JOBEEN_TYPE.sectionTitle"));
  assert.ok(page.includes("padding:JOBEEN_CONTROL.panelPadding"));
  assert.ok(page.includes("paddingVertical:JOBEEN_CONTROL.accordionRowVerticalPadding"));
 }
 assert.equal((personal.match(/paddingVertical:8,minHeight:JOBEEN_CONTROL.touchTarget/g)??[]).length,3,"Personal privacy toggles keep accessible touch height");
 assert.ok(business.includes('paddingVertical:8,minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name={visibility[item.key]'),"Business privacy toggles keep accessible touch height");
 assert.ok(personal.includes("pendingExitRef"),"Unsaved-change confirmation retained");
 assert.ok(personal.includes("minHeight:JOBEEN_CONTROL.touchTarget"),"Personal editor keeps accessible tap targets");
 assert.ok(personal.includes("const input=s.formInput"),"Personal fields reuse universal input style");
 const ui=src("src/components/ui.tsx");
 assert.ok(ui.includes("formInput: { color: colors.ink, fontSize: JOBEEN_TYPE.input"));
 assert.ok(ui.includes("minHeight: JOBEEN_CONTROL.inputHeight"));
 assert.ok(business.includes("style={s.formInput}"));
 assert.ok(personal.includes("minWidth:72,minHeight:JOBEEN_CONTROL.touchTarget"),"Personal editor compact actions remain accessible");
 assert.ok(business.includes("minHeight:JOBEEN_CONTROL.touchTarget"),"Business editor controls use accessible tap targets");
 assert.ok(personal.includes('fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined,color:colors.ink}]}>Apariencia'),"Personal appearance row uses section typography");
 assert.ok(business.includes('fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined}]}>Apariencia'),"Business appearance row uses section typography");
 assert.ok(personal.includes("backgroundColor:modal.scrim"));
 assert.ok(business.includes("saveJCardVisibility(visibility,editorOwner,origin)"),"Business privacy persistence retains the originating session");
 assert.ok(business.includes('minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name="lock-closed-outline" size={23}'),"Business privacy row matches the other accessible editor sections");
 assert.ok(business.includes('fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined}]}>Privacidad'),"Privacy section matches editor typography");
});

test("JCard editors reuse accessible fields, actions and Royal Hive notices",()=>{
 const personal=src("src/app/professional.tsx"),business=src("src/app/jcard-business-edit.tsx"),ui=src("src/components/ui.tsx");
 for(const editor of [personal,business]){
  assert.ok(!editor.includes("Alert.alert("));
  assert.ok(editor.includes("s.formLabel"));
  assert.ok(editor.includes('title="Al menos una JCard activa"'));
  assert.ok(editor.includes('tone="warning" singleAction'));
  assert.ok(editor.includes('title="Guardar cambios" busy='));
 }
 assert.ok(ui.includes("lineHeight: JOBEEN_LINE_HEIGHT.input"));
 assert.ok(ui.includes("borderRadius: JOBEEN_CONTROL.inputRadius"));
 assert.ok(personal.includes('variant="danger" disabled={action.busy} onPress={discardChanges}'));
 assert.ok(personal.includes("Una profesión declarada no equivale a una credencial verificada."));
 assert.ok(!personal.includes("El aro indica visualmente tu nivel."));
});

test("Stack settings and management pages reuse shared responsive page geometry",()=>{
 const ui=src("src/components/ui.tsx");
 assert.ok(ui.includes('edges={["bottom","left","right"]}'));
 assert.ok(ui.includes("const layout=usePageLayout(kind)"));
 for(const file of ["src/app/settings/cuenta.tsx","src/app/settings/datos-personales.tsx","src/app/settings/tipo-cuenta.tsx","src/app/settings/cierre-cuenta.tsx","src/app/settings/[item].tsx","src/app/menu/[section].tsx"])
  assert.ok(src(file).includes('<PageFrame kind="settings"'),file);
 assert.ok(src("src/components/JShopUI.tsx").includes('<PageFrame kind="management"'));
 assert.ok(ui.includes('kind==="error"?"alert"'));
 assert.ok(src("src/components/ProfessionalStatus.tsx").includes('actionLabel="Reintentar" onAction={retry}'));
});

test("Form and results pages reuse page templates while retaining custom search navigation",()=>{
 for(const file of ["src/app/professional.tsx","src/app/jcard-business-edit.tsx"])assert.ok(src(file).includes('<PageFrame kind="form"'),file);
 for(const file of ["src/app/opportunities.tsx","src/app/certificates.tsx"])assert.ok(src(file).includes('<PageFrame kind="management"'),file);
 const search=src("src/app/search.tsx");
 assert.ok(search.includes('usePageLayout("list")'));
 assert.ok(search.includes('ProfessionalMapExplorer'));
 assert.ok(search.includes('<PageState kind="error" message={error}'));
 assert.ok(src("src/app/certificates.tsx").includes("Documentos privados. Ningún archivo concede un sello sin revisión."));
});
