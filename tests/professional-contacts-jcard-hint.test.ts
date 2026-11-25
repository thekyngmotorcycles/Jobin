import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");
test("Professional contact invitations are mutual, owner-only and independent of follows",()=>{
 const sql=source("supabase/migrations/20261119020421_jobeen_professional_contacts.sql");
 assert.ok(sql.includes("jobeen_contacts_pair_unique"));
 assert.ok(sql.includes("least(requester_id,recipient_id),greatest(requester_id,recipient_id)"));
 assert.ok(sql.includes("enable row level security"));
 assert.ok(sql.includes("requester_id=(select auth.uid())"));
 assert.ok(sql.includes("recipient_id=(select auth.uid())"));
 assert.ok(sql.includes("with check(recipient_id=(select auth.uid()) and status in ('accepted','declined')"));
 assert.ok(sql.includes("not private.is_blocked(requester_id,recipient_id)"));
 assert.ok(sql.includes("job een")===false);
 assert.ok(sql.includes("jobeen_remove_blocked_contacts"));
 assert.ok(sql.includes("security definer"));
 assert.ok(sql.includes("public.jobeen_contact_count"));
 assert.ok(sql.includes("revoke all on function public.jobeen_contact_count(uuid) from public,anon"));
 assert.ok(!sql.includes("drop table public.profile_follows"));
});
test("Follow and Connect are separate actions on public JCards",()=>{
 const publicProfile=source("src/components/ProfileCommunityActions.tsx");
 const contacts=source("src/lib/professional-contacts.ts");
 assert.ok(publicProfile.includes("toggleFollow()"));
 assert.ok(publicProfile.includes("async function connect()"));
 assert.ok(publicProfile.includes('contactLabel=!contact?"Conectar"'));
 assert.ok(publicProfile.includes("inviteContact(user,scope)"));
 assert.ok(publicProfile.includes("replyContactRequest(contact.id,true,scope)"));
 assert.ok(publicProfile.includes("removeContactRequest(contact.id,scope)"));
 assert.ok(contacts.includes('from("jobeen_contact_requests"'));
 assert.ok(contacts.includes('rpc("jobeen_contact_count"'));
});
test("Compact profile counts show Followers + Contacts with the third Following tab in My network",()=>{
 const counter=source("src/components/ProfileFollowCounts.tsx");
 assert.ok(counter.includes('label:"Seguidores"'));
 assert.ok(counter.includes('label:"Contactos"'));
 assert.ok(counter.includes('["followers","following","contacts"]'));
 assert.ok(counter.includes('title="Mi red"'));
 assert.ok(counter.includes('contactCount(userId)'));
 assert.ok(counter.includes("myContacts(scope)"));
 assert.ok(counter.includes("replyContactRequest"));
 assert.ok(counter.includes("removeContactRequest"));
 assert.ok(counter.includes("fontSize:14"));
});
test("Incoming contacts are actionable and count toward notification badge",()=>{
 const screen=source("src/app/notifications.tsx");
 const lib=source("src/lib/activity-notifications.ts");
 const sql=source("supabase/migrations/20261119020421_jobeen_professional_contacts.sql");
 assert.ok(screen.includes("replyContactRequest(id,approve,scope)"));
 assert.ok(screen.includes('n.kind==="contact_request"'));
 assert.ok(screen.includes("pendingWithoutNotice"));
 assert.ok(lib.includes("pendingUncountedContacts"));
 assert.ok(lib.includes('case "contact_request"'));
 assert.ok(lib.includes('case "contact_accepted"'));
 assert.ok(sql.includes("'contact_request'"));
 assert.ok(sql.includes("'contact_accepted'"));
});
test("JCard keeps real flip gestures without an automatic reveal or extra tutorial queries",()=>{
 const card=source("src/components/JobinCard.tsx");
 const flip=source("src/components/BusinessCard3D.tsx");
 assert.ok(!card.includes("jobeen.jcard.flip.ghost"));
 assert.ok(!card.includes("ghostPreview="));
 assert.ok(!card.includes("AsyncStorage.getItem"));
 assert.ok(!card.includes('name="hand-left-outline"'));
 assert.ok(!card.includes('name="sync-outline"'));
 assert.ok(!card.includes("Toca o desliza para girar"));
 assert.ok(flip.includes("Gesture.Exclusive(pan,tap)"));
 assert.ok(flip.includes("CardFlipInteractionContext.Provider"));
 assert.ok(flip.includes("onSide(next)"));
});

