import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const composer=readFileSync("src/app/post/create.tsx","utf8");
const tabs=readFileSync("src/app/(tabs)/_layout.tsx","utf8");

test("After a successful post, navigate to Home and highlight the created entry",()=>{
 assert.ok(tabs.includes('{name:"index",title:"Casa"'));
 assert.ok(composer.includes('pathname:"/(tabs)/index"'));
 assert.ok(composer.includes("finishHome(publishedId)"));
 assert.ok(!composer.includes('router.dismissTo("/(tabs)/index")'));
 assert.ok(composer.includes('const publishedId=await publishHomePost({'));
 assert.ok(composer.includes('}catch(e){setError('),"Publishing failures should still be shown");
});

test("Post text area begins as a single line and grows only when users write",()=>{
 assert.ok(composer.includes('useState(56)'));
 assert.ok(composer.includes("onContentSizeChange={event=>{"));
 assert.ok(composer.includes('Math.min(240,'));
 assert.ok(composer.includes('height:composerHeight'));
 assert.ok(composer.includes('scrollEnabled={composerHeight>=240}'));
 assert.ok(!composer.includes('minHeight:150'));
});

test("Up to five photo previews live in one horizontal scroll row",()=>{
 assert.ok(composer.includes('selectionLimit:Math.max(1,5-photos.length)'));
 assert.ok(composer.includes('if(photos.length>=5)return'));
 assert.ok(composer.includes('photos.length<5&&<Pressable'));
 assert.ok(composer.includes('<ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled'));
 assert.ok(composer.includes('accessibilityLabel="Fotografías seleccionadas, deslizar horizontalmente"'));
 assert.ok(composer.includes('contentContainerStyle={{flexDirection:"row",gap:9,paddingVertical:2}}'));
 assert.ok(!composer.includes('style={{flexDirection:"row",flexWrap:"wrap",gap:8}}'),"Photo previews must never wrap to more rows");
});

test("Video and consent explanations can expand without occupying the initial viewport",()=>{
 assert.ok(composer.includes('useState(false)'));
 assert.ok(composer.includes('accessibilityState={{expanded:mediaHelpOpen}}'));
 assert.ok(composer.includes('mediaHelpOpen&&<Text'));
 assert.ok(composer.includes('accessibilityLabel="Acepto las normas de publicación"'));
 assert.ok(composer.includes('accessibilityState={{expanded:termsExpanded}}'));
 assert.ok(composer.includes('termsExpanded&&<Text'));
 assert.ok(composer.includes('setConsent(value=>!value)'),"Disclosure must never toggle consent implicitly");
 assert.ok(composer.includes('Confirmo que el contenido es laboral o educativo y cumple las normas de Jobeen.'));
});
