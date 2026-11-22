
import test from "node:test";
import assert from "node:assert/strict";
import {createLegacyPrivateInventory} from "../src/lib/legacy-private-inventory.ts";
const a={owner:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",session:"jobeen.session.started.v3.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.a"};
const b={owner:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",session:"jobeen.session.started.v3.bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.b"};
test("Inventory returns presence only for exact owner-scoped categories, never global or foreign keys",async()=>{
 const values=new Map([
  ["jobeen.post.drafts.v1."+a.owner,"synthetic A"],
  ["jobeen.flash.draft.v1."+b.owner,"synthetic B"],
  ["jobeen.post.drafts.v1","unknown owner"],
  ["jobeen.reel.draft.v1."+a.owner,"synthetic professional video"]
 ]);
 const reads:string[]=[];
 const inspect=createLegacyPrivateInventory({async contains(key){reads.push(key);return values.has(key)}},async scope=>assert.deepEqual(scope,a));
 const result=await inspect(a);
 assert.deepEqual(result,[{category:"post-drafts",state:"requires-review"},{category:"jshop-drafts",state:"absent"},{category:"jshop-favorites",state:"absent"},{category:"flash-draft",state:"absent"},{category:"professional-video-draft",state:"requires-review"}]);
 assert.equal(reads.length,5);assert.ok(reads.every(k=>k.endsWith("."+a.owner)));
 assert.equal(values.size,4);assert.ok(!JSON.stringify(result).includes("synthetic"));
});
test("A session change during legacy inspection returns no partial inventory",async()=>{
 let current=a,calls=0;
 const inspect=createLegacyPrivateInventory({async contains(){calls++;current=b;return true}},async scope=>assert.deepEqual(scope,current));
 await assert.rejects(inspect(a),/inventario privado/);assert.equal(calls,1);
});
test("Invalid identity and backend failure fail closed without exposing provider details",async()=>{
 let calls=0;
 const inspect=createLegacyPrivateInventory({async contains(){calls++;throw Error("synthetic sensitive value")}},async()=>{});
 await assert.rejects(inspect({...a,owner:"../"}),/Cuenta inválida/);assert.equal(calls,0);
 await assert.rejects(inspect(a),e=>e instanceof Error&&e.message==="No se pudo verificar el inventario privado.");
});
