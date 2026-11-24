import {test} from "node:test";
import assert from "node:assert/strict";
import {panelMediaMatches} from "../src/lib/panel-workspace.ts";

test("panel media filters keep all real statuses visible without calling held media published",()=>{
 for(const status of ["pending","processing","moderating"])assert.equal(panelMediaMatches(status,"progress"),true);
 for(const status of ["held","blocked","failed"]){assert.equal(panelMediaMatches(status,"review"),true);assert.equal(panelMediaMatches(status,"published"),false);}
 assert.equal(panelMediaMatches("live","published"),true);
 assert.equal(panelMediaMatches("published","published"),true);
 assert.equal(panelMediaMatches("ended","ended"),true);
 assert.equal(panelMediaMatches("unknown","all"),true);
 assert.equal(panelMediaMatches("unknown","progress"),false);
});
