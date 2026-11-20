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
 assert.ok(business.includes('height:businessSections.footerHeight,flexShrink:0'));
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
