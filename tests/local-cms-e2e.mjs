// Integrated authorization and upload tests. NEVER point at a hosted Supabase project.
// Local service-role key is read only from the GitHub runner's disposable CLI env.
import assert from "node:assert/strict";
import crypto from "node:crypto";
const api=process.env.SUPABASE_URL;
const anon=process.env.SUPABASE_ANON_KEY;
const adminKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!api || !anon || !adminKey) throw Error("Supabase local environment missing");
const url=new URL(api);
if(url.protocol!=="http:" || !["127.0.0.1","localhost"].includes(url.hostname) || url.port!=="54321")
  throw Error("Refusing CMS security tests outside the disposable local API");
const rand=crypto.randomBytes(7).toString("hex");
const site="/rest/v1/";
const pngMime="image/webp";
const fixture=Buffer.from("UklGRjoAAABXRUJQVlA4IC4AAAAQAgCdASoCAAIAAkA4JaACdLoB+AH4AAPIAP7n5L/6nAk8B/Br/9JoQ9W/KwAA","base64");

async function send(path,{method="GET",token=anon,key=anon,body,headers={}}={}) {
  const endpoint=new URL(path,url);
  if(endpoint.origin!==url.origin) throw Error("Remote request forbidden");
  const response=await fetch(endpoint,{
    method,signal:AbortSignal.timeout(15000),
    headers:{apikey:key,Authorization:"Bearer "+token,...headers},
    ...(body===undefined?{}:{body:typeof body==="string"||Buffer.isBuffer(body)?body:JSON.stringify(body)})
  });
  const raw=await response.text();
  let json;try{json=JSON.parse(raw);}catch{json=null;}
  return {status:response.status,ok:response.ok,json};
}
const jsonHeaders={"Content-Type":"application/json",Prefer:"return=representation"};
async function localUser(label) {
  const email="cms-"+label+"-"+rand+"@mecatiger.invalid";
  const password=crypto.randomBytes(20).toString("base64url")+"A1!";
  const created=await send("/auth/v1/admin/users",{
    method:"POST",token:adminKey,key:adminKey,
    headers:{"Content-Type":"application/json"},
    body:{email,password,email_confirm:true}
  });
  assert.ok(created.ok,"Failed to create disposable Auth user");
  assert.ok(created.json?.id);
  const session=await send("/auth/v1/token?grant_type=password",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:{email,password}
  });
  assert.ok(session.ok && session.json?.access_token,"Local Auth password sign-in failed");
  const who=await send("/auth/v1/user",{token:session.json.access_token});
  assert.equal(who.json?.id,created.json.id);
  assert.equal(who.json?.is_anonymous,false);
  assert.ok(who.json?.email_confirmed_at);
  return {id:created.json.id,jwt:session.json.access_token};
}
function mustDeny(res,description) {
  assert.equal(res.ok,false,description+" unexpectedly permitted");
}
console.log("[CMS] creating two verified disposable Auth users (no real accounts)");
const a=await localUser("editor"),b=await localUser("member");
let result=await send(site+"meca_site_editors?select=user_id",{token:a.jwt});
assert.equal(result.status,200);
assert.deepEqual(result.json,[],"Auth login alone must not grant admin rights");
mustDeny(await send(site+"meca_site_editors",{
  method:"POST",token:b.jwt,headers:jsonHeaders,body:{user_id:b.id}
}),"self-assigned editor");
mustDeny(await send(site+"meca_site_copy",{
  method:"POST",token:b.jwt,headers:jsonHeaders,
  body:{slot:"home-intro",body:"Unauthorized site takeover attempt",updated_by:b.id}
}),"non-editor text edit");
console.log("[CMS] no self-promotion or content writes without editor grant");

