import { createHmac,timingSafeEqual } from "node:crypto";
import { parseModerationResult,type ModerationResult } from "./contracts.ts";
export function verifyWebhook(raw:Buffer,timestamp:string|undefined,signature:string|undefined,secret:string,now=Date.now()):ModerationResult {
 if(!secret||!timestamp||!/^\d{10}$/.test(timestamp)||!signature||!/^sha256=[0-9a-f]{64}$/i.test(signature))throw new Error("Invalid webhook signature");
 if(Math.abs(now-Number(timestamp)*1000)>300000)throw new Error("Expired webhook");
 const expected=createHmac("sha256",secret).update(timestamp+".").update(raw).digest();
 const supplied=Buffer.from(signature.slice(7),"hex");
 if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))throw new Error("Invalid webhook signature");
 return parseModerationResult(JSON.parse(raw.toString("utf8")));
}
