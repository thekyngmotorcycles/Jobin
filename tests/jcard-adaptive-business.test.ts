import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {estimatedBusinessPhoneWidth,planBusinessPhones} from "../src/lib/business-phone-layout.ts";
const face=readFileSync("src/components/JobinCard.tsx","utf8");
test("An empty number list removes WhatsApp and phone rows without reserving a gap",()=>{
 const p=planBusinessPhones({availableWidth:188,fontScale:1});
 assert.equal(p.numbers.length,0);
 assert.equal(p.hiddenCount,0);
 assert.equal(p.primaryText,"");
 assert.ok(face.includes("visibility.business_show_phone&&phonePlan.numbers.length>0&&<View"));
});
test("One business phone leaves WhatsApp immediately after that phone",()=>{
 const p=planBusinessPhones({phone:"3055551212",availableWidth:188,fontScale:1});
 assert.equal(p.numbers.length,1);
 assert.equal(p.visible.length,1);
 assert.equal(p.hiddenCount,0);
 assert.equal(p.primaryText,"3055551212");
 assert.equal(p.openDetailsFromPrimary,false);
 const start=face.indexOf("phonePlan.visible.map(");
 const whatsApp=face.indexOf('accessibilityLabel="Abrir WhatsApp del negocio"',start);
 assert.ok(start>0&&whatsApp>start);
 assert.ok(!face.slice(start,whatsApp).includes("flex:1,minWidth:0"));
});
test("Two short phones display together when both fit with WhatsApp",()=>{
 const p=planBusinessPhones({phone:"3055551212",phoneSecondary:"7865559393",availableWidth:340,fontScale:1});
 assert.equal(p.numbers.length,2);
 assert.equal(p.visible.length,2);
 assert.equal(p.hiddenCount,0);
});
test("Longer or two phones on a Jelly-sized card use the separate +1 detail button",()=>{
 const p=planBusinessPhones({phone:"305 555 1212",phoneLabel:"USA",phoneSecondary:"786 555 9393",phoneSecondaryLabel:"MIA",availableWidth:188,fontScale:1});
 assert.equal(p.numbers.length,2);
 assert.equal(p.visible.length,1);
 assert.equal(p.hiddenCount,1);
 assert.ok(p.primaryText==="Tel."||p.primaryText==="Teléfono"||p.primaryText.includes("305"));
 assert.ok(face.includes('accessibilityLabel={"Ver "+phonePlan.hiddenCount+" número adicional"}'));
 assert.ok(face.includes('style={{width:48,height:48,alignItems:"center",justifyContent:"center"}}'));
 assert.ok(face.includes('contactDetailOpen==="phones"&&phonePlan.numbers.map'));
});
test("If the primary business phone is deleted the surviving secondary takes its place",()=>{
 const p=planBusinessPhones({phone:"",phoneSecondary:"7865559393",availableWidth:188});
 assert.equal(p.numbers.length,1);
 assert.equal(p.visible[0].number,"7865559393");
 assert.equal(p.hiddenCount,0);
});
test("Large font scaling falls back to full-number details without silently trimming digits",()=>{
 const p=planBusinessPhones({phone:"+1 (305) 555-1212",phoneSecondary:"+1 (786) 555-9393",availableWidth:200,fontScale:1.3});
 assert.equal(p.hiddenCount,1);
 assert.equal(p.openDetailsFromPrimary,true);
 assert.ok(["Teléfono","Tel."].includes(p.primaryText));
 assert.ok(estimatedBusinessPhoneWidth("+1 (305) 555-1212",1.3)>estimatedBusinessPhoneWidth("+1 (305) 555-1212",1));
});
test("Email, phone and location use the same 48dp icon columns and separate actions",()=>{
 assert.ok(face.includes('width:48,height:48,alignItems:"center",justifyContent:"center"'));
 assert.ok(face.includes('accessibilityLabel={"Enviar correo a "+email}'));
 assert.ok(face.includes('accessibilityLabel="Llamar al teléfono principal del negocio"'));
 assert.ok(face.includes('accessibilityLabel={"Abrir ubicación en Google Maps: "+b.location}'));
 assert.ok(face.includes('accessibilityLabel="Abrir WhatsApp del negocio"'));
 assert.ok(face.includes('minHeight:48,paddingRight:5'));
 assert.ok(face.includes('minHeight:48,paddingRight:3'));
});
test("Approved business card contains four medals and no divider above services or awards",()=>{
 const awards=face.slice(face.indexOf("const awards=["),face.indexOf("];",face.indexOf("const awards=[")));
 for(const label of ["Atención al cliente","Precios competitivos","Puntualidad","Profesionalismo"])assert.ok(awards.includes(label));
 assert.equal(awards.match(/label:/g)?.length,4);
 assert.ok(!awards.includes("En el mercado"));
 assert.ok(!face.includes("borderBottomColor:finish.line,flexShrink:0"));
 assert.ok(!face.includes('<View style={{height:1,backgroundColor:finish.line,opacity:0.7'));
 assert.ok(face.includes('{"Desde "+year}'));
});
test("Services and secondary email remain available through full-detail modal",()=>{
 assert.ok(face.includes('contactDetailOpen==="services"'));
 assert.ok(face.includes('contactDetailOpen==="emails"'));
 assert.ok(face.includes('contactDetailOpen==="phones"'));
 assert.ok(face.includes('accessibilityLabel={"Ver servicios completos: "+servicesText}'));
 assert.ok(face.includes("numberOfLines={1} ellipsizeMode=\"tail\""));
});
