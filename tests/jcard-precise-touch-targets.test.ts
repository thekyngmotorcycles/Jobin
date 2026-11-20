import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const card=()=>readFileSync("src/components/JobinCard.tsx","utf8");
function between(source:string,from:string,to:string){
 const a=source.indexOf(from);
 assert.ok(a>=0,"Opening marker not found: "+from);
 const b=source.indexOf(to,a+from.length);
 assert.ok(b>=0,"Closing marker not found: "+to);
 return source.slice(a,b+to.length);
}

test("Business location pressable matches icon and text, never stretching to the card edge",()=>{
 const section=between(card(),'!!b?.location&&<Pressable','</Pressable>');
 assert.ok(section.includes('alignSelf:"flex-start"'));
 assert.ok(section.includes('maxWidth:"100%"'));
 assert.ok(section.includes('minHeight:44'));
 assert.ok(section.includes('flexShrink:1,flexGrow:0'));
 assert.ok(!section.includes('style={{flex:1,fontSize:11'));
 assert.ok(!section.includes('alignSelf:"stretch"'));
 assert.ok(section.includes('event.stopPropagation()'));
 assert.ok(section.includes('Linking.openURL("https://www.google.com/maps/search/'));
});

test("Business email, phones, WhatsApp and sharing have precise independent touch actions",()=>{
 const source=card();
 const email=between(source,'<Pressable key={"business-email"+i}','</Pressable>');
 const phoneRow=between(source,'visibility.business_show_phone&&','</View>}');
 assert.ok(email.includes('alignSelf:"flex-start"'));
 assert.ok(email.includes('minHeight:44'));
 assert.ok(phoneRow.includes('accessibilityLabel="Llamar al teléfono principal del negocio"'));
 assert.ok(phoneRow.includes('accessibilityLabel={"Llamar al número "+item.number}'));
 assert.ok(phoneRow.includes('alignSelf:"flex-start",maxWidth:"100%"'));
 assert.ok(phoneRow.includes('accessibilityLabel="Abrir WhatsApp del negocio"'));
 assert.ok(phoneRow.includes('width:44,height:44'));
 assert.ok(!source.includes('accessibilityLabel="Ampliar código QR del negocio"'));
 assert.ok(source.includes('<JCardShareSheet visible={shareSide!==null}'));
 assert.ok(source.includes('accessibilityLabel="Guardar contacto del negocio"'));
 assert.ok(source.includes('accessibilityLabel="Verificación de empresa"'));
});

test("Five business medals share space visually but have isolated centered touch targets",()=>{
 const source=card();
 const award=between(source,'function BusinessAward(','export function BusinessFace');
 assert.ok(award.includes('return <View style={{flex:1'));
 assert.ok(award.includes('width:compact?50:"100%",maxWidth:"100%"'));
 assert.ok(award.includes('minHeight:compact?59:77'));
 assert.ok(award.includes('</Pressable></View>;'));
 assert.ok(!award.includes('hitSlop={compact?'));
});

test("Personal JCard languages, links and identity badges avoid swallowing empty space",()=>{
 const source=card();
 const lightLanguages=between(source,'{card.languages.slice(0,2).map','</View>:<View style={{minHeight:62');
 assert.ok(lightLanguages.includes('style={{flex:1,minWidth:0,alignItems:"center"'));
 assert.ok(lightLanguages.includes('style={{alignSelf:"center",maxWidth:"100%",minHeight:44'));
 assert.ok(!lightLanguages.includes('style={{flex:1,minWidth:0,minHeight:44'));
 assert.ok(source.includes('accessibilityLabel={"Ver empresa "+employerLink.name}'));
 assert.ok(source.includes('style={{alignSelf:"flex-start",maxWidth:"100%"}}'));
 assert.ok(source.includes('hitSlop={{top:6,bottom:6,right:6,left:0}}'));
 assert.ok(!source.includes('accessibilityLabel="Ampliar código QR personal"'));
 assert.ok(source.includes('onPress={()=>void share(back?"business":"personal")}'));
 assert.ok(source.includes('accessibilityLabel="Ver experiencia por profesión"'));
});

test("Dark JCard language rings are sized in layout instead of a transformed touch surface",()=>{
 const source=card();
 const ring=readFileSync("src/components/LanguageRing.tsx","utf8");
 assert.ok(source.includes('<LanguageRing name={language.name} value={language.fluency} color={finish.text} track={finish.line} size={sealDiameter+4}/>'));
 assert.ok(!source.includes('transform:[{scale:sealDiameter/44}]'));
 assert.ok(ring.includes('size?:number'));
 assert.ok(ring.includes('const progress='));
});

test("Empty JCard areas still flip, while individual links prioritize their own actions",()=>{
 const source=card();
 const flip=readFileSync("src/components/BusinessCard3D.tsx","utf8");
 assert.ok(source.includes('const markInteractive=useContext(CardFlipInteractionContext)'));
 assert.ok(source.includes('onTouchStart={event=>'));
 assert.ok(source.includes('markInteractive?.()'));
 assert.ok(flip.includes('Gesture.Exclusive(pan,tap)'));
 assert.ok(flip.includes('if(interactiveTouch.current)return'));
 assert.ok(flip.includes('onStartShouldSetResponderCapture={()=>{interactiveTouch.current=false;return false;}'));
});
