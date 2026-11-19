import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const composer=readFileSync("src/app/post/create.tsx","utf8");

test("Audience controls are compact and centered beside the avatar",()=>{
 assert.ok(composer.includes('justifyContent:"center",gap:7,flexWrap:"wrap"'));
 assert.ok(composer.includes('minHeight:37,paddingHorizontal:9,borderRadius:12'));
 assert.ok(composer.includes('fontSize:12,fontWeight:audience==="public"'));
 assert.ok(composer.includes('fontSize:12,fontWeight:audience==="private"'));
 assert.ok(composer.includes('ref={privateButtonRef}'));
});

test("Private audience floats over content with no reflow, dim backdrop and shadow",()=>{
 assert.ok(composer.includes('<Modal transparent visible={audienceMenuOpen} animationType="fade"'));
 assert.ok(composer.includes('onRequestClose={()=>setAudienceMenuOpen(false)}'));
 assert.ok(composer.includes('measureInWindow(openAt)'));
 assert.ok(composer.includes('setAudienceAnchor({left,top})'));
 assert.ok(composer.includes('top:audienceAnchor.top,left:audienceAnchor.left'));
 assert.ok(composer.includes('position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:t.uploadScrim'));
 assert.ok(composer.includes('shadowColor:t.floatingCardShadow,shadowOpacity:0.24,shadowRadius:18'));
 assert.ok(composer.includes('elevation:18'));
 assert.ok(!composer.includes('audienceMenuOpen&&<View style={{marginLeft:56'));
 assert.ok(composer.includes('accessibilityLabel="Cerrar opciones de privacidad"'));
});

test("The floating menu still selects followers, contacts or both and requires at least one",()=>{
 assert.ok(composer.includes('accessibilityLabel="Compartir con mis seguidores"'));
 assert.ok(composer.includes('accessibilityLabel="Compartir con mis contactos"'));
 assert.ok(composer.includes('disabled={!audienceFollowers&&!audienceContacts}'));
 assert.ok(composer.includes('setAudience("private");setAudienceMenuOpen(false)'));
 assert.ok(composer.includes('onPress={()=>{setAudience("public");setAudienceMenuOpen(false)'));
 assert.ok(composer.includes('audienceFollowers:audience==="private"&&audienceFollowers'));
 assert.ok(composer.includes('audienceContacts:audience==="private"&&audienceContacts'));
});

test("The Text button disappears without removing text publishing or the textarea",()=>{
 assert.ok(!composer.includes('label:"Texto"'));
 assert.ok(!composer.includes('icon:"create-outline"'));
 assert.ok(composer.includes('{kind:"photos",label:"Foto"'));
 assert.ok(composer.includes('{kind:"video",label:"Video"'));
 assert.ok(composer.includes('{kind:"live",label:"Clip de Live"'));
 assert.ok(composer.includes('placeholder="Muestra tu trabajo"'));
 assert.ok(composer.includes('const selected=kind===next?"text":next;'));
 assert.ok(composer.includes('if(selected==="text"&&next==="photos")setPhotos([])'));
 assert.ok(composer.includes('kind==="text"?!!body.trim()'));
 assert.ok(composer.includes('accessibilityLabel={kind===option.kind?"Quitar "+option.label:"Añadir "+option.label}'));
});