result=await send(site+"meca_site_editors",{
  method:"POST",token:adminKey,key:adminKey,
  headers:jsonHeaders,body:{user_id:a.id}
});
assert.equal(result.status,201,"Only local fixture operator can grant editor");
result=await send(site+"meca_site_editors?select=user_id",{token:a.jwt});
assert.equal(result.json?.[0]?.user_id,a.id);
const text="Conteúdo da equipe atualizado pelo editor autorizado em banco local";
result=await send(site+"meca_site_copy",{
  method:"POST",token:a.jwt,headers:jsonHeaders,
  body:{slot:"home-intro",body:text,updated_by:a.id}
});
assert.equal(result.status,201, "Authorized editor must be able to add copy");
const attemptedUpdate=await send(site+"meca_site_copy?slot=eq.home-intro",{
  method:"PATCH",token:b.jwt,headers:jsonHeaders,
  body:{body:"Edição indevida por um participante comum",updated_by:b.id}
});
// PostgREST may legitimately return 200 with zero affected rows under RLS.
assert.ok(!attemptedUpdate.ok ||
  (Array.isArray(attemptedUpdate.json) && attemptedUpdate.json.length===0),
  "A non-editor cannot update a CMS row");
mustDeny(await send(site+"meca_site_copy",{
  method:"POST",token:a.jwt,headers:jsonHeaders,
  body:{slot:"unknown-field",body:"Bypass de campo desconhecido",updated_by:a.id}
}),"unknown CMS slot");
const published=await send(site+"meca_site_copy?slot=eq.home-intro&select=slot,body");
assert.equal(published.json?.[0]?.body,text,"Public must read only approved fixed slots");
console.log("[CMS] authorized edit, public read and unauthorized update checked");

const name=a.id+"/"+crypto.randomUUID()+".webp";
const uploadPath="/storage/v1/object/meca-site-gallery/"+name;
result=await send(uploadPath,{
  method:"POST",token:a.jwt,
  headers:{"Content-Type":pngMime,"x-upsert":"false"},
  body:fixture
});
assert.ok(result.ok,"Authorized WebP photo must upload to local Storage");
const disallowed=await send("/storage/v1/object/meca-site-gallery/"+b.id+"/"+crypto.randomUUID()+".webp",{
  method:"POST",token:b.jwt,
  headers:{"Content-Type":pngMime,"x-upsert":"false"},body:fixture
});
mustDeny(disallowed,"non-editor storage upload");
mustDeny(await send("/storage/v1/object/meca-site-gallery/"+a.id+"/"+crypto.randomUUID()+".svg",{
  method:"POST",token:a.jwt,headers:{"Content-Type":"image/svg+xml"},body:Buffer.from("<svg></svg>")
}),"SVG upload");
mustDeny(await send("/storage/v1/object/meca-site-gallery/"+a.id+"/"+crypto.randomUUID()+".webp",{
  method:"POST",token:a.jwt,headers:{"Content-Type":pngMime},body:Buffer.alloc(2097153)
}),"oversized file upload");
result=await send(site+"meca_site_gallery",{
  method:"POST",token:a.jwt,headers:jsonHeaders,
  body:{asset_path:name,caption:"Foto descartável da equipe",created_by:a.id}
});
assert.equal(result.status,201,"Authorized editor should publish photo metadata");
mustDeny(await send(site+"meca_site_gallery",{
  method:"POST",token:b.jwt,headers:jsonHeaders,
  body:{asset_path:b.id+"/"+crypto.randomUUID()+".webp",caption:"Foto indevida",created_by:b.id}
}),"non-editor gallery entry");
const gallery=await send(site+"meca_site_gallery?select=caption,asset_path");
assert.ok(gallery.ok && gallery.json?.some(x=>x.asset_path===name),"Gallery must be publicly readable");
const media=await send("/storage/v1/object/public/meca-site-gallery/"+name,{token:anon});
assert.ok(media.ok,"Published photo must be publicly available via Storage");
console.log("LOCAL MECA TIGER CMS SECURITY PASSED");
console.log("Evidence: two local Auth identities, manual editor grant, copy RLS, gallery access, WebP allowlist and size limits.");
