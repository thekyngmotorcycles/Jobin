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
 assert.ok(home.includes('const cached=await readScopedBusinessCard(owner)'));
 assert.ok(home.indexOf('const cached=await readScopedBusinessCard(owner)')<home.indexOf('const row=await readCloudBusiness();'));
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
 assert.ok(profile.includes('style={{position:"absolute",top:10,left:0,right:0,height:NAVIGATION_ROW_HEIGHT'));
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
 assert.ok(sheet.includes('cardType=side==="business"?"JCard de negocios":"JCard personal"'));
 assert.ok(sheet.includes('{showQr?"Mi código QR":cardType}'));
 assert.ok(!sheet.includes('>Compartir {label}</Text>'));
 assert.ok(business.includes('side={shareSide??(back?"business":"personal")}'));
});
test("More options invokes Android native share chooser after closing custom sheet",()=>{
 const sheet=src("src/components/JCardShareSheet.tsx");
 assert.ok(sheet.includes('{id:"more",label:"Más opciones"'));
 assert.ok(sheet.includes('nativeSharePending.current=true'));
 assert.ok(sheet.includes('if(Platform.OS==="android"){dismiss();setTimeout(()=>void shareNative(),400);return;}'));
 assert.ok(sheet.includes('onDismiss={()=>{if(nativeSharePending.current)'));
 assert.ok(sheet.includes('Share.share({message,title:cardType+" · "+label})'));
 assert.ok(sheet.includes("Para ver los contactos sugeridos y todas las apps instaladas"));
 assert.ok(sheet.indexOf('{id:"qr",label:"Mi QR"')<sheet.indexOf('{id:"whatsapp",label:"WhatsApp"'));
});

test("Shared avatars use a Jobeen gold framed rounded square, including owner and visitor",()=>{
 const shared=src("src/components/social-ui.tsx");
 const account=src("src/components/AccountAvatar.tsx");
 const publicAvatar=src("src/components/PublicProfileAvatar.tsx");
 assert.ok(shared.includes('const corner=Math.max(6,Math.round(size*0.2))'));
 assert.ok(shared.includes('borderColor:t.yellow'));
 assert.ok(shared.includes('width:"100%",height:"100%",borderRadius:Math.max(4,corner-border-2)'));
 assert.ok(!shared.includes('borderRadius:size/2'));
 assert.ok(account.includes('<Avatar uri={identity?.avatar'));
 assert.ok(publicAvatar.includes('<Avatar uri={uri}'));
});
test("Story rings are rounded squares with gold stroke for owner and visitors",()=>{
 const stories=src("src/components/StoryStrip.tsx");
 assert.equal(stories.split('width:66,height:66,borderRadius:16,borderWidth:2,borderColor:t.yellow').length-1,2);
 assert.ok(stories.includes('<PublicProfileAvatar userId={userId}'));
 assert.ok(stories.includes('<PublicProfileAvatar userId={story.authorId}'));
 assert.ok(!stories.includes('borderRadius:33'));
});
test("JCard personal and business photos have matching softened gold corners",()=>{
 assert.ok(business.includes('borderRadius:18,borderWidth:3,borderColor:jobeen.yellow'));
 assert.ok(business.includes('width:64,height:64,borderRadius:14,borderWidth:2,borderColor:jobeen.yellow'));
 assert.ok(business.includes('width:60,height:60,borderRadius:11'));
 assert.ok(!business.includes('borderRadius:32,borderWidth:2,borderColor:jobeen.yellow'));
});

test("Nested JCard and story photos use a single clean gold frame, not doubled borders",()=>{
 const shared=src("src/components/social-ui.tsx");
 const publicAvatar=src("src/components/PublicProfileAvatar.tsx");
 const stories=src("src/components/StoryStrip.tsx");
 assert.ok(shared.includes("framed=true"));
 assert.ok(shared.includes("const border=framed?Math.max"));
 assert.ok(publicAvatar.includes("framed={framed}"));
 assert.equal(stories.split("framed={false}").length-1,2);
 assert.ok(business.includes('size={theme==="light"?80:jcardLayout.avatar} framed={false}'));
});
