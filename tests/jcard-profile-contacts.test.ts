import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {personalProfileContactRows} from "../src/lib/jcard-profile-contacts.ts";
const empty={email_primary:"",email_secondary:"",phone_primary:"",phone_secondary:""};
test("Only nonempty consent-filtered contacts render, in stable email/phone order",()=>{
 assert.deepEqual(personalProfileContactRows(empty),[]);
 assert.deepEqual(personalProfileContactRows({...empty,email_secondary:"  second@example.com  "}).map(r=>[r.label,r.value,r.uri]),[["Correo secundario","second@example.com","mailto:second%40example.com"]]);
 const rows=personalProfileContactRows({email_primary:"first@example.com",email_secondary:"second@example.com",phone_primary:"+1 (305) 555-0100",phone_secondary:"+54 11 5555-0101"});
 assert.deepEqual(rows.map(r=>r.key),["email_primary","email_secondary","phone_primary","phone_secondary"]);
 assert.equal(rows[2].uri,"tel:+13055550100");
 assert.equal(rows[3].uri,"tel:+541155550101");
 assert.deepEqual(personalProfileContactRows({...empty,phone_secondary:"  "}),[]);
});
test("Contact actions cannot open arbitrary URL schemes",()=>{
 assert.equal(personalProfileContactRows({...empty,email_primary:"https://example.com"})[0].uri,null);
 assert.equal(personalProfileContactRows({...empty,phone_primary:"javascript:alert()"})[0].uri,null);
});
test("Personal About uses only consent-filtered scoped reads in both profiles",()=>{
 const read=(p:string)=>readFileSync(p,"utf8");
 const shared=read("src/components/ProfileSharedSections.tsx");
 const component=shared.slice(shared.indexOf("export function ProfilePersonalContact"),shared.indexOf("export function ProfilePersonalLanguages"));
 assert.ok(component.includes("loadVisiblePersonalContactDetails(target,origin)"));
 assert.ok(component.includes("await assertMessageScope(origin)"));
 assert.ok(component.includes("loaded.target===target&&loaded.scope.owner===scope?.owner&&loaded.scope.session===scope?.session"));
 assert.ok(component.includes("if(!rows.length)return null"));
 assert.ok(!component.includes("loadPersonalContactDetails(")&&!component.includes("loadPublicContact("));
 assert.ok(component.includes("active=false;setLoaded(null)"));
 const owner=read("src/app/(tabs)/profile.tsx"),visitor=read("src/app/jcard.tsx");
 assert.ok(owner.includes('ownerId&&workspace.scope?.owner===ownerId&&<ProfilePersonalContact target={ownerId} scope={workspace.scope}/>'));
 assert.ok(visitor.includes('activeCardSide==="personal"&&cardVisibility.personal_enabled&&<View'));
 assert.ok(visitor.includes('<ProfilePersonalContact target={resource.data.id} scope={publicScope}/>'));
 const editor=read("src/app/professional.tsx");
 assert.ok(editor.includes("Mostrar correo en mi perfil")&&editor.includes("Mostrar teléfono en mi perfil"));
});
