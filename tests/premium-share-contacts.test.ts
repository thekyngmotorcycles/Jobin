import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const src=(path:string)=>readFileSync(path,"utf8");
const panel=src("src/components/JCardShareSheet.tsx");
const contacts=src("src/lib/share-contacts.ts");

test("Approved premium light panel has real accepted Jobeen contacts with circular avatars",()=>{
 assert.ok(panel.includes("loadShareRecipients()"));
 assert.ok(contacts.includes('c.status==="accepted"'));
 assert.ok(panel.includes("<PublicProfileAvatar userId={contact.id}"));
 assert.ok(panel.includes("size={52} framed={false}"));
 assert.ok(panel.includes("borderColor:t.yellow"));
 assert.ok(panel.includes('backgroundColor:t.yellow'));
 assert.ok(panel.includes('name="checkmark" color={t.ink} size={16}'));
 assert.ok(panel.includes('position:"absolute",right:-4,top:-5,width:23,height:23'));
 assert.ok(panel.includes("textAlign:\"center\""));
 assert.ok(panel.includes('Buscar contactos de Jobeen'));
 assert.ok(!panel.includes("Para ver los contactos sugeridos y todas las apps instaladas"));
});
test("Multi-select and dynamic send button use real recipients, never mock contacts",()=>{
 assert.ok(panel.includes("const [selected,setSelected]=useState<string[]>([])"));
 assert.ok(panel.includes('accessibilityRole="checkbox"'));
 assert.ok(panel.includes('accessibilityState={{checked:active}}'));
 assert.ok(panel.includes("setSelected(previous=>previous.includes(id)?previous.filter"));
 assert.ok(panel.includes('selected.length?"Seleccionados: "+selected.length'));
 assert.ok(panel.includes('!!selected.length&&<Pressable'));
 assert.ok(panel.includes("await sendToShareRecipients(selected,message)"));
 assert.ok(panel.includes("Aún no tienes contactos aceptados de Jobeen"));
 assert.ok(!panel.includes("Mariana Torres"));
});
test("Share messages obey existing privacy rules and distinguish delivered from pending",()=>{
 assert.ok(contacts.includes("const allowed=new Set((await loadShareRecipients())"));
 assert.ok(contacts.includes("const access=await loadContactAccess(id)"));
 assert.ok(contacts.includes('access.kind==="accepted"'));
 assert.ok(contacts.includes('from("jobeen_direct_messages"'));
 assert.ok(contacts.includes('access.kind==="none"'));
 assert.ok(contacts.includes("await sendContactRequest(id,text.slice(0,500))"));
 assert.ok(contacts.includes("result.failed.push"));
 assert.ok(panel.includes("result.sent.length?"));
 assert.ok(panel.includes("result.requested.length?"));
 assert.ok(panel.includes("if(result.sent.length)onShared?.()"));
});
test("Contextual titles for JCards, public profiles, posts, video, JShop and CV",()=>{
 assert.ok(panel.includes('const shareTitle=contentTitle??"Compartir "+cardType'));
 for(const [path,title] of [
  ["src/components/ProfileCommunityActions.tsx","Compartir perfil"],
  ["src/components/HomePublishedPosts.tsx","Compartir publicación"],
  ["src/components/FeedVideo.tsx","Compartir video"],
  ["src/app/jshop/item/[id].tsx","Compartir artículo"],
  ["src/app/(tabs)/profile.tsx","Compartir CV"],
 ]){
  assert.ok(src(path).includes('contentTitle="'+title+'"'),path);
 }
});
