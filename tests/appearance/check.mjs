import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile,stat,mkdir,writeFile } from "node:fs/promises";
import { resolve,extname } from "node:path";
import assert from "node:assert/strict";
const root=resolve("dist");
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".ttf":"font/ttf",".woff":"font/woff",".woff2":"font/woff2"};
const server=createServer(async(req,res)=>{try{let file=resolve(root,"."+decodeURIComponent(new URL(req.url,"http://localhost").pathname));if(!file.startsWith(root+"/")&&file!==root){res.writeHead(403).end();return;}try{if(!(await stat(file)).isFile())file=resolve(root,"index.html");}catch{file=resolve(root,"index.html");}res.setHeader("Content-Type",mime[extname(file)]||"application/octet-stream");res.end(await readFile(file));}catch{res.writeHead(500).end();}});
await new Promise(done=>server.listen(4173,"127.0.0.1",done));
await mkdir("appearance-results",{recursive:true});
const browser=await chromium.launch();
const themes=[["light","Light","#000000"],["dark","Dark","#ffffff"],["pink","Pink","#54243a"],["navy-green","Navy Green","#35530a"],["camel","Camel","#5b4a47"]];
const pages=[["Home","/",true],["Live","/streams",true],["Videos","/videos",true],["Mensajes","/inbox",true],["Perfil","/profile",true],["Configuración","/settings"],["Inicio de sesión","/account"],["Subir","/create",true],["Buscar","/search"],["Servicios","/services"],["Comunidades","/communities"],["Empresa","/company"],["Profesional","/professional"],["Certificados","/certificates"],["Revisión de certificados","/credential-review"],["Oportunidades","/opportunities"],["Seguridad","/safety"],["Revisión de seguridad","/safety-review"],["Términos","/terms"],["JCard sin sesión","/jcard"],["Live sin sesión","/live"],["Sala de live","/stream/design-studio"],["Video sin sesión","/work-media/00000000-0000-0000-0000-000000000000"]];
const results=[];let failed=0;
try{
 for(const [theme,label,ink] of themes){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(value=>localStorage.setItem("jobin.theme",value),theme);
  const page=await context.newPage();
  for(const [screen,path,tabs] of pages){
   const result={screen,theme:label,path};
   try{
    await page.goto("http://127.0.0.1:4173"+path,{waitUntil:"domcontentloaded"});
    await page.waitForTimeout(750);
    await page.locator("body").filter({hasText:/./}).waitFor();
    assert.equal(await page.getByText(/Something went wrong|Uncaught Error/).count(),0,"No render crash");
    const marks=page.getByTestId("jobin-wordmark");const count=await marks.count();
    result.wordmark=count?"visible":"not present in existing layout";
    for(let i=0;i<count;i++){const mark=marks.nth(i);await mark.waitFor({state:"visible"});const shape=mark.locator("svg path").first();assert.ok(await shape.count(),"Vector paths");const fill=await shape.evaluate(el=>getComputedStyle(el).fill);const expected=await page.evaluate(hex=>{const el=document.createElement("span");el.style.color=hex;document.body.append(el);const color=getComputedStyle(el).color;el.remove();return color;},ink);assert.equal(fill,expected,"Wordmark uses theme foreground");assert.equal(await mark.evaluate(el=>Number.parseFloat(getComputedStyle(el).backgroundColor.split(",").at(-1))),0,"Wordmark background alpha is zero");}
    if(tabs){for(const name of ["index","streams","videos","inbox","profile"])await page.getByTestId("tab-"+name).waitFor({state:"visible"});const nav=await page.getByTestId("tab-index").evaluate(el=>{let node=el.parentElement;while(node&&!["streams","videos","inbox","profile"].every(name=>node.querySelector('[data-testid="tab-'+name+'"]')))node=node.parentElement;if(!node)throw new Error("Missing navigation container");const checked=[];while(node&&node.getBoundingClientRect().height<=100){const s=getComputedStyle(node);checked.push({background:s.backgroundColor,border:s.borderTopWidth,shadow:s.boxShadow});node=node.parentElement;}return checked;});assert.ok(nav.length,"Navigation styles measured");for(const s of nav){assert.equal(Number.parseFloat(s.background.split(",").at(-1)),0,"Transparent navigation background");assert.equal(s.border,"0px");assert.equal(s.shadow,"none");}result.navigation="transparent, no border/shadow, five visible icons";}else result.navigation="not part of this route";
    const ai=page.getByTestId("home-ai-assistant");
    assert.equal(await ai.count(),path==="/"?1:0,"AI only on Home");
    result.ai=path==="/"? "visible":"absent";
    await page.screenshot({path:"appearance-results/"+theme+"-"+screen.replaceAll(/[^a-zA-Z0-9]/g,"_")+".png"});
    result.status="PASS";
   }catch(error){failed++;result.status="FAIL";result.error=String(error);await page.screenshot({path:"appearance-results/failure-"+theme+"-"+results.length+".png"}).catch(()=>{});}
   results.push(result);console.log(JSON.stringify(result));
  }
  await context.close();
 }
 // Actual interaction: choose theme, reload, drag/snap, restore and rotate.
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
 await page.goto("http://127.0.0.1:4173/settings");await page.getByText("Camel",{exact:true}).click();
 assert.equal(await page.evaluate(()=>localStorage.getItem("jobin.theme")),"camel");
 await page.reload();await page.getByTestId("jobin-wordmark").waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem("jobin.theme")),"camel");
 await page.goto("http://127.0.0.1:4173/");const ai=page.getByTestId("home-ai-assistant");await ai.waitFor();await page.waitForTimeout(500);
 let box=await ai.boundingBox();assert.ok(box.width>=48&&box.height>=48);
 await ai.click();assert.equal(new URL(page.url()).pathname,"/");
 await page.mouse.move(box.x+28,box.y+28);await page.mouse.down();await page.mouse.move(40,360,{steps:20});await page.mouse.up();await page.waitForTimeout(1000);
 box=await ai.boundingBox();assert.ok(box.x<=12,"Snaps to left edge");
 const saved=await page.evaluate(()=>localStorage.getItem("jobin.assistant.position.v1"));assert.equal(JSON.parse(saved).edge,"left");
 await page.reload();await ai.waitFor();await page.waitForTimeout(500);box=await ai.boundingBox();assert.ok(box.x<=12,"Restores position");
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);box=await ai.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=844&&box.y+box.height<=390-58,"Rotation respects visible bounds and bottom navigation");
 results.push({screen:"Interactions",theme:"Camel",status:"PASS",ai:"drag, snap, tap no-op, restore, rotate",persistence:"PASS"});await context.close();
}catch(error){failed++;results.push({screen:"Interactions",status:"FAIL",error:String(error)});console.error(error);}
finally{await writeFile("appearance-results/matrix.json",JSON.stringify(results,null,2));await browser.close();await new Promise(done=>server.close(done));}
if(failed)throw new Error(failed+" appearance checks failed; see matrix.json and screenshots");
