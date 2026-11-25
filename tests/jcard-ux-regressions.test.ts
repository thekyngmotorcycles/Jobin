import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
const editor=src("src/app/jcard-business-edit.tsx");
const business=src("src/components/JobinCard.tsx");
const home=src("src/app/(tabs)/profile.tsx");
const profile=src("src/app/jcard.tsx");
const actions=src("src/components/ProfileCommunityActions.tsx");
const routes=src("src/app/_layout.tsx");
const message=src("src/app/message.tsx");
test("Editable business usernames display the @ sign but are stored normalized",()=>{
 assert.ok(editor.includes('key==="businessHandle"?"@"+(data.businessHandle??"")'));
 assert.ok(editor.includes('value.replace(/^@+/,"").toLowerCase()'));
 assert.ok(editor.includes('maxLength={key==="businessHandle"?31'));
 assert.ok(editor.includes('BUSINESS_HANDLE_PATTERN'));
});
test("Services use a raw text buffer until save to prevent rewriting at each comma",()=>{
 assert.ok(editor.includes('const [servicesInput,setServicesInput]=useState("")'));
 assert.ok(editor.includes('if(key==="services"){setServicesInput(value);return;}'));
 assert.ok(editor.includes('key==="services"?servicesInput'));
 assert.ok(editor.includes('const parsedServices=servicesInput.split(",").map(v=>v.trim()).filter(Boolean)'));
 assert.ok(editor.includes('key==="services"?parsedServices'));
 assert.ok(!editor.includes('key==="services"?value.split(",").map'));
});
test("Business card groups contacts between heading and non-overlapping medals without shrinking touch targets",()=>{
 assert.ok(business.includes('borderBottomColor:finish.line,flexShrink:0'));
 assert.ok(business.includes('height:64,flexShrink:0'));
 assert.ok(business.includes('minHeight:44,paddingRight:3'));
 assert.ok(business.includes('minHeight:44,paddingRight:5'));
 assert.ok(business.includes('minimumFontScale={0.84}'));
 assert.ok(business.includes('businessName?wrapBusinessCardName(businessName):"Cargando negocio…"'));
 assert.ok(home.includes('const cached=await readScopedBusinessCard(owner,scope)'));
 const cachedIndex=home.indexOf('const cached=await readScopedBusinessCard(owner,scope)');
 const cloudIndex=home.indexOf('const row=await readCloudBusiness(owner,scope);');
 assert.ok(cachedIndex>=0&&cloudIndex>cachedIndex,'Scoped cache precedes owner-validated cloud refresh');
});
test("Personal contact button is raised clear of language badges without resizing the card",()=>{
 assert.ok(business.includes('marginBottom:theme==="light"?12:0,transform:[{translateY:theme==="light"?-6:0}]'));
 assert.ok(business.includes('const {height:cardHeight}=jcardSurfaceSize('));
});
test("Conversation uses exactly one screen header for the recipient",()=>{
 assert.ok(routes.includes('<Stack.Screen name="message" options={{headerShown:false}}/>'));
 assert.ok(message.includes('{name||"Mensaje"}'));
 assert.ok(message.includes('accessibilityLabel="Volver"'));
});
test("Public profile has the lowered header and only three bottom actions",()=>{
 assert.ok(profile.includes('top:insets.top,left:0,right:0,zIndex:10,height:NAVIGATION_ROW_HEIGHT'));
 assert.ok(profile.includes('accessibilityLabel="Opciones del perfil"'));
 assert.ok(profile.includes('menuOpen={profileMenuOpen} onMenuClose={()=>setProfileMenuOpen(false)}'));
 assert.ok(actions.includes('width:52,height:52'));
 assert.ok(actions.includes('<Ionicons name="paper-plane-outline" size={22}'));
 assert.ok(!actions.includes('fontWeight:"700",fontSize:12}}>Mensaje</Text>'));
 assert.ok(actions.includes('<Modal visible={menuOpen}'));
 assert.ok(!actions.includes('setMenu(v=>!v)'));
});

