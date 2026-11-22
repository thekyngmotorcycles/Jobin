import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(".github/workflows/"+p,"utf8");
test("Android binary workflows require explicit approval of an exact commit; no push build shortcut",()=>{
 for(const file of ["android-development-apk.yml","build-android.yml"]){
  const c=read(file);
  assert.ok(c.includes("workflow_dispatch:"));
  assert.ok(c.includes("approved_commit == github.sha"));
  assert.ok(!c.includes("  push:"));
 }
 const development=read("expo-development.yml");
 assert.ok(development.includes("default: false"));
 assert.ok(development.includes("github.event_name == 'workflow_dispatch' && inputs.build && inputs.approved_commit == github.sha"));
 assert.ok(!development.includes("[expo-preview]")&&!development.includes("[expo-build]"));
 assert.ok(development.includes('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"'));
});
