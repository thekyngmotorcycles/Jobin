import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readdirSync,readFileSync} from "node:fs";
import test from "node:test";
import ts from "typescript";
import {employmentBannerFamily} from "../src/lib/employment-banner.ts";
import {composite,contrastRatio,opacity} from "../src/theme/color.ts";
import {BANNER_PALETTES,EMPLOYMENT_ART,type BannerFamily} from "../src/theme/employment-art.ts";

const assetDir="assets/images/employment";
const manifest=JSON.parse(readFileSync(`${assetDir}/manifest.json`,"utf8")) as {
 name:string;official_categories:number;
 assets:{code:BannerFamily;file:string;bytes:number;sha256:string;fallback:boolean}[];
};
const component=readFileSync("src/components/EmploymentBanner.tsx","utf8");

test("The approved employment library contains the original WebPs for all catalog codes",()=>{
 assert.equal(manifest.name,"Jobin");
 assert.equal(manifest.official_categories,30);
 assert.equal(manifest.assets.length,31);
 assert.deepEqual(manifest.assets.filter(asset=>asset.fallback).map(asset=>asset.code),["generic"]);
 assert.deepEqual(manifest.assets.map(asset=>asset.code).sort(),Object.keys(BANNER_PALETTES).sort());
 assert.deepEqual(readdirSync(assetDir).sort(),["manifest.json",...manifest.assets.map(asset=>asset.file)].sort());

 for(const {code,file,bytes,sha256} of manifest.assets){
  assert.equal(file,`${code}.webp`);
  const data=readFileSync(`${assetDir}/${file}`);
  assert.equal(data.length,bytes,file);
  assert.equal(createHash("sha256").update(data).digest("hex"),sha256,file);
  assert.equal(data.toString("ascii",0,4),"RIFF",file);
  assert.equal(data.toString("ascii",8,12),"WEBP",file);
 }
});

type Element={type:unknown;props:Record<string,unknown>;key?:string};
type Render=(props:Record<string,unknown>)=>Element;
const {outputText}=ts.transpileModule(component,{compilerOptions:{
  target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,
 }});
function loadBanner(){
 let failed=false;
 const jsx=(type:unknown,props:Record<string,unknown>,key?:string)=>({type,props,key});
 const modules:Record<string,unknown>={
  react:{useId:()=>"fixture",useState:()=>[failed,(value:boolean)=>{failed=value;}]},
  "react/jsx-runtime":{jsx,jsxs:jsx},
  "react-native":{Image:"Image",View:"View",StyleSheet:{absoluteFillObject:{},create:(styles:unknown)=>styles}},
  "react-native-svg":{__esModule:true,default:"Svg"},
  "../theme/employment-art":{BANNER_PALETTES,EMPLOYMENT_ART},
 };
 const exports:Record<string,Render>={};
 new Function("require","exports",outputText)((name:string)=>{
  if(name in modules)return modules[name];
  assert.match(name,/^\.\.\/\.\.\/assets\/images\/employment\/[a-z_]+\.webp$/);
  return name;
 },exports);

 return (family:BannerFamily)=>{
  const banner=exports.EmploymentBanner({family});
  assert.equal(banner.key,family);
  const artwork=(banner.type as Render)(banner.props);
  const [background,scrim]=artwork.props.children as Element[];
  assert.equal((scrim.props.style as {opacity:number}).opacity,EMPLOYMENT_ART.scrimOpacity);
  return background;
 };
}

test("Employment banners bundle the mapped image and fall back to the local vector on error",()=>{
 for(const {code,file} of manifest.assets){
  const render=loadBanner();
  const image=render(code);
  assert.equal(image.type,"Image");
  assert.equal(image.props.source,`../../${assetDir}/${file}`);
  (image.props.onError as ()=>void)();
  const fallback=render(code);
  assert.equal((fallback.type as Render)(fallback.props).type,"Svg");
 }
});

test("Unresolved history uses the neutral image and preserves normal-text contrast",()=>{
 const family=employmentBannerFamily("Oficio sin identificar",["missing"],[]);
 assert.equal(family,"generic");
 assert.equal(loadBanner()(family).props.source,`../../${assetDir}/generic.webp`);

 const brightest=composite(opacity(EMPLOYMENT_ART.tone38,EMPLOYMENT_ART.scrimOpacity),"#ffffff");
 for(const color of [EMPLOYMENT_ART.tone37,EMPLOYMENT_ART.tone41,EMPLOYMENT_ART.tone42,EMPLOYMENT_ART.tone43]){
  assert.ok(contrastRatio(color,brightest)>=4.5);
 }
});
