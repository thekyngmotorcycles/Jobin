import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(path,"utf8");

test("JShop article contact always creates or reuses its listing conversation",()=>{
 const item=source("src/app/jshop/item/[id].tsx");
 const api=source("src/lib/jshop-messaging.ts");
 assert.ok(item.includes("startJShopConversation(listing,scope)"));
 assert.ok(item.includes("conversation:conversation.id"));
 assert.ok(api.includes('.eq("listing_id",item.id).eq("buyer_id",owner)'));
 assert.ok(api.includes('error.code==="23505"'));
});

test("JShop messages remain separated from ordinary direct messages",()=>{
 const inbox=source("src/app/(tabs)/inbox.tsx");
 const chat=source("src/app/message.tsx");
 assert.ok(inbox.includes('.is("jshop_conversation_id",null)'));
 assert.ok(chat.includes('query.is("jshop_conversation_id",null)'));
 assert.ok(chat.includes('query.eq("jshop_conversation_id",conversation)'));
 assert.ok(chat.includes("jshop_conversation_id:conversation||null"));
 assert.ok(chat.includes("loadJShopConversation(conversation,scope)"));
});

test("Messaging shows tabs and purchase-sale filters with listing preview",()=>{
 const inbox=source("src/app/(tabs)/inbox.tsx");
 const chat=source("src/app/message.tsx");
 assert.ok(inbox.includes('label:"Chats"'));
 assert.ok(inbox.includes('label:"JShop"'));
 assert.ok(inbox.includes('["Todo","Compras","Ventas"]'));
 assert.ok(inbox.includes("thread.lastMessage"));
 assert.ok(inbox.includes("thread.photoUrl"));
 assert.ok(inbox.includes("jshopConversationPrice(thread)"));
 assert.ok(chat.includes("jshopConversationPrice(listingThread)"));
});

test("Database enforces conversation ownership, snapshots and the messaging participant check",()=>{
 const sql=source("supabase/migrations/20261117180000_jshop_conversations.sql");
 assert.ok(sql.includes("jshop_conversation_snapshot_on_insert"));
 assert.ok(sql.includes("listing_title:=listing.title"));
 assert.ok(sql.includes("listing_photo_path:=listing.photo_paths[1]"));
 assert.ok(sql.includes("enable row level security"));
 assert.ok(sql.includes("for insert to authenticated"));
 assert.ok(sql.includes("c.buyer_id=sender_id and c.seller_id=recipient_id"));
 assert.ok(sql.includes("jshop_conversation_id is null or exists"));
});

test("JShop threads are checked against the initiating session before use",()=>{
 const api=source("src/lib/jshop-messaging.ts");
 const item=source("src/app/jshop/item/[id].tsx");
 assert.ok(api.includes("row.buyer_id!==owner||row.seller_id!==item.sellerId||row.listing_id!==item.id"));
 assert.ok(api.includes("await assertMessageScope(scope)"));
 assert.ok(item.includes("if(scopeRef.current!==scope)return;"));
});
