
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createSessionExitFence} from "../src/lib/session-exit-fence.ts";
test("An active logout immediately blocks original scope and prevents overlapping logout",async()=>{
 const fence=createSessionExitFence();const states:(string|null)[]=[];
 fence.subscribe(()=>states.push(fence.current()));
 await fence.close("A-session",async()=>{
  assert.throws(()=>fence.assertOpen("A-session"));
  fence.assertOpen("B-session");
  await assert.rejects(fence.close("B-session",async()=>{}));
 });
 assert.deepEqual(states,["A-session",null]);fence.assertOpen("A-session");
});
test("Failure releases only the temporary fence so auth can be reverified",async()=>{
 const fence=createSessionExitFence();
 await assert.rejects(fence.close("A-session",async()=>{throw Error("network")}));
 assert.equal(fence.current(),null);
});
test("Logout is scoped and serialized; no legacy deletion or stale navigation",()=>{
 const auth=readFileSync("src/components/AuthGate.tsx","utf8");
 const scope=readFileSync("src/lib/account-scope.ts","utf8");
 const settings=readFileSync("src/app/settings/cuenta.tsx","utf8");
 assert.ok(auth.includes("await runAuthExit(async()=>"));
 assert.ok(auth.includes("await sessionExitFence.close(origin.session"));
 assert.ok(auth.includes('AsyncStorage.setItem(origin.session,"revoked")'));
 assert.ok(auth.includes("sessionExitFence.subscribe("));
 assert.ok(scope.includes("sessionExitFence.assertOpen(expectedSession)"));
 assert.ok(scope.includes("sessionExitFence.assertOpen(session)"));
 assert.ok(settings.includes("exitScope.current=await captureMessageScope()"));
 assert.ok(settings.includes("await endJobinSession(scope)"));
 assert.ok(!settings.includes('router.replace("/login")'));
});
