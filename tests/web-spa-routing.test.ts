import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
test("Real web development build serves Expo SPA routes without intercepting assets or APIs",()=>{
 const config=JSON.parse(readFileSync("vercel.json","utf8"));
 const app=JSON.parse(readFileSync("app.json","utf8"));
 assert.equal(app.expo.web.output,"single");
 assert.equal(config.buildCommand,"npm run export:web");
 assert.equal(config.outputDirectory,"dist");
 assert.equal(config.git.deploymentEnabled.development,true);
 const rule=config.rewrites[0];
 assert.equal(rule.destination,"/index.html");
 const matcher=new RegExp("^"+rule.source+"$");
 for(const p of ["/","/profile","/login","/jcard","/post/123","/settings/cuenta"])assert.ok(matcher.test(p),p);
 for(const p of ["/_expo/static/js/web/entry.js","/assets/a","/api/status","/favicon.ico","/index.html"])assert.ok(!matcher.test(p),p);
});
