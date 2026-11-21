import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

test("Unknown professionals must create one initial message request before direct replies",()=>{
 const chat=read("src/app/message.tsx");
 const api=read("src/lib/message-requests.ts");
 assert.ok(chat.includes('contactAccess.kind==="none"'));
 assert.ok(chat.includes("await sendContactRequest(user!,body,me,scope)"));
 assert.ok(chat.includes('contactAccess.kind==="accepted"'));
 assert.ok(chat.includes('maxLength={!conversation&&contactAccess.kind==="none"?500:2000}'));
 assert.ok(api.includes('from("jobeen_message_requests"'));
 assert.ok(api.includes("Ya enviaste una solicitud"));
});
test("Inbox preserves JShop separation, personal Chats and request/Spam entries",()=>{
 const inbox=read("src/app/(tabs)/inbox.tsx");
 const requestPage=read("src/app/message-requests.tsx");
 assert.ok(inbox.includes('label:"Chats"'));
 assert.ok(inbox.includes('label:"JShop"'));
 assert.ok(inbox.includes(">Solicitudes de mensajes</Text>"));
 assert.ok(inbox.includes('router.push("/message-requests")'));
 assert.ok(inbox.includes('Spam de JShop'));
 assert.ok(inbox.includes("loadJShopSpamIds"));
 assert.ok(inbox.includes('shopFilter==="Spam"?shopSpamIds.has(thread.id)'));
 assert.ok(requestPage.includes("Solicitudes"));
 assert.ok(requestPage.includes("Spam"));
 assert.ok(requestPage.includes("Aceptar"));
 assert.ok(requestPage.includes("Eliminar"));
 assert.ok(requestPage.includes("Bloquear"));
 assert.ok(requestPage.includes("Reportar"));
});
test("Privacy uses following-relationship options and recipient-controlled requests",()=>{
 const page=read("src/app/message-requests.tsx");
 const data=read("src/lib/message-requests.ts");
 const migration=read("supabase/migrations/20261117190500_jobeen_requests_spam_privacy.sql");
 for(const setting of ['id:"all"','id:"following"','id:"none"'])assert.ok(page.includes(setting));
 assert.ok(page.includes("filterSpam"));
 assert.ok(data.includes("saveMessagePrivacy"));
 assert.ok(migration.includes("private.jobeen_request_before_insert"));
 assert.ok(migration.includes("private.is_blocked"));
 assert.ok(migration.includes("public.profile_follows"));
 assert.ok(migration.includes("hourly>=12 or daily>=35"));
 assert.ok(migration.includes("score>=3"));
 assert.ok(migration.includes("grant update(status)"));
 assert.ok(migration.includes("Recipient decides requests"));
});
test("Accepted requests or professional contacts permit normal chats; JShop remains item-scoped and can be spammed",()=>{
 const migration=read("supabase/migrations/20261117190500_jobeen_requests_spam_privacy.sql");
 const chat=read("src/app/message.tsx");
 assert.ok(migration.includes("r.status='accepted'"));
 assert.ok(migration.includes("jshop_conversation_id is null and exists"));
 assert.ok(migration.includes("jshop_conversation_id is not null and exists"));
 assert.ok(migration.includes("jobeen_jshop_spam"));
 assert.ok(migration.includes("jobeen_jshop_auto_spam"));
 assert.ok(chat.includes("markJShopSpam(conversation,!jshopSpam,scope)"));
 assert.ok(chat.includes("reportMessageUser"));
 assert.ok(chat.includes("blockMessageUser"));
});

test("Accepted contacts bypass duplicate message requests without changing consent records",()=>{
 const api=read("src/lib/message-requests.ts");
 const sql=read("supabase/security-review/message-jshop-authorization.sql");
 const inbox=read("src/app/(tabs)/inbox.tsx");
 assert.ok(api.includes('from("jobeen_contact_requests"'));
 assert.ok(api.includes('contacts.has(other)?"accepted":"none"'));
 assert.ok(api.includes('r.status!=="pending"||!contacts.has(r.sender_id)'));
 assert.ok(inbox.includes("loadChatRequestPreviews(user.id,scope)"));
 assert.ok(sql.includes('No redundant request for accepted contact'));
 assert.ok(sql.includes("p.requester_id = jobeen_direct_messages.sender_id"));
});

test("Messaging reads and actions carry the original authenticated session",()=>{
 const scope=read("src/lib/message-session.ts");
 const api=read("src/lib/message-requests.ts");
 const chat=read("src/app/message.tsx");
 const requests=read("src/app/message-requests.tsx");
 assert.ok(scope.includes("expected.session!==session"));
 assert.ok(scope.includes("await assertAccountOwner(owner,session)"));
 assert.ok(api.includes("await assertMessageScope(scope)"));
 assert.ok(chat.includes("if(revision.current!==generation)return;"));
 assert.ok(chat.includes("scopeRef.current=scope;setMe(scope.owner)"));
 assert.ok(requests.includes('decideMessageRequest(request.id,"accepted",scope)'));
 assert.ok(requests.includes("if(scopeRef.current!==scope)return;"));
});
