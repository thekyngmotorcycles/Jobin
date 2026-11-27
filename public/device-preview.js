"use strict";
const sizes={standard:[390,844],iphone:[402,874],galaxy:[360,780],jelly:[320,569],wide:[440,952]};
const allowedPages=new Set(["/profile","/","/videos","/shop","/inbox"]);
const device=document.getElementById("device"),page=document.getElementById("page"),phone=document.getElementById("phone"),shell=document.getElementById("shell"),stage=document.getElementById("stage"),dimensions=document.getElementById("dimensions"),width=document.getElementById("width"),widthValue=document.getElementById("width-value");
const presets=[...document.querySelectorAll("[data-preset]")];
const params=new URLSearchParams(location.search);
if(Object.hasOwn(sizes,params.get("device")))device.value=params.get("device");
if(allowedPages.has(params.get("page")))page.value=params.get("page");
function clampWidth(value,fallback){const n=Number(value);return value!==null&&value!==""&&Number.isFinite(n)?Math.max(320,Math.min(440,Math.round(n))):fallback;}
width.value=String(clampWidth(params.get("width"),sizes[device.value][0]));
function persist(){
 const url=new URL(location.href);url.searchParams.set("device",device.value);url.searchParams.set("width",width.value);url.searchParams.set("page",page.value);
 history.replaceState(history.state,"",url.pathname+url.search+url.hash);
}
function size(){
 const [referenceWidth,referenceHeight]=sizes[device.value];
 const w=clampWidth(width.value,referenceWidth),h=Math.round(w*referenceHeight/referenceWidth);
 const scale=Math.min(1,Math.max(.1,(stage.clientWidth-4)/w));
 width.value=String(w);widthValue.textContent=w+" px";
 phone.style.width=w+"px";phone.style.height=h+"px";phone.style.transform="scale("+scale+")";
 shell.style.width=w*scale+"px";shell.style.height=h*scale+"px";
 dimensions.textContent=w+" × "+h+" CSS px · escala de vista "+Math.round(scale*100)+"%"+(w!==referenceWidth?" · proporción de referencia ajustada":"");
 for(const button of presets)button.setAttribute("aria-pressed",String(button.dataset.preset===device.value&&w===referenceWidth));
}
function selectPreset(key){if(!Object.hasOwn(sizes,key))return;device.value=key;width.value=String(sizes[key][0]);size();persist();}
function navigate(){phone.src=allowedPages.has(page.value)?page.value:"/profile";persist();}
device.addEventListener("change",()=>selectPreset(device.value));
width.addEventListener("input",()=>{size();persist();});
for(const button of presets)button.addEventListener("click",()=>selectPreset(button.dataset.preset));
page.addEventListener("change",navigate);document.getElementById("reload").addEventListener("click",navigate);window.addEventListener("resize",size);size();navigate();
