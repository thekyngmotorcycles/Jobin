import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const editor=readFileSync("src/app/post/create.tsx","utf8");
const sheets=readFileSync("src/components/PostComposerSheets.tsx","utf8");
const store=readFileSync("src/lib/post-drafts.ts","utf8");
const home=readFileSync("src/app/(tabs)/index.tsx","utf8");
const root=readFileSync("src/app/_layout.tsx","utf8");
const tabs=readFileSync("src/app/(tabs)/_layout.tsx","utf8");

test("New post starts empty and existing drafts are restored only by explicit selection",()=>{
 assert.ok(!editor.includes("if(saved[0])applyDraft(saved[0])"));
 assert.ok(editor.includes("setDrafts(saved)"));
 assert.ok(editor.includes("onRestore={d=>"));
 assert.ok(editor.includes("applyDraft(d);setDraftsOpen(false)"));
});

test("Native Back returns to the existing tabs and never dispatches a cross-stack popTo",()=>{
 assert.ok(editor.includes('navigation.canGoBack()'));
 assert.ok(editor.includes('navigation.goBack()'));
 assert.ok(editor.includes('const timer=setTimeout(()=>{'));
 assert.ok(editor.includes('else router.replace("/(tabs)/index")'));
 assert.ok(!editor.includes('InteractionManager.runAfterInteractions('));
 assert.ok(editor.includes('usePreventRemove(hasWork&&!editingDone'));
 assert.ok(!editor.includes('StackActions.popTo('));
 assert.ok(!editor.includes('pathname:"/(tabs)/inicio"'));
 assert.ok(!editor.includes('router.replace({pathname:"/(tabs)/index"'));
 assert.ok(root.includes('<Stack.Screen name="(tabs)" options={{headerShown:false}}/>'));
 assert.ok(tabs.includes('{name:"index",title:"Casa"'));
 assert.ok(!tabs.includes('<Tabs.Screen name="inicio"'));
 assert.ok(editor.includes('finishHome(publishedId)'));
 assert.ok(home.includes('takePublishedPostForHome(scope)'));
 assert.ok(home.includes('featuredPostId={newlyPublished||(published??"")}'));
});

test("The two balanced secondary controls don't compete with Publish",()=>{
 assert.ok(editor.includes("Borradores. Pendientes: "));
 assert.ok(editor.includes("draftCount>0&&"));
 assert.ok(editor.includes('accessibilityLabel="Vista previa"'));
 assert.ok(editor.includes('minHeight:49,flex:1'));
 assert.ok(!editor.includes('optionsOpen'));
 assert.ok(!editor.includes('label:"Opciones"'));
});

test("Draft library is a dimmed, floating, two-column grid with manual removal",()=>{
 assert.ok(sheets.includes('floatingCard("Borradores"'));
 assert.ok(sheets.includes('animationType="fade"'));
 assert.ok(sheets.includes('borderRadius:modal.radius.dialog,overflow:"hidden"'));
 assert.ok(sheets.includes('flexDirection:"row",flexWrap:"wrap",gap:10'));
 assert.ok(sheets.includes('width:"48%"'),"Preserve two photo columns on all phones, including Jelly");
 assert.ok(sheets.includes('onPress={()=>p.onRestore(draft)}'));
 assert.ok(sheets.includes('onPress={()=>p.onDelete(draft)}'));
});

test("Existing drafts are retained; no automatic dropping once capacity is reached",()=>{
 assert.ok(store.includes("MAX_POST_DRAFTS=10"));
 assert.ok(!store.includes(".slice(0,30)"));
 assert.ok(store.includes("previous.length>=MAX_POST_DRAFTS"));
 assert.ok(store.includes('Elimina uno de los anteriores para guardar otro.'));
 assert.ok(store.includes("const next=[{...draft,photos:draft.photos.map(toStoredDraftPhoto),updatedAt:Date.now()},...previous.filter(x=>x.id!==draft.id)]"));
});

test("Preview has a floating feed-style card with real author info and photos above description",()=>{
 assert.ok(sheets.includes('floatingCard("Vista previa"'));
 assert.ok(sheets.includes("<PublicProfileAvatar"));
 assert.ok(sheets.includes("p.authorHandle"));
 assert.ok(sheets.includes("p.photos.map((photo,i)="));
 assert.ok(sheets.indexOf("p.photos.map((photo,i)=")<sheets.indexOf('{!!p.body&&<Text'));
 assert.ok(sheets.includes("heart-outline"));
 assert.ok(sheets.includes("chatbubble-outline"));
 assert.ok(sheets.includes("bookmark-outline"));
});

test("The exit sheet clips its real rounded corners and keeps the three decisions",()=>{
 assert.ok(sheets.includes('animationType="slide"'));
 assert.ok(sheets.includes('borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet,overflow:"hidden"'));
 for(const action of ["Guardar borrador","Descartar cambios","Continuar editando"])assert.ok(sheets.includes(action));
});

test("Alt text is an optional per-photo description without an additional options menu",()=>{
 assert.ok(editor.includes('Describir foto '));
 assert.ok(editor.includes('onPress={()=>setAltPhotoId(photo.id)}'));
 assert.ok(sheets.includes('floatingCard("Describir foto"'));
 assert.ok(sheets.includes('Esta descripción opcional'));
 assert.ok(!sheets.includes('title="Opciones de publicación"'));
});

test("Text composer is capped to 2000 characters and scrolls after reaching its height ceiling",()=>{
 assert.ok(editor.includes("maxLength={2000}"));
 assert.ok(editor.includes("Math.min(240,"));
 assert.ok(editor.includes("scrollEnabled={composerHeight>=240}"));
 assert.ok(editor.includes("{body.length} / 2000 caracteres"));
});
