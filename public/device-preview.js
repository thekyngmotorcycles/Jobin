"use strict";
const sizes={iphone:[402,874],galaxy:[360,780],jelly:[320,569]};
const allowedPages=new Set(["/profile","/","/videos","/shop","/inbox"]);
const device=document.getElementById("device"),page=document.getElementById("page"),phone=document.getElementById("phone"),shell=document.getElementById("shell"),stage=document.getElementById("stage"),dimensions=document.getElementById("dimensions");
const params=new URLSearchParams(location.search);
if(Object.hasOwn(sizes,params.get("device")))device.value=params.get("device");
if(allowedPages.has(params.get("page")))page.value=params.get("page");
function size(){const [w,h]=sizes[device.value];const scale=Math.min(1,Math.max(.1,(stage.clientWidth-4)/w));phone.style.width=w+"px";phone.style.height=h+"px";phone.style.transform="scale("+scale+")";shell.style.width=w*scale+"px";shell.style.height=h*scale+"px";dimensions.textContent=w+" × "+h+" CSS px · escala de vista "+Math.round(scale*100)+"%";}
function navigate(){phone.src=allowedPages.has(page.value)?page.value:"/profile";}
device.addEventListener("change",size);page.addEventListener("change",navigate);document.getElementById("reload").addEventListener("click",navigate);window.addEventListener("resize",size);size();navigate();