import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
test("Web fixture preview is opt-in and cannot reach the live Supabase client",()=>{
 const read=(p:string)=>readFileSync(p,"utf8");
 const route=read("src/app/visual-preview.tsx"),layout=read("src/app/_layout.tsx"),db=read("src/lib/supabase.ts");
 assert.ok(route.includes('Platform.OS!=="web"||process.env.EXPO_PUBLIC_JOBEEN_VISUAL_PREVIEW!=="1"'));
 assert.ok(layout.includes('guard={Platform.OS==="web"&&process.env.EXPO_PUBLIC_JOBEEN_VISUAL_PREVIEW==="1"}'));
 assert.ok(db.includes('export const supabase=!visualPreview&&url&&key?'));
 assert.ok(route.includes('target="" previewDetails={contacts}'));
 assert.ok(route.includes('selectedSide={side} onActiveSideChange={setSide}'));
 assert.ok(route.includes('createElement("iframe"'));
 assert.ok(!route.includes("requireSupabase")&&!route.includes("ownerId="));
});
