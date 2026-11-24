import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const src=(path:string)=>readFileSync(path,"utf8");

test("One Royal Hive surface is shared by all major Jobeen windows",()=>{
 const theme=src("src/theme/modals.ts");
 assert.ok(theme.includes("surface:p.modal"));
 assert.ok(theme.includes("inner:p.surface"));
 assert.ok(theme.includes("border:p.line"));
 assert.ok(theme.includes("accent:p.primary,onAccent:p.onPrimary"));
 assert.ok(theme.includes("sheet:30,dialog:26,popover:18"));
 for(const path of [
  "src/components/JCardShareSheet.tsx",
  "src/components/social-ui.tsx",
  "src/components/PostComposerSheets.tsx",
  "src/components/ProfileCommunityActions.tsx",
  "src/app/(tabs)/profile.tsx",
  "src/app/jshop/location.tsx",
  "src/app/jshop/sale-location.tsx",
  "src/app/post/create.tsx",
  "src/components/LanguagePicker.tsx",
  "src/components/JobeenCreateMenu.tsx",
  "src/components/HomeSideMenu.tsx",
 ]){
  const page=src(path);
  assert.ok(page.includes("jobeenModalTokens(theme)"),path+" must reuse the modal theme");
  assert.ok(page.includes("modal.surface"),path+" must use the common surface");
  assert.ok(page.includes("modal.scrim"),path+" must use the common scrim");
 }
});
test("Notice tones are semantic; normal windows keep a neutral surface",()=>{
 const tokens=src("src/theme/palettes.ts");
 for(const name of ["info","success","warning","danger"])
  assert.ok(tokens.includes(name+":"),name+" semantic variant");
 assert.ok(tokens.includes('danger:{background:"#FBE8E8",foreground:"#922B2B"}'));
 assert.ok(tokens.includes('danger:{background:"#482329",foreground:"#FFB4B4"}'));
 assert.ok(src("src/theme/modals.ts").includes('tone==="neutral"?{background:p.modal,foreground:p.ink}:states[tone]'));
 const notice=src("src/components/JobeenNoticeDialog.tsx");
 assert.ok(notice.includes("jobeenModalTokens(theme,tone)"));
 assert.ok(notice.includes("backgroundColor:t.surface"));
 assert.ok(notice.includes('variant={destructive?"danger":"primary"}'));
 const buttons=src("src/components/ui.tsx");
 assert.ok(buttons.includes('dangerButton: { backgroundColor: danger.background }'));
 assert.ok(buttons.includes('dangerButtonText: { color: danger.foreground }'));
 assert.ok(notice.includes("JOBEEN_TYPE.modalTitle"));
 const profile=src("src/components/ProfileCommunityActions.tsx");
 assert.ok(profile.includes('<JobeenNoticeDialog visible={confirm!==null}'));
 assert.ok(profile.includes('tone="danger"'));
 assert.ok(profile.includes("removeContactRequest(contact.id,scope)"));
 assert.ok(profile.includes("scope.owner!==viewer"),"Destructive actions remain tied to the originating account");
 assert.ok(profile.includes('db.from("blocks")'));
 assert.ok(!profile.includes("Alert.alert("));
});
test("The user-facing typography and touch targets stay compact and accessible",()=>{
 const typography=src("src/theme/typography.ts");
 assert.ok(typography.includes("modalTitle:20"));
 assert.ok(typography.includes("sectionTitle:17"));
 assert.ok(typography.includes("action:15"));
 const share=src("src/components/JCardShareSheet.tsx");
 assert.ok(share.includes("style={{flexShrink:1}}"),"scrollable actions remain reachable above the send button");
 assert.ok(share.includes("minHeight:JOBEEN_CONTROL.touchTarget,marginTop:2"));
 const notice=src("src/components/JobeenNoticeDialog.tsx");
 assert.ok(notice.includes("minHeight:JOBEEN_CONTROL.touchTarget"));
 assert.ok(notice.includes("statusBarTranslucent={false}"));
});
test("Jobeen permanent style rules are not finalized until screenshots are approved",()=>{
 const agents=src("AGENTS.md");
 assert.ok(!agents.includes("## Normas tipográficas y modales definitivas 2026"));
});
