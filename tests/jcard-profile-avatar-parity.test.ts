import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {avatarEditorFrame,avatarEditorLayout,avatarEditorCrop} from "../src/lib/avatar-editor-geometry.ts";
const source=(path:string)=>readFileSync(path,"utf8");
test("Profile avatar preview and exported crop share portrait or square geometry",()=>{
 for(const business of [true,false]){
  const frame=avatarEditorFrame(280,business),output=avatarEditorFrame(512,business);
  assert.equal(frame.height,business?280:308);
  assert.equal(output.height,business?512:563);
  for(const size of [{width:4032,height:3024},{width:1080,height:1920},{width:512,height:512}]){
   for(const zoom of [1,2,4]){
    for(const offset of [{x:0,y:0},{x:10000,y:-10000},{x:-10000,y:10000}]){
     const layout=avatarEditorLayout(frame,size,zoom,offset);
     const crop=avatarEditorCrop(frame,size,zoom,offset);
     assert.ok(layout.displayWidth>=frame.width&&layout.displayHeight>=frame.height);
     assert.ok(crop.originX>=0&&crop.originY>=0&&crop.width>0&&crop.height>0);
     assert.ok(crop.originX+crop.width<=size.width&&crop.originY+crop.height<=size.height);
     assert.ok(Math.abs(crop.height/crop.width-frame.height/frame.width)<0.035);
    }
   }
  }
 }
 const editor=source("src/app/personal-avatar-editor.tsx");
 assert.ok(editor.includes("width:frame.width,height:frame.height,borderRadius:Math.round(frame.width*0.18)"));
 assert.ok(editor.includes("avatarEditorCrop(frame,dimensions,zoom,offset)"));
 assert.ok(editor.includes("context.resize(avatarEditorFrame(512,businessAvatar))"));
 assert.ok(!editor.includes("borderRadius:SIZE/2"));
 assert.ok(editor.includes("await assertMessageScope(scope)")&&editor.includes("await uploadPersonalJCardPhoto"));
});
test("Own and visitor profiles share inset; visitor save is menu-only and scoped",()=>{
 const owner=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx"),card=source("src/components/JobinCard.tsx"),menu=source("src/components/ProfileCommunityActions.tsx");
 for(const screen of [owner,visitor])assert.ok((screen.match(/profileInset=\{16\}/g)??[]).length>=2);
 assert.equal((card.match(/onSaveContact=\{!profilePortrait&&!showOwnerActions/g)??[]).length,2);
 assert.ok(menu.includes('title="Guardar contacto"')&&menu.includes("onSaveContact();")&&menu.includes("Guardar JCard empresarial"));
 assert.ok(visitor.includes("readJCardVisibility(target,origin.scope)")&&visitor.includes("readPublicBusinessCard(target,origin.scope)"));
 assert.ok(visitor.includes("loadVisiblePersonalContactDetails(target,origin.scope)"));
 assert.ok(visitor.includes("await assertMessageScope(origin.scope);\n   if(valid())await presentJCardContact(contact)"));
 assert.ok(visitor.includes("contactTarget.current.side===current.side"));
});
