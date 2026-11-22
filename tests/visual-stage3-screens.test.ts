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
 assert.ok(security.includes("Tus datos, tu acceso y tu seguridad en un solo lugar."));
 const requests=src("src/app/message-requests.tsx");
 assert.ok(requests.includes('<Stack.Screen options={{title:"Solicitudes de mensajes"}}/>'));
 assert.ok(!requests.includes('fontSize:20,fontWeight:"800",color:t.ink}}>Solicitudes de mensajes'));
});
test("Settings list and side menu reuse one proportional row and section typography",()=>{
 const row=src("src/components/SettingsMenuRow.tsx");
 const side=src("src/components/HomeSideMenu.tsx");
 const settings=src("src/app/settings/cuenta.tsx");
 assert.ok(row.includes("minHeight:JOBEEN_CONTROL.settingsRowMinHeight"));
 assert.ok(row.includes("fontSize:JOBEEN_TYPE.body"));
 assert.ok(side.includes("minHeight:JOBEEN_CONTROL.touchTarget"),"Settings search should use the 48dp shared touch target");
 assert.ok(settings.includes("fontSize:JOBEEN_TYPE.sectionTitle"));
 assert.ok(settings.includes("gap:16,maxWidth:720"));
 assert.ok(settings.includes("<JobeenNoticeDialog"));
 assert.ok(!settings.includes('Alert.alert("Cerrar sesión"'));
});
test("Account sign-out errors remain visible in the confirmation dialog",()=>{
 const settings=src("src/app/settings/cuenta.tsx");
 assert.ok(settings.includes('description={exitError||"¿Quieres salir de tu cuenta de Jobeen?"}'),"Errors must appear above the scrim");
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
 assert.ok(personal.includes("padding:12,minHeight:JOBEEN_CONTROL.touchTarget"),"Personal form inputs use 48dp minimum height");
 assert.ok(personal.includes("minWidth:72,minHeight:JOBEEN_CONTROL.touchTarget"),"Personal editor compact actions remain accessible");
 assert.ok(business.includes("minHeight:JOBEEN_CONTROL.touchTarget"),"Business editor controls use accessible tap targets");
 assert.ok(personal.includes('fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined,color:sunflower?colors.glassText:colors.ink}]}>Apariencia'),"Personal appearance row uses section typography");
 assert.ok(business.includes('fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined}]}>Apariencia'),"Business appearance row uses section typography");
 assert.ok(personal.includes("backgroundColor:modal.scrim"));
 assert.ok(business.includes("saveJCardVisibility(visibility,editorOwner,origin)"),"Business privacy persistence retains the originating session");
 assert.ok(business.includes('minHeight:JOBEEN_CONTROL.touchTarget}}><Ionicons name="lock-closed-outline" size={23}'),"Business privacy row matches the other accessible editor sections");
 assert.ok(business.includes('fontSize:JOBEEN_TYPE.sectionTitle,fontStyle:"normal",fontFamily:undefined}]}>Privacidad'),"Privacy section matches editor typography");
});
