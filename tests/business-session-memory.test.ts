import test from "node:test";
import assert from "node:assert/strict";
import {createBusinessSessionMemory} from "../src/lib/business-session-memory.ts";
const A={owner:"a",session:"a-1"},B={owner:"b",session:"b-1"},A2={owner:"a",session:"a-2"};
test("Business snapshot cannot cross accounts or sessions",()=>{
 const memory=createBusinessSessionMemory<{email:string}>();
 const a={email:"synthetic-a@example.test"},b={email:"synthetic-b@example.test"};
 memory.write(A,a);assert.deepEqual(memory.read({...A}),a);
 assert.equal(memory.read(B),null);assert.equal(memory.read(A),null);
 memory.write(B,b);assert.equal(memory.read(A2),null);assert.equal(memory.read(B),null);
 memory.write(A2,a);assert.equal(memory.read(A),null);
});
test("Clearing memory or starting a new process cannot restore a snapshot",()=>{
 const memory=createBusinessSessionMemory<string>();
 memory.write(A,"synthetic");memory.clear();
 assert.equal(memory.read(A),null);
 memory.write(A,"synthetic");
 assert.equal(createBusinessSessionMemory<string>().read(A),null);
 memory.write({owner:"a",session:""},"invalid");assert.equal(memory.read(A),null);
});