test("Contact actions and notifications use the originating session across awaits",()=>{
 const api=source("src/lib/professional-contacts.ts");
 const profile=source("src/components/ProfileCommunityActions.tsx");
 const network=source("src/components/ProfileFollowCounts.tsx");
 const notices=source("src/app/notifications.tsx");
 assert.ok(api.includes("captureMessageScope(expectedScope)"));
 assert.ok(api.includes("await assertMessageScope(scope)"));
 assert.ok(api.includes("r.requester_id===mine||r.recipient_id===mine"));
 assert.ok(profile.includes("scopeRef.current===scope"));
 assert.ok(network.includes("contactAction(person,undefined,scope)"));
 assert.ok(network.includes("listRevision.current===generation"));
 assert.ok(notices.includes("revision.current!==generation"));
 assert.ok(notices.includes("markActivityNotificationsRead(notices,scope)"));
});

test("Royal Hive contact confirmation preserves the captured account and single in-flight mutation",()=>{
 const network=source("src/components/ProfileFollowCounts.tsx");
 const confirm=network.slice(network.indexOf(" function confirmRemove("),network.indexOf(" function changeTab("));
 const mutation=network.slice(network.indexOf(" async function contactAction("),network.indexOf(" function confirmRemove("));
 assert.ok(confirm.includes('scope.owner!==userId||person.direction!=="accepted"||contactMutation.current'));
 assert.ok(confirm.includes("setPendingRemove({person,scope})"));
 assert.ok(confirm.includes("const request=pendingRemove,{person,scope}=request"));
 assert.ok(confirm.includes("await contactAction(person,undefined,scope)"));
 assert.ok(confirm.includes("current=>current===request?null:current"));
 assert.ok(mutation.includes("scopeRef.current?.session!==scope.session||scope.owner!==userId||contactMutation.current"));
 assert.ok(mutation.indexOf("contactMutation.current=operation")<mutation.indexOf("await captureMessageScope(scope)"));
 assert.ok(mutation.indexOf("await captureMessageScope(scope);if(!active())return false;")<mutation.indexOf("await removeContactRequest(person.requestId,scope)"));
 assert.ok(mutation.includes("contactMutation.current===operation&&scopeRef.current?.session===scope.session"));
 assert.ok(mutation.includes('finally{if(contactMutation.current===operation){contactMutation.current=null;setBusy("");}}'));
 assert.ok(network.includes('setSheet(false);setPendingRemove(null);contactMutation.current=null;setBusy("");setRows([]);setContactRows([]);'));
 assert.ok(network.includes('visible={sheet&&!pendingRemove}'));
 assert.ok(network.includes('visible={sheet&&pendingRemove!==null}'));
 assert.ok(network.includes('busy={!!busy} onCancel={()=>{if(!contactMutation.current)'));
});


test("Connection counts request only displayed aggregates once per focus and clear the old scope",()=>{
 const network=source("src/components/ProfileFollowCounts.tsx");
 const refresh=network.slice(network.indexOf(" const refreshCounts="),network.indexOf(" const isOwner="));
 assert.equal((refresh.match(/count:"exact"/g)??[]).length,1);
 assert.equal((refresh.match(/void refreshCounts\(\)/g)??[]).length,1);
 assert.ok(refresh.includes("contactCount(userId)"));
 assert.ok(refresh.includes("await assertMessageScope(scope)"));
 assert.ok(refresh.includes("setSummary(null)"));
 assert.ok(network.includes("summary?.target===userId?summary:null"));
 assert.ok(network.includes('item.value==null?"—"'));
});

test("About switches independently of the card and respects both public faces",()=>{
 const shared=source("src/components/ProfileSharedSections.tsx"),owner=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx");
 assert.ok(shared.includes("export function ProfileAboutSelector"));
 assert.ok(shared.includes("if(!personalAvailable||!businessAvailable)return null"));
 assert.ok(shared.includes("if(reducedMotion||!width)"));
 assert.ok(shared.includes("accessibilityState={{selected:side===option}}"));
 assert.ok(shared.includes("useNativeDriver:true"));
 assert.ok(owner.includes('mode==="cv"&&aboutSide==="personal"'));
 assert.ok(owner.includes("businessScope.current?.session===workspaceSession"));
 assert.ok(visitor.includes('aboutSide==="personal"&&cardVisibility.personal_enabled'));
 assert.ok(visitor.includes('aboutSide==="business"&&cardVisibility.business_enabled&&publicBusiness'));
 assert.ok(visitor.includes("businessAvailable={!!publicBusiness}"));
 const about=shared.slice(shared.indexOf("export function ProfileBusinessAbout"),shared.indexOf("export type ProfileTile"));
 assert.ok(!about.includes("fetch(")&&!about.includes("requireSupabase")&&!about.includes("business.email")&&!about.includes("business.phone"));
});