test("Approved share window is a branded bottom sheet with QR before WhatsApp",()=>{
 const sheet=src("src/components/JCardShareSheet.tsx");
 assert.ok(sheet.indexOf('{id:"qr",label:"Mi QR"')<sheet.indexOf('{id:"whatsapp",label:"WhatsApp"'));
 assert.ok(sheet.includes('animationType="slide"'));
 assert.ok(sheet.includes('height:5,borderRadius:3'));
 assert.ok(sheet.includes('onPress={()=>choose(option.id)}'));
 assert.ok(sheet.includes("https://wa.me/?text="));
 assert.ok(sheet.includes("Share.share({message"));
 assert.ok(sheet.includes('<QRCode value={link}'));
});
test("Personal and business QR are available only via Share JCard",()=>{
 assert.ok(business.includes('<JCardShareSheet visible={shareSide!==null}'));
 assert.ok(business.includes('link={sideLink(shareSide??(back?"business":"personal"))}'));
 assert.ok(!business.includes('accessibilityLabel="Ampliar código QR personal"'));
 assert.ok(!business.includes('accessibilityLabel="Ampliar código QR del negocio"'));
 assert.ok(!business.includes('Share.share({message:'));
});
test("Own profile removes upper left wordmark without changing actions",()=>{
 assert.ok(!home.includes("<JobinWordmark"));
 assert.ok(home.includes("<JobeenCreateMenu/>"));
 assert.ok(home.includes("<NotificationBell/>"));
 assert.ok(home.includes('accessibilityLabel="Opciones del perfil"'));
});

test("Share sheet identifies personal/business JCard without duplicate name text",()=>{
 const sheet=src("src/components/JCardShareSheet.tsx");
 assert.ok(sheet.includes('cardType=side==="business"?"JCard de negocio":"JCard personal"'));
 assert.ok(sheet.includes('{showQr?qrHeading:shareTitle}'));
  assert.ok(sheet.includes('contentTitle?"Código QR":"Mi código QR"'));
  assert.ok(sheet.includes('const shareTitle=contentTitle??"Compartir "+cardType'));
  assert.ok(sheet.includes("const message=contentMessage??("));
 assert.ok(!sheet.includes('>Compartir {label}</Text>'));
 assert.ok(business.includes('side={shareSide??(back?"business":"personal")}'));
});
test("More options invokes Android native share chooser after closing custom sheet",()=>{
 const sheet=src("src/components/JCardShareSheet.tsx");
 assert.ok(sheet.includes('{id:"more",label:"Más opciones"'));
 assert.ok(sheet.includes('nativeSharePending.current=true'));
 assert.ok(sheet.includes('if(Platform.OS==="android"){dismiss();timer.current=setTimeout(()=>void shareNative(),400);return;}'));
 assert.ok(sheet.includes('onDismiss={()=>{if(nativeSharePending.current)'));
 assert.ok(sheet.includes('Share.share({message:task.message,title:task.title})'));
 assert.ok(sheet.includes('if(result.action===Share.sharedAction&&await verifyDeferred(task))onShared?.()'));
 assert.ok(!sheet.includes("Para ver los contactos sugeridos y todas las apps instaladas"));
 assert.ok(sheet.indexOf('{id:"qr",label:"Mi QR"')<sheet.indexOf('{id:"whatsapp",label:"WhatsApp"'));
});

