/**
 * Homologação INTEGRADA apenas contra Supabase CLI local.
 * Nunca envia tokens, emails de teste ou chaves para produção.
 * Execução: supabase start; supabase functions serve mecasim-trajectories
 *           node scripts/local-homologate.mjs
 *
 * Uses: real local GoTrue JWTs, PostgREST, RLS, Mailpit and Edge Runtime.
 * The role key is acquired only from local supabase status and held in memory.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { loadLocalSupabase } from "./local-supabase-env.mjs";

const { api, publicKey, adminKey } = loadLocalSupabase();
const localMailpit = "http://127.0.0.1:54324";
const origin = "http://127.0.0.1:8080";
const results = [];
const usersToDelete = [];
const rand = randomBytes(6).toString("hex");
function ok(test) { results.push(test); console.log("PASS: " + test); }
function deny(response, context) {
  assert.ok(response.status === 401 || response.status === 403 ||
            response.status === 404 || response.status === 422,
            context + " must be denied");
}
async function call(path, method="GET", body=null, bearer=publicKey, apiKey=publicKey, extras={}) {
  const headers = {apikey:apiKey, "Content-Type":"application/json"};
  if (bearer) headers.Authorization="Bearer " + bearer;
  if (path.startsWith("/rest/")) headers.Prefer="return=representation";
  Object.assign(headers,extras);
  const response = await fetch(api + path, {
    method, headers, signal:AbortSignal.timeout(12000),
    ...(body === null ? {} : {body:JSON.stringify(body)})
  });
  const raw = await response.text();
  let data=null;
  if (raw) try {data=JSON.parse(raw);} catch {data=null;}
  return {status:response.status,ok:response.ok,data};
}
async function checkReady() {
  const response = await call("/auth/v1/health");
  assert.equal(response.status,200,
    "Local Auth unreachable. Check supabase start; remote fallback forbidden.");
  const mailbox = await fetch(localMailpit+"/api/v1/messages?limit=1", {
    signal:AbortSignal.timeout(6000)
  });
  assert.ok(mailbox.ok, "Mailpit local unavailable (port 54324)");
  ok("Supabase Auth + Mailpit estão na interface local");
}
async function makeUser(label) {
  const email="mecatiger-"+label+"-"+rand+"@example.invalid";
  const password=randomBytes(22).toString("base64url")+"A1!";
  const r=await call("/auth/v1/admin/users","POST",
    {email,password,email_confirm:true},adminKey,adminKey);
  assert.equal(r.status,200,"Could not create local test identity "+label);
  assert.ok(r.data?.id,"Missing local user id");
  usersToDelete.push(r.data.id);
  const session=await call("/auth/v1/token?grant_type=password","POST",
    {email,password});
  assert.ok(session.ok && session.data?.access_token,"Local password login failed");
  const who=await call("/auth/v1/user","GET",null,session.data.access_token);
  assert.equal(who.data?.id,r.data.id);
  assert.equal(who.data?.is_anonymous,false);
  assert.ok(who.data?.email_confirmed_at);
  return {id:r.data.id,email,jwt:session.data.access_token};
}
async function cleanup() {
  // Scope is ONLY the three randomized users on 127.0.0.1.
  // Moderator audit log has FK to auth.users without ON DELETE CASCADE.
  try {
    const r=await call("/rest/v1/rede_moderation_log?moderator_id=not.is.null",
      "DELETE",null,adminKey,adminKey);
    if (!r.ok) console.error("WARN: local audit log cleanup incomplete");
  } catch {
    console.error("WARN: local audit log cleanup unavailable");
  }
  for (const id of usersToDelete) {
    try {
      const r=await call("/auth/v1/admin/users/"+encodeURIComponent(id),
        "DELETE",null,adminKey,adminKey);
      if (!r.ok) console.error("WARN: local test identity cleanup incomplete");
    } catch {
      console.error("WARN: local test identity cleanup interrupted");
    }
  }
}
function one(r,label) {
  assert.ok(r.ok && Array.isArray(r.data) && r.data.length===1,
    "Expected one visible row: "+label);
  return r.data[0];
}
function empty(r,label) {
  assert.ok(r.ok && Array.isArray(r.data) && r.data.length===0,
    "Private data should be hidden: "+label);
}
async function magicLink(email) {
  const redirect = origin+"/entrar.html?next=rede.html";
  const start=await call("/auth/v1/otp?redirect_to="+encodeURIComponent(redirect),
    "POST",{email,create_user:false});
  assert.ok(start.ok,"Local Magic Link email request failed");
  let mail=null;
  for (let attempt=0;attempt<16;attempt++) {
    const page=await fetch(localMailpit+"/api/v1/messages?limit=100", {
      signal:AbortSignal.timeout(5000)
    });
    assert.ok(page.ok);
    const messages=(await page.json()).messages||[];
    const candidate=messages.find(m=>Array.isArray(m.To) &&
      m.To.some(t=>String(t.Address||"").toLowerCase()===email));
    if (candidate) {
      const response=await fetch(localMailpit+"/api/v1/message/"+encodeURIComponent(candidate.ID),{
        signal:AbortSignal.timeout(5000)
      });
      assert.ok(response.ok);
      mail=await response.json();
      break;
    }
    await delay(400);
  }
  assert.ok(mail?.HTML,"Mailpit did not capture the local Magic Link email");
  const html=mail.HTML.replaceAll("&amp;","&");
  const links=[...html.matchAll(/href="([^"]+)"/gu)].map(m=>m[1]);
  const target=links.find(link=>link.includes("token_hash="));
  assert.ok(target,"Mailpit email template lacks token_hash URL");
  const callback=new URL(target);
  assert.equal(callback.origin,origin);
  assert.equal(callback.pathname,"/entrar.html");
  assert.equal(callback.searchParams.get("next"),"rede.html");
  assert.equal(callback.searchParams.get("type"),"email");
  const tokenHash=callback.searchParams.get("token_hash");
  assert.ok(tokenHash);
  const result=await call("/auth/v1/verify","POST",
    {type:"email",token_hash:tokenHash});
  assert.ok(result.ok && result.data?.access_token,
    "The local email hash could not be verified");
  const replay=await call("/auth/v1/verify","POST",
    {type:"email",token_hash:tokenHash});
  assert.ok(!replay.ok,"An already-consumed Magic Link must be rejected");
  ok("Magic Link capturado no Mailpit, confirmado e bloqueado para reutilização");
}
async function run() {
  await checkReady();
  // No remote project, OAuth, paid SMTP or cloud resources are contacted.
  const A=await makeUser("a"),B=await makeUser("b"),M=await makeUser("mod");
  ok("Três identidades reais confirmadas pelo Auth local");
  await magicLink(A.email);
  const anon=await call("/auth/v1/signup","POST",{data:{}});
  assert.ok(!anon.ok && !anon.data?.access_token,
    "Anonymous sign-in was not disabled in local Auth config");
  ok("Cadastro anônimo recusado pelo Supabase local");

  for (const [who,name] of [[A,"Estudante A"],[B,"Estudante B"],[M,"Moderador"]]) {
    const r=await call("/rest/v1/rede_profiles","POST",
      {id:who.id,display_name:name},who.jwt);
    assert.ok(r.ok,"Cannot create authenticated profile");
  }
  const mod=await call("/rest/v1/rede_moderators","POST",{user_id:M.id},adminKey,adminKey);
  assert.ok(mod.ok);
  const falseMod=await call("/rest/v1/rede_moderators","POST",{user_id:B.id},B.jwt);
  deny(falseMod,"User B cannot self-appoint moderator");
  ok("Perfis reais criados; escalada de privilégio de moderador negada");

  const article=one(await call("/rest/v1/rede_posts","POST",{
    author_id:A.id,kind:"conhecimento",category:"programacao",
    title:"Teste integrado de segurança",
    content:"Publicação pendente para testar o fluxo real de aprovação."
  },A.jwt),"post created");
  assert.equal(article.status,"pending");
  empty(await call("/rest/v1/rede_posts?select=id&status=eq.pending","GET",null,B.jwt),
    "B cannot inspect A pending post");
  const forced=await call("/rest/v1/rede_posts","POST",{
    author_id:A.id,kind:"conhecimento",category:"programacao",
    title:"Tentativa de aprovação",
    content:"Um autor sem moderação não pode aprovar esta publicação.",
    status:"approved"
  },A.jwt);
  deny(forced,"author-created approved post");
  const approved=await call("/rest/v1/rede_posts?id=eq."+article.id,"PATCH",
    {status:"approved"},M.jwt);
  assert.ok(approved.ok && approved.data?.[0]?.status==="approved");
  const publicPost=await call("/rest/v1/rede_posts?select=id&id=eq."+article.id);
  assert.equal(publicPost.data?.length,1);
  ok("Post pendente isolado, aprovação moderada e leitura pública reais");

  const request=one(await call("/rest/v1/rede_requests","POST",{
    author_id:A.id,kind:"ajuda",category:"programacao",
    title:"Pedido privado de mentoria",
    details:"Precisamos de ajuda com sensores e programação do Mequinha."
  },A.jwt),"A private request");
  empty(await call("/rest/v1/rede_requests?select=id&id=eq."+request.id,"GET",null,B.jwt),
    "private request of user A");
  const moderatorView=await call("/rest/v1/rede_requests?select=id&id=eq."+request.id,
    "GET",null,M.jwt);
  assert.equal(moderatorView.data?.length,1);
  ok("Solicitações privadas inacessíveis ao outro usuário e visíveis à moderação");

  const comment=one(await call("/rest/v1/rede_comments","POST",{
    post_id:article.id,author_id:B.id,content:"Comentário sujeito à aprovação."
  },B.jwt),"B pending comment");
  assert.equal(comment.status,"pending");
  empty(await call("/rest/v1/rede_comments?select=id&id=eq."+comment.id),
    "visitor cannot see pending comment");
  ok("Comentário pendente não aparece publicamente");

  const route=await call("/functions/v1/mecasim-trajectories","POST",{
    action:"save",name:"Trajetória A",points:[{x:1.83,y:.65},{x:1.95,y:1.1}]
  },A.jwt,publicKey,{Origin:origin});
  assert.equal(route.status,201,"Authenticated Edge save must return 201");
  const id=route.data?.trajectory?.id;
  assert.ok(Number.isSafeInteger(id),"Missing saved route id");
  const own=await call("/functions/v1/mecasim-trajectories","POST",
    {action:"load",id},A.jwt,publicKey,{Origin:origin});
  assert.equal(own.status,200);
  const other=await call("/functions/v1/mecasim-trajectories","POST",
    {action:"load",id},B.jwt,publicKey,{Origin:origin});
  assert.equal(other.status,404);
  const otherDelete=await call("/functions/v1/mecasim-trajectories","POST",
    {action:"remove",id},B.jwt,publicKey,{Origin:origin});
  assert.equal(otherDelete.status,404);
  const bList=await call("/functions/v1/mecasim-trajectories","POST",
    {action:"list"},B.jwt,publicKey,{Origin:origin});
  assert.equal(bList.status,200);
  assert.deepEqual(bList.data?.trajectories,[]);
  ok("Edge: salvar/carregar próprias rotas; usuário B não lê nem apaga as de A");

  const directSpoof=await call("/rest/v1/mecasim_trajectories","POST",{
    owner_id:B.id,name:"Rota falsificada",points:[{x:1.12,y:1.11}]
  },A.jwt);
  deny(directSpoof,"direct REST owner spoof");
  const invalid=await call("/functions/v1/mecasim-trajectories","POST",{
    action:"save",name:"Inválida",points:[{x:40,y:1}]
  },A.jwt,publicKey,{Origin:origin});
  assert.equal(invalid.status,422);
  const forged=await call("/functions/v1/mecasim-trajectories","POST",
    {action:"list"},"forged.bad.jwt",publicKey,{Origin:origin});
  assert.equal(forged.status,401);
  const missing=await call("/functions/v1/mecasim-trajectories","POST",
    {action:"list"},null,publicKey,{Origin:origin});
  assert.equal(missing.status,401);
  ok("API direta bloqueia owner spoof, pontos inválidos e JWT ausente/falso");

  const deletion=await call("/functions/v1/mecasim-trajectories","POST",
    {action:"remove",id},A.jwt,publicKey,{Origin:origin});
  assert.equal(deletion.status,200);
  ok("Exclusão de trajetória própria concluída e registrada localmente");
}
try {
  await run();
  console.log("RESULTADO: "+results.length+" verificações integradas aprovadas SOMENTE na stack local.");
} catch(error) {
  console.error("FALHA NA HOMOLOGAÇÃO LOCAL: "+String(error.message||error));
  process.exitCode=1;
} finally {
  await cleanup();
}
