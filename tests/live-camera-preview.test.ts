import {test} from "node:test";
import assert from "node:assert/strict";
import {canShowLivePreview} from "../src/lib/live-preview.ts";
const scope={owner:"a",session:"s"};
const input={focused:true,foreground:true,requested:true,cameraGranted:true,verified:scope,current:scope};
test("viewfinder requires intentional permission and verified active identity",()=>{
 assert.equal(canShowLivePreview(input),true);
 for(const key of ["focused","foreground","requested","cameraGranted"] as const)assert.equal(canShowLivePreview({...input,[key]:false}),false);
 assert.equal(canShowLivePreview({...input,verified:null}),false);
 assert.equal(canShowLivePreview({...input,current:null}),false);
 assert.equal(canShowLivePreview({...input,current:{owner:"b",session:"s"}}),false);
 assert.equal(canShowLivePreview({...input,current:{owner:"a",session:"other"}}),false);
 assert.equal(canShowLivePreview({...input,verified:{owner:"",session:""},current:{owner:"",session:""}}),false);
});