test("Shared avatars are circular by default with the Jobeen gold ring in every small-profile context",()=>{
 const shared=src("src/components/social-ui.tsx");
 const account=src("src/components/AccountAvatar.tsx");
 const publicAvatar=src("src/components/PublicProfileAvatar.tsx");
 assert.ok(shared.includes('shape="circle"'));
 assert.ok(shared.includes('shape==="circle"?size/2'));
 assert.ok(shared.includes('borderColor:t.yellow'));
 assert.ok(shared.includes('height,width:size'));
 assert.ok(account.includes('<Avatar uri={identity?.avatar'));
 assert.ok(publicAvatar.includes('<Avatar uri={batched?personalAvatarUrl(avatarPath):uri}'));
 assert.ok(publicAvatar.includes('shape={shape}'));
 assert.ok(src("src/components/HomePublishedPosts.tsx").includes('<PublicProfileAvatar userId={post.authorId}'));
 assert.ok(src("src/app/(tabs)/inbox.tsx").includes('<AccountAvatar accountId={thread.id}'));
});
test("Stories are 20 percent taller portrait cards with one Jobeen gold keyline",()=>{
 const stories=src("src/components/StoryStrip.tsx");
 assert.equal(stories.split('width:66,height:79,borderRadius:16,borderWidth:2,borderColor:t.yellow').length-1,2);
 assert.equal(stories.split('height={65} shape="portrait" framed={false}').length-1,2);
 assert.ok(stories.includes('top:54,width:25,height:25'));
});
test("JCard portraits keep their vertical proportions but no permanent gold frame",()=>{
 assert.ok(business.includes('height={theme==="light"?88:jcardLayout.avatar*1.1} shape="portrait" framed={false}'));
 assert.ok(business.includes('width:theme==="light"?90:jcardLayout.avatar+10,height:theme==="light"?99:jcardLayout.avatar*1.1+10,borderRadius:14'));
 assert.ok(!business.includes('borderRadius:18,borderWidth:3,borderColor:jobeen.yellow'));
 assert.ok(business.includes('width:64,height:70.4,borderRadius:14,backgroundColor:jobeen.surface'));
 assert.ok(!business.includes('borderRadius:14,borderWidth:2,borderColor:jobeen.yellow'));
 assert.ok(!business.includes("JCARD_WORDMARK_XML"));
 assert.ok(business.includes('width:60,height:66,borderRadius:11'));
});
test("Story frames remain unchanged; JCard portraits are unframed and ordinary avatars stay circular",()=>{
 const shared=src("src/components/social-ui.tsx");
 const publicAvatar=src("src/components/PublicProfileAvatar.tsx");
 const stories=src("src/components/StoryStrip.tsx");
 assert.ok(shared.includes("framed=true"));
 assert.ok(shared.includes("const border=framed?Math.max"));
 assert.ok(publicAvatar.includes("framed={framed}"));
 assert.equal(stories.split("framed={false}").length-1,2);
 assert.ok(business.includes('shape="portrait" framed={false}'));
 assert.ok(src("src/components/HomePublishedPosts.tsx").includes('<PublicProfileAvatar userId={comment.authorId}'));
});

test("Royal Hive editor warnings preserve private contact defaults and prevent hiding the last active JCard",()=>{
 const personal=src("src/app/professional.tsx");
 const businessEditor=src("src/app/jcard-business-edit.tsx");
 const dialog=src("src/components/JobeenNoticeDialog.tsx");
 assert.ok(personal.includes('useState({show_email:false,show_phone:false})'));
 assert.ok(personal.includes('if(visibility.personal_enabled&&!visibility.business_enabled){setVisibilityWarning(true);return;}'));
 assert.ok(businessEditor.includes('if(item.key==="business_enabled"&&visibility.business_enabled&&!visibility.personal_enabled){setVisibilityWarning(true);return;}'));
 assert.ok(personal.includes('visible={!!w&&visibilityWarning&&!unsavedDialogOpen&&!removeRequest}'));
 assert.ok(businessEditor.includes('visible={!!editorScope&&visibilityWarning}'));
 for(const screen of [personal,businessEditor]){
  assert.ok(screen.includes('tone="warning" singleAction onConfirm={()=>setVisibilityWarning(false)}'));
  assert.ok(!screen.includes('Alert.alert('));
 }
 assert.ok(dialog.includes('{!singleAction&&<Button title={cancelLabel}'));
 assert.ok(personal.includes('await saveContactPreferences({show_email:showEmail,show_phone:showPhone},owner,origin)'));
 assert.ok(personal.includes('await saveJCardVisibility(visibility,owner,origin)'));
 assert.ok(businessEditor.includes('await saveJCardVisibility(visibility,editorOwner,origin)'));
});

test("Standard form pages preserve editor identity, privacy and unsaved-change handling",()=>{
 const personal=src("src/app/professional.tsx");
 assert.ok(personal.includes('<PageFrame kind="form" scrollRef={scrollRef}>'));
 assert.ok(personal.includes('usePreventRemove(hasUnsavedChanges||professionFormOpen'));
 assert.ok(personal.includes('saveJCardVisibility(visibility,owner,origin)'));
 assert.ok(editor.includes('<PageFrame kind="form">'));
 assert.ok(editor.includes('saveJCardVisibility(visibility,editorOwner,origin)'));
 assert.ok(editor.includes('writeCloudBusiness(clean,editorOwner,origin)'));
});
