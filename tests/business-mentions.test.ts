import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
const search=read("src/lib/post-mentions.ts");
const editor=read("src/app/post/create.tsx");
const draft=read("src/lib/post-drafts.ts");
const feed=read("src/lib/social-content.ts");
const caption=read("src/components/PostCaption.tsx");
const cloud=read("src/lib/jcard-cloud.ts");
const company=read("src/app/jcard-business-edit.tsx");
const publicJcard=read("src/app/jcard.tsx");
const migration=read("supabase/migrations/20261120011500_jobeen_business_mentions_optional_handle.sql");

test("Business JCards are searchable by company name or optional handle even on personal accounts",()=>{
 assert.ok(search.includes('db.from("jobeen_public_business_cards" as never)'));
 assert.ok(search.includes('business_handle.ilike.'));
 assert.ok(search.includes('business_enabled'));
 assert.ok(search.includes('p.account_type==="company"'));
 assert.ok(search.includes('kind:"business" as const'));
 assert.ok(search.includes('kind:"personal" as const'));
});
test("A company handle is optional, unique among business cards and checked against personal handles",()=>{
 assert.ok(migration.includes("add column if not exists business_handle text"));
 assert.ok(migration.includes("create unique index if not exists jobeen_business_handle_unique"));
 assert.ok(migration.includes("if to_regclass('public.jcard_business_details') is not null"));
 assert.ok(cloud.includes("BUSINESS_HANDLE_PATTERN"));
 assert.ok(cloud.includes("checkBusinessHandleAvailable"));
 assert.ok(cloud.includes('rpc("jobeen_business_handle_available"'));
 assert.ok(company.includes('businessHandle:"Usuario empresarial (opcional)"'));
 assert.ok(company.includes("handleFeedback"));
 assert.ok(company.includes("await checkBusinessHandleAvailable(businessHandle,origin)"));
});
test("The composer supports company names with spaces and saves typed identity in drafts",()=>{
 assert.ok(editor.includes('setBusinessMentions('));
 assert.ok(editor.includes('person.kind==="business"'));
 assert.ok(editor.includes('businessMentions,'));
 assert.ok(editor.includes('setBusinessMentions(d.businessMentions??[])'));
 assert.ok(editor.includes('setBusinessMentions([])'));
 assert.ok(draft.includes('businessMentions?:PostBusinessMention[]'));
 assert.ok(draft.includes('businessMentions:[]'));
 assert.ok(feed.includes('business_mentions:validBusinessMentions(payload.businessMentions??[])'));
});
test("Business mention links navigate to the company's JCard business face, including the owner",()=>{
 assert.ok(feed.includes("validBusinessMentions(row.business_mentions)"));
 assert.ok(feed.includes('card:"business" as const'));
 assert.ok(caption.includes('mention.card==="business"?{card:"business"}:{}'));
 assert.ok(caption.includes('captionPieces(text,mentions)'));
 assert.ok(publicJcard.includes('initialSide={card==="business"?"business":"personal"}'));
 assert.ok(publicJcard.includes('business:publicBusiness??undefined'));
 assert.ok(publicJcard.includes('router.replace({pathname:"/(tabs)/profile",params:card==="business"?{card:"business"}:{}})'));
 assert.ok(read("src/app/(tabs)/profile.tsx").includes('initialSide={card==="business"?"business":"personal"}'));
});
test("Previously published posts and personal mentions remain compatible",()=>{
 assert.ok(migration.includes("default '[]'::jsonb"));
 assert.ok(feed.includes("mentioned_profile_ids"));
 assert.ok(feed.includes('card:"personal" as const'));
 assert.ok(editor.includes("setMentionedProfileIds"));
 assert.ok(caption.includes('Profesionales y empresas etiquetados'));
});

test("Business reviews discover companies through the privacy-filtered projection",()=>{
 const reviews=read("src/app/reviews.tsx");
 assert.ok(reviews.includes('db.from("jobeen_public_business_cards" as never).select("name")'));
 assert.ok(!reviews.includes('from("jcard_business_details")'));
});
