import {createCoverReader} from "./handler.ts";
declare const Deno:{env:{get(name:string):string|undefined};serve(handler:(req:Request)=>Promise<Response>):void};
Deno.serve(createCoverReader({
 url:Deno.env.get("SUPABASE_URL")??"",
 publishable:Deno.env.get("SUPABASE_ANON_KEY")??"",
 service:Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",
}));