test("Business medals move to About on both profiles while legacy card previews keep their medal renderer",()=>{
 const card=source("src/components/JobinCard.tsx"),shared=source("src/components/ProfileSharedSections.tsx"),owner=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx"),cloud=source("src/lib/jcard-cloud.ts");
 assert.ok(card.includes("export function BusinessAwards"));
 assert.ok(card.includes("!awardsInAbout&&<BusinessAwards"));
 const ownCard=owner.match(/<JobinCard\b[^\n]*/)?.[0]??"";
 const visitorCard=visitor.match(/<JobinCard\b[^\n]*/)?.[0]??"";
 assert.match(ownCard,/\bawardsInAbout\s/);
 assert.match(visitorCard,/\bawardsInAbout\s/);
 assert.match(ownCard,/\bownerQuickActions=\{/);
 assert.match(visitorCard,/\bpublicVisibility=\{cardVisibility\}/);
 assert.match(ownCard,/\bprofileCoverScope=\{workspace\.scope\}/);
 assert.ok(!owner.includes("readBusinessExcellence("));
 assert.ok(shared.includes("readBusinessExcellence(target,origin)"));
 assert.ok(shared.includes("awardState.scope.session===scope?.session"));
 assert.ok(shared.includes("reviewCount:aggregate.excellenceReviewCount"));
 assert.ok(card.includes("standalone&&(!b||b.excellenceReviewCount===undefined||!b.excellenceVotes)"));
 const api=cloud.slice(cloud.indexOf("export async function readBusinessExcellence"),cloud.indexOf("/** Company handles"));
 assert.ok(api.includes("captureMessageScope(expectedScope)")&&api.includes("await assertMessageScope(scope)"));
 assert.ok(visitor.includes('cardVisibility.business_enabled&&publicBusiness&&<ProfileBusinessAbout'));
});


test("One connection provider renders both rotating faces without duplicate queries or exposing private lists",()=>{
 const network=source("src/components/ProfileFollowCounts.tsx"),card=source("src/components/JobinCard.tsx"),shared=source("src/components/ProfileSharedSections.tsx"),owner=source("src/app/(tabs)/profile.tsx"),visitor=source("src/app/jcard.tsx");
 assert.equal((card.match(/<ProfileConnectionCountRow /g)??[]).length,2);
 assert.ok(shared.includes("countsInCard>{card}</ProfileFollowCounts>"));
 assert.ok(network.includes("<ProfileCountContext.Provider value={{counts,isOwner,openList}}>"));
 assert.ok(network.includes("!countsInCard&&<ProfileConnectionCountRow/>"));
 assert.ok(network.includes("disabled={!isOwner}")&&network.includes("if(!isOwner)return;"));
 assert.ok(network.includes("captureMessageScope(expectedScope??undefined)"));
 assert.ok(network.includes("markInteractive?.()"));
 assert.ok(owner.includes("countsInCard expectedScope={workspace.scope}")&&visitor.includes("countsInCard expectedScope={publicScope}"));
 const view=network.slice(network.indexOf("export function ProfileConnectionCountRow"),network.indexOf("export function ProfileFollowCounts"));
 assert.ok(!view.includes("requireSupabase")&&!view.includes("contactCount("));
});


test("Profile connection state is reset synchronously on viewer session or target change",()=>{
 const network=source("src/components/ProfileFollowCounts.tsx");
 assert.ok(network.includes("JSON.stringify([props.userId,props.expectedScope?.owner??null,props.expectedScope?.session??null,!!props.countsInCard])"));
 assert.ok(network.includes("<ScopedProfileFollowCounts key={key} {...props}/>"));
 assert.ok(network.includes("if(!userId||(countsInCard&&!expectedScope))return;"));
});
