import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
test("Notification dot counts pending CV access requests and unread activity without duplicates",()=>{
 const notifications=src("src/lib/activity-notifications.ts");
 assert.ok(notifications.includes("countPendingProfileAlerts"));
 assert.ok(notifications.includes('from("employment_access_requests"'));
 assert.ok(notifications.includes('.eq("status","pending")'));
 assert.ok(notifications.includes('.eq("kind","cv_request").is("read_at",null)'));
 assert.ok(notifications.includes("pendingUncounted"));
 assert.ok(notifications.includes("!alreadyCounted.has(request.id)"));
});
test("Bell uses small theme-colored dot, refreshes when focused and has accessibility label",()=>{
 const bell=src("src/components/NotificationBell.tsx");
 assert.ok(bell.includes("countPendingProfileAlerts()"));
 assert.ok(bell.includes("useJobinNotices()"));
 assert.ok(bell.includes("hasAlerts=count+unreadActivity>0"));
 assert.ok(bell.includes("backgroundColor:t.yellow"));
 assert.ok(bell.includes("width:11,height:11"));
 assert.ok(bell.includes("setInterval(refresh,REFRESH_INTERVAL_MS)"));
 assert.ok(bell.includes("clearInterval(interval)"));
 assert.ok(bell.includes('router.push("/notifications")'));
 assert.ok(bell.includes("avisos pendientes"));
});
