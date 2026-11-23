import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

test("Conversation overflow uses one Jobeen modal family, not legacy native alerts",()=>{
 const chat=read("src/app/message.tsx");
 const menu=read("src/components/JobeenActionDialog.tsx");
 assert.ok(chat.includes("<JobeenActionDialog"));
 assert.ok(chat.includes("<JobeenNoticeDialog"));
 assert.ok(!chat.includes("Alert.alert("),"No native modal with turquoise Android action text");
 assert.ok(menu.includes("jobeenModalTokens(theme)"),"Same cream surface, borders and radius as Jobeen");
 assert.ok(menu.includes("JOBEEN_TYPE.modalTitle"),"Use existing title scale");
 assert.ok(menu.includes("<SettingsMenuRow"),"Reuse compact action rows from all three primary menus");
 assert.ok(menu.includes('variant="action"'),"No navigation chevron for context actions");
 assert.ok(menu.includes("disabled={busy}"),"Prevent repeated actions while processing");
 assert.ok(menu.includes("accessibilityViewIsModal"),"Keep action menu accessible");
});
test("Spam, reporting and blocking keep all approved behavior and safe failures",()=>{
 const chat=read("src/app/message.tsx");
 assert.ok(chat.includes("await markJShopSpam(conversation,!jshopSpam,scope)"),"JShop spam toggle remains");
 assert.ok(chat.includes("await reportMessageUser(user,reason,scope)"),"Reports still save in backend");
 for(const reason of ['"spam"','"estafa"','"acoso"'])
  assert.ok(chat.includes(reason),"The three report reasons remain");
 assert.ok(chat.includes("await markJShopSpam(conversation,true,scope)"),"Reporting a JShop chat also flags spam");
 assert.ok(chat.includes("await blockMessageUser(user,scope)"),"Blocking remains effective");
 assert.ok(chat.includes("const scope=scopeRef.current"),"Actions remain bound to the original session");
 assert.ok(chat.includes("router.back()"),"Successful block leaves the conversation");
 assert.ok(chat.includes('description={blockError||"No podrá enviarte más mensajes."}'),"Blocking errors stay visible in confirmation");
 assert.ok(chat.includes("setMenuError("),"Failure messages are visible inside menu");
 assert.ok(chat.includes("setNotice(feedback)"),"Reporting success has user-visible confirmation");
});
test("Jobeen action rows allow sparse iconography without changing navigation layouts",()=>{
 const row=read("src/components/SettingsMenuRow.tsx");
 assert.ok(row.includes('(settingId||icon||variant==="navigation")'),"No decorative icon required for action rows");
 assert.ok(row.includes('variant==="navigation"&&<Ionicons'),"Only route rows show navigation chevron");
 assert.ok(row.includes('fontSize:JOBEEN_TYPE.body'),"Retain approved typography");
 assert.ok(row.includes("disabled={disabled}"),"Busy interaction is disabled");
});
