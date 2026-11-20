import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const card=readFileSync("src/components/JobinCard.tsx","utf8");
const ring=readFileSync("src/components/LanguageRing.tsx","utf8");
const flip=readFileSync("src/components/BusinessCard3D.tsx","utf8");

test("Business location touch target is content-sized, not stretched across the card",()=>{
 const match=card.match(/\{!!b\?\.location&&<Pressable[\s\S]*?\{b\.location\}<\/Text><\/Pressable>\}/);
 assert.ok(match,"business location link exists");
 const target=match[0];
 assert.ok(target.includes('alignSelf:"flex-start"'));
 assert.ok(target.includes('maxWidth:"100%"'));
 assert.ok(target.includes("minHeight:48"));
 assert.ok(target.includes("flexGrow:0"));
 assert.ok(!target.includes("style={{flex:1,fontSize:11"));
 assert.ok(target.includes("event.stopPropagation()"));
});
test("Business contacts have bounded touch areas and independent call/WhatsApp actions",()=>{
 assert.ok(card.includes('accessibilityLabel={"Enviar correo a "+email}'));
 assert.ok(card.includes('alignSelf:"flex-start",maxWidth:"100%",minHeight:48,paddingRight:5'));
 assert.ok(card.includes('accessibilityLabel="Llamar al teléfono principal del negocio"'));
 assert.ok(card.includes('accessibilityLabel={"Llamar al número "+item.number}'));
 assert.ok(card.includes('accessibilityLabel="Abrir WhatsApp del negocio"'));
 assert.ok(card.includes("tel:"));
 assert.ok(card.includes("https://wa.me/"));
});
test("Personal language and business awards do not turn empty flex columns into buttons",()=>{
 assert.ok(card.includes('<View key={language.name+index} style={{flex:1,minWidth:0,alignItems:"center",justifyContent:"center"}}><Pressable'));
 assert.ok(card.includes('style={{alignSelf:"center",maxWidth:"100%",minHeight:48,flexDirection:"row"'));
 assert.ok(card.includes('return <View style={{flex:1,minWidth:0,alignItems:"center",justifyContent:"center",marginHorizontal:compact?0:1}}><Pressable'));
 assert.ok(card.includes('width:compact?50:"100%"'));
 assert.ok(card.includes('size={sealDiameter+4}'));
 assert.ok(!card.includes('transform:[{scale:sealDiameter/44}]'));
 assert.ok(ring.includes("size=52"));
 assert.ok(ring.includes("size?:number"));
});
test("Card actions remain separate from flip gesture and decorative visuals are noninteractive",()=>{
 assert.ok(card.includes("CardFlipInteractionContext"));
 assert.ok(card.includes("markInteractive?.()"));
 assert.ok(card.includes('accessibilityLabel="Ampliar código QR del negocio"'));
 assert.ok(card.includes('accessibilityLabel="Verificación de empresa"'));
 assert.ok(card.includes('accessibilityLabel="Guardar contacto del negocio"'));
 assert.ok(card.includes("event.stopPropagation()"));
 assert.ok(flip.includes("Gesture.Exclusive(pan,tap)"));
 assert.ok(flip.includes("if(interactiveTouch.current)return;"));
 assert.ok(flip.includes('pointerEvents="none"'));
});
