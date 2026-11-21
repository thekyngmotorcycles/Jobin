import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync("src/lib/password-reauth.ts","utf8");
const page=readFileSync("src/app/change-password.tsx","utf8");
test("Password change requires a server reauthentication request and submits the nonce for validation",()=>{
 assert.ok(code.includes(".auth.reauthenticate()"));
 assert.ok(code.includes(".auth.updateUser({password,nonce:nonce.trim()})"));
 assert.ok(page.includes("if(running.current||!ownerSession||!sent)return"));
 assert.ok(page.includes("confirmPasswordChange(ownerSession,nonce,password)"));
 assert.ok(page.includes("requestPasswordConfirmation(ownerSession)"));
 assert.ok(!page.includes(".auth.updateUser("));
});
test("Password confirmation stays bound to the original account and session",()=>{
 assert.ok(code.includes("sessionMarkerKey(session.user.id,session.access_token)"));
 assert.ok(code.includes("await currentPasswordSession()!==expected"));
 for(const method of ["requestPasswordConfirmation","confirmPasswordChange"]){
  const body=code.slice(code.indexOf("export async function "+method)).split("\n}")[0];
  assert.equal((body.match(/await assertPasswordSession\(expected\)/g)??[]).length,2);
 }
 assert.ok(page.includes("currentPasswordSession().then"));
 assert.ok(!code.includes("AsyncStorage"));
 assert.ok(!page.includes("AsyncStorage"));
});
