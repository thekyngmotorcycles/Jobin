import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const code=()=>readFileSync("src/components/SocialHeader.tsx","utf8");
const composer=()=>readFileSync("src/components/PostQuickComposer.tsx","utf8");

test("Home stories get the whole row; the disclosure and composer are below",()=>{
 const src=code();
 const stories=src.indexOf("<StoryStrip/>");
 const disclosure=src.indexOf('accessibilityHint="Despliega');
 const quick=src.indexOf("<PostQuickComposer/>");
 assert.ok(stories>=0&&disclosure>stories&&quick>disclosure);
 assert.ok(!src.includes("flex:1,minWidth:0}}><StoryStrip/>"));
 assert.ok(!src.includes('name={composerVisible?"chevron-up-outline":"create-outline"}'));
 assert.ok(src.includes("accessibilityState={{expanded:composerVisible"));
 assert.ok(src.includes("minHeight:44"));
 assert.ok(src.includes("StyleSheet.hairlineWidth"));
});

test("Chevron and card animate together with Reanimated and a reduced motion fallback",()=>{
 const src=code();
 assert.ok(src.includes("useReducedMotion()"));
 assert.ok(src.includes("duration:DISCLOSURE_MS"));
 assert.ok(src.includes("const DISCLOSURE_MS=250"));
 assert.ok(src.includes("prefersReducedMotion?target:withTiming"));
 assert.ok(src.includes('name="chevron-down"'));
 assert.ok(src.includes("interpolate(reveal.value,[0,1],[0,180])"));
 assert.ok(src.includes("height:Math.max(0,composerHeight)*reveal.value"));
 assert.ok(src.includes('overflow:"hidden"'));
 assert.ok(src.includes("importantForAccessibility={composerVisible?"));
 assert.ok(src.includes('pointerEvents={composerVisible?'));
});

test("Floating card shadow does not live inside the clipping layer",()=>{
 const src=code();
 const shadow=src.indexOf('pointerEvents="none"');
 const clip=src.indexOf('style={[{overflow:"hidden"},revealStyle]}');
 assert.ok(shadow>=0&&clip>shadow);
 assert.ok(src.includes("shadowColor:t.floatingCardShadow"));
 assert.ok(src.includes("shadowRadius:18"));
 assert.ok(src.includes("shadowOpacity:interpolate("));
 assert.ok(src.includes("elevation:interpolate("));
 assert.ok(src.includes('backgroundColor:t.surface,borderRadius:CARD_RADIUS'));
 assert.ok(!composer().includes("expo-haptics"));
});

test("Single haptic tick on deliberate presses; cloud preference and rollback retained",()=>{
 const src=code();
 assert.ok(src.includes("Haptics.selectionAsync().catch(()=>{})"));
 assert.ok(src.includes("lastToggleAt.current<DISCLOSURE_MS"));
 assert.ok(src.includes("if(!owner||saving"));
 assert.ok(src.includes("saveQuickComposerPreference(owner,next,scope)"));
 assert.ok(src.includes("loadQuickComposerPreference(id,scope)"));
 assert.ok(src.includes("reveal.value=enabled?1:0"));
 assert.ok(src.includes("setComposerVisible(!next)"));
 assert.ok(!src.includes("setTimeout("));
});
