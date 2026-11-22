import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(path,"utf8");
const sheet=source("src/components/JCardShareSheet.tsx");

test("All sharing contexts reuse the original rounded Jobeen share surface",()=>{
 assert.ok(sheet.includes("export const JobeenShareSheet=JCardShareSheet"));
 assert.ok(sheet.includes("borderTopLeftRadius:modal.radius.sheet,borderTopRightRadius:modal.radius.sheet"));
 assert.ok(sheet.includes('animationType="slide"'));
 assert.ok(sheet.includes("contentTitle,contentMessage,onShared,onError"));
 assert.ok(sheet.includes('const shareTitle=contentTitle??"Compartir "+cardType'));
 for(const path of [
  "src/components/ProfileCommunityActions.tsx",
  "src/components/HomePublishedPosts.tsx",
  "src/components/PostCard.tsx",
  "src/components/FeedVideo.tsx",
  "src/app/jshop/item/[id].tsx",
  "src/app/(tabs)/profile.tsx",
 ]){
  const page=source(path);
  assert.ok(page.includes("<JobeenShareSheet"),path+" must show the shared branded share panel");
  assert.ok(!page.includes("Share.share("),path+" must not open native chooser directly");
 }
 assert.ok(source("src/components/JobinCard.tsx").includes("<JCardShareSheet"),"The approved JCard buttons retain the same base panel");
});

test("Universal chooser keeps messaging apps and native system share behind More options",()=>{
 for(const item of ['{id:"whatsapp",label:"WhatsApp"','{id:"sms",label:"SMS"','{id:"more",label:"Más opciones"'])
  assert.ok(sheet.includes(item));
 assert.ok(sheet.includes("https://wa.me/?text="));
 assert.ok(sheet.includes("sms:?body="));
 assert.ok(sheet.includes("nativeSharePending.current=true"));
 assert.ok(sheet.includes('if(Platform.OS==="android"){dismiss();timer.current=setTimeout(()=>void shareNative(),400);return;}'));
 assert.ok(sheet.includes("onDismiss={()=>{if(nativeSharePending.current)"));
 assert.ok(sheet.includes("await Share.share({message:task.message,title:task.title"));
 assert.ok(sheet.includes("if(result.action===Share.sharedAction&&await verifyDeferred(task))onShared?.()"));
});

test("QR is offered for real links, never for CV or text-only demo posts",()=>{
 assert.ok(sheet.includes('item.id!=="qr"||!!link.trim()'));
 assert.ok(sheet.includes('if(action==="qr"){if(link.trim())setShowQr(true);return;}'));
 assert.ok(sheet.includes('<QRCode value={link}'));
 const cv=source("src/app/(tabs)/profile.tsx");
 assert.ok(cv.includes('contentTitle="Compartir CV"'));
 assert.ok(!cv.includes("link={cv"));
 const demo=source("src/components/PostCard.tsx");
 assert.equal(demo.split("<JobeenShareSheet").length-1,2);
 assert.ok(demo.includes('contentTitle="Compartir video"'));
});

test("Public profile closes its existing menu before opening the branded share panel",()=>{
 const profile=source("src/components/ProfileCommunityActions.tsx");
 assert.ok(profile.includes('onMenuClose?.();setTimeout(()=>setShareOpen(true),350);'));
 assert.ok(profile.includes('contentTitle="Compartir perfil"'));
 assert.ok(profile.includes('link={url}'));
 assert.ok(!profile.includes('void Share.share('));
 assert.ok(profile.includes('"Bloquear perfil"'),"Keep existing block actions");
 assert.ok(profile.includes("Denunciar perfil"),"Keep existing report actions");
});

test("Published feed keeps share counts confirmed and avoids overlapping action sheets",()=>{
 const home=source("src/components/HomePublishedPosts.tsx");
 assert.ok(home.includes("setOptionsOpen(false);"));
 assert.ok(home.includes("shareTimer.current=setTimeout(()=>{void captureMessageScope(scope).then(()=>{if(live(scope))setShareOpen(true);}).catch(()=>{});},350)"));
 assert.ok(home.includes("if(shareTimer.current)clearTimeout(shareTimer.current)"));
 assert.ok(home.includes("onShared={()=>void confirmNativeShare()}"));
 assert.ok(home.includes("await recordHomePostShare(post.id,scope)"));
 assert.ok(home.includes("setShares(n=>n+1)"));
 assert.ok(home.includes('Linking.createURL("post/"+post.id)'));
 const options=source("src/components/FeedPostOptions.tsx");
 assert.ok(options.includes('"Compartir enlace"'));
});

test("Video, JShop and CV sharing retain their original contextual data",()=>{
 const video=source("src/components/FeedVideo.tsx");
 const listing=source("src/app/jshop/item/[id].tsx");
 const cv=source("src/app/(tabs)/profile.tsx");
 assert.ok(video.includes("clip.video"));
 assert.ok(video.includes("onShared={()=>social.addShare(clip.postId)}"));
 assert.ok(listing.includes('formatJShopPrice(listing.price,listing.currency)'));
 assert.ok(listing.includes('Linking.createURL("/jshop/item/"+listing.id)'));
 assert.ok(cv.includes('history.map(e=>'));
 assert.ok(cv.includes('onError={setNotice}'));
});
