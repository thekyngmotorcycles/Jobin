import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildSharedJCard,sharedJCardFromMessage} from "../src/lib/jcard-share-link.ts";
const read=(p:string)=>readFileSync(p,"utf8");
const sheet=read("src/components/JCardShareSheet.tsx");
const api=read("src/lib/jcard-sharing.ts");
const chat=read("src/app/message.tsx");
const own=read("src/components/JobinCard.tsx");
const visitor=read("src/components/ProfileCommunityActions.tsx");
const profile=read("src/app/jcard.tsx");
const id="11111111-2222-4333-8444-555555555555";

test("Build personal and business JCards with exact deep links and safe owner identity",()=>{
 const personal=buildSharedJCard(id,"personal","María López");
 const business=buildSharedJCard(id,"business","Servicio de Clima");
 assert.equal(personal.url,"jobin://jcard?user="+id+"&card=personal");
 assert.equal(business.url,"jobin://jcard?user="+id+"&card=business");
 assert.ok(personal.message.includes("JCard personal"));
 assert.ok(business.message.includes("JCard de negocio"));
 assert.deepEqual(sharedJCardFromMessage(personal.message),{userId:id,side:"personal"});
 assert.deepEqual(sharedJCardFromMessage(business.message),{userId:id,side:"business"});
 assert.equal(sharedJCardFromMessage("Hola, te envío una foto"),null);
 assert.equal(sharedJCardFromMessage("jobin://jcard?user=NOT_VALID&card=personal"),null);
 assert.throws(()=>buildSharedJCard("bad","personal","Prueba"));
 assert.equal(buildSharedJCard(id,"personal","\nNombre\nApellido").name,"Nombre Apellido");
});
test("Share panel suggests accepted contacts only, with search, recent chat ordering and five-recipient limit",()=>{
 assert.ok(api.includes('c.status==="accepted"'));
 assert.ok(api.includes('jobeen_direct_messages'));
 assert.ok(api.includes('order("created_at",{ascending:false})'));
 assert.ok(sheet.includes('value={query} onChangeText={setQuery}'));
 assert.ok(sheet.includes('MAX_SHARE_RECIPIENTS'));
 assert.ok(sheet.includes("selected.includes(person.id)"));
 assert.ok(sheet.includes('selected.length>0&&<Pressable'));
 assert.ok(sheet.includes('sendJCardToContacts(share,recipients)'));
});
test("Sending never bypasses contact or message request privacy, and indicates partial failures",()=>{
 assert.ok(api.includes("await myContacts()"));
 assert.ok(api.includes("await loadContactAccess(person.id)"));
 assert.ok(api.includes('if(access.kind==="none")'));
 assert.ok(api.includes("await sendContactRequest(person.id,card.message)"));
 assert.ok(api.includes('}else if(access.kind==="accepted"){'));
 assert.ok(api.includes('.from("jobeen_direct_messages"'));
 assert.ok(api.includes("result.failed.push"));
 assert.ok(sheet.includes("result.failed.length"));
 assert.ok(sheet.includes("result.requests.length"));
});
test("Own card, public card, and three-dot profile menu share through the same panel",()=>{
 assert.ok(own.includes("<JCardShareSheet"));
 assert.ok(own.includes('share(back?"business":"personal")'));
 assert.ok(own.includes('share("personal")'));
 assert.ok(own.includes('share("business")'));
 assert.ok(visitor.includes("<JCardShareSheet"));
 assert.ok(visitor.includes('>Compartir JCard</Text>'));
 assert.ok(profile.includes('businessName={publicBusiness?.name??resource.data.business?.name}'));
});
test("External apps use supported URLs and Android's existing native copy chooser",()=>{
 assert.ok(sheet.includes('"https://wa.me/?text="+encodeURIComponent(share.message)'));
 assert.ok(sheet.includes('"sms:"+separator+"body="+encodeURIComponent(share.message)'));
 assert.ok(sheet.includes('Share.share({message:share.message'));
 assert.ok(sheet.includes('Share.share({message:share.url'));
 assert.ok(sheet.includes('AsyncStorage.setItem(PREFERENCE_KEY'));
 assert.ok(sheet.includes("readJCardVisibility(share.userId)"));
 assert.ok(sheet.includes("if(!(share.side==="));
});
test("A received JCard message has a real link action to the correct profile face",()=>{
 assert.ok(chat.includes("sharedJCardFromMessage(item.body)"));
 assert.ok(chat.includes('pathname:"/jcard",params:{user:shared.userId,card:shared.side}'));
 assert.ok(chat.includes('accessibilityLabel={"Abrir JCard "'));
});
test("Previously-approved accordion is untouched",()=>{
 const ownProfile=read("src/app/(tabs)/profile.tsx");
 for(const page of [ownProfile,profile]){
  assert.ok(page.includes("Animated.multiply(profileScrollY,0.5)"));
  assert.ok(page.includes("stickyHeaderIndices"));
  assert.ok(page.includes("topHeaderOffset=profileScrollY.interpolate("));
 }
});
