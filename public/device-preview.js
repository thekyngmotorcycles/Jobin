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
function navigate(){const selected=allowedPages.has(page.value)?page.value:"/profile";phone.setAttribute("data-preview-page",selected);phone.src=selected;persist();}
document.getElementById("login").addEventListener("click",()=>{
 try{sessionStorage.setItem("jobeen:viewer-return:v1",JSON.stringify({created:Date.now(),device:device.value,width:Number(width.value),page:page.value}));location.assign("/");}
 catch{alert("No se pudo conservar la vista. Habilita el almacenamiento del navegador y vuelve a intentar.");}
});
device.addEventListener("change",()=>selectPreset(device.value));
width.addEventListener("input",()=>{size();persist();});
for(const button of presets)button.addEventListener("click",()=>selectPreset(button.dataset.preset));
page.addEventListener("change",navigate);document.getElementById("reload").addEventListener("click",navigate);window.addEventListener("resize",size);size();navigate();

// Scroll only the outer page; never forward input into the application iframe.
const outer=document.getElementById("viewer-scroll"),up=document.getElementById("viewer-up"),down=document.getElementById("viewer-down");
function updateOuterControls(){up.disabled=outer.scrollTop<=1;down.disabled=outer.scrollTop+outer.clientHeight>=outer.scrollHeight-1;}
function scrollOuter(direction){const distance=Math.max(48,Math.round(outer.clientHeight*.55));outer.scrollBy({top:direction*distance,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});}
up.addEventListener("click",()=>scrollOuter(-1));down.addEventListener("click",()=>scrollOuter(1));outer.addEventListener("scroll",updateOuterControls,{passive:true});window.addEventListener("resize",updateOuterControls);if(typeof ResizeObserver!=="undefined"){const observer=new ResizeObserver(updateOuterControls);observer.observe(outer);observer.observe(shell);}updateOuterControls();
