import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const editor=readFileSync("src/app/post/create.tsx","utf8");
const feed=readFileSync("src/lib/social-content.ts","utf8");
const sql=readFileSync("supabase/migrations/20261119203000_jobeen_feed_post_audiences.sql","utf8");

test("Create Post shows exactly one headline and a concise neutral-Spanish prompt",()=>{
 assert.ok(editor.includes('title:"Crear publicación"'));
 assert.ok(!editor.includes('title:"Nueva publicación"'));
 assert.ok(!editor.includes('>Crear publicación</Text>'));
 assert.ok(editor.includes('placeholder="Muestra tu trabajo"'));
 assert.ok(!editor.includes('¿Qué quieres compartir de tu trabajo?'));
});

test("Audience selector supports followers, contacts and their union",()=>{
 assert.ok(editor.includes('Publicación pública'));
 assert.ok(editor.includes('Elegir destinatarios privados'));
 assert.ok(editor.includes('Mis seguidores'));
 assert.ok(editor.includes('Mis contactos'));
 assert.ok(editor.includes('audienceFollowers?"checkmark-circle":"ellipse-outline"'));
 assert.ok(editor.includes('audienceContacts?"checkmark-circle":"ellipse-outline"'));
 assert.ok(editor.includes('!audienceFollowers&&!audienceContacts'));
 assert.ok(editor.includes('setAudience("private")'));
 assert.ok(editor.includes('setAudience("public")'));
 assert.ok(editor.includes('audienceContacts:audience==="private"&&audienceContacts'));
 assert.ok(editor.includes('audienceFollowers:audience==="private"&&audienceFollowers'));
});

test("Privacy is enforced by Supabase RLS for follows and accepted contacts",()=>{
 assert.ok(sql.includes("create policy \"Jobeen feed read visible\""));
 assert.ok(sql.includes("audience_followers and exists"));
 assert.ok(sql.includes("audience_contacts and exists"));
 assert.ok(sql.includes("public.profile_follows f"));
 assert.ok(sql.includes("public.jobeen_contact_requests c"));
 assert.ok(sql.includes("c.status = 'accepted'"));
 assert.ok(sql.includes("c.requester_id = author_id"));
 assert.ok(sql.includes("c.recipient_id = author_id"));
 assert.ok(sql.includes("audience = 'public'"));
 assert.ok(sql.includes("audience = 'private'"));
 assert.ok(sql.includes("alter view public.jobeen_feed_engagement set (security_invoker = true)"));
});

test("Private photographs cannot be delivered with public storage URLs",()=>{
 assert.ok(sql.includes("'jobeen-private-post-photos',false"));
 assert.ok(sql.includes('Jobeen private post photos restricted read'));
 assert.ok(sql.includes("name = any(p.photo_paths)"));
 assert.ok(feed.includes('createSignedUrls(privatePaths,300)'));
 assert.ok(feed.includes('row.photo_bucket===PRIVATE_POSTS_BUCKET?'));
 assert.ok(feed.includes('signedUrls.get(path)'));
 assert.ok(feed.includes('photo_bucket:bucket'));
 assert.ok(feed.includes('db.storage.from(bucket).remove(uploaded)'));
 assert.ok(feed.includes('stored.photo_bucket===PRIVATE_POSTS_BUCKET?PRIVATE_POSTS_BUCKET:POSTS_BUCKET'));
});

test("Existing posts retain public audience and published live media is not mislabeled private",()=>{
 assert.ok(sql.includes("audience text not null default 'public'"));
 assert.ok(sql.includes("photo_bucket text not null default 'photo-posts'"));
 assert.ok(sql.includes("kind in ('text', 'photos')"));
 assert.ok(feed.includes('Los videos y Lives aprobados solo pueden compartirse de forma pública.'));
 assert.ok(editor.includes('disabled={kind==="video"||kind==="live"}'));
});
