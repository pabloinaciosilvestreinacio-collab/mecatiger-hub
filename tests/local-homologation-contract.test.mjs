import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseLocalStatus } from "../scripts/local-supabase-env.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const mock=(api,extra="")=>"API_URL="+api+"\nANON_KEY=fake-public-test\nSERVICE_ROLE_KEY=fake-local-admin-test\n"+extra;

test("Supabase CLI reader accepts only the explicit local loopback URL",()=>{
  const env=parseLocalStatus(mock("http://127.0.0.1:54321"));
  assert.equal(env.api,"http://127.0.0.1:54321");
  assert.equal(env.publicKey,"fake-public-test");
  assert.equal(env.adminKey,"fake-local-admin-test");
  assert.equal(parseLocalStatus(mock("http://localhost:54321")).api,"http://127.0.0.1:54321");
});

test("reader rejects production, remote, custom ports and missing local keys",()=>{
  for(const url of [
    "https://example.supabase.co","https://rnnzumzqilkuecvgsjnv.supabase.co",
    "http://127.0.0.1:54322","http://192.168.1.4:54321",
    "http://127.0.0.1:54321.evil.invalid"
  ]) {
    assert.throws(()=>parseLocalStatus(mock(url)),/ABORTADO/);
  }
  assert.throws(()=>parseLocalStatus("API_URL=http://127.0.0.1:54321\nANON_KEY=test\n"),/chaves/);
});

test("Local auth configuration requires verified email and rejects anonymous sign-ins",()=>{
  const config=read("supabase/config.toml");
  assert.match(config,/project_id = "mecatiger-rede-local"/);
  assert.match(config,/enable_anonymous_sign_ins = false/);
  assert.match(config,/enable_confirmations = true/);
  assert.match(config,/verify_jwt = true/);
  assert.match(config,/54324/);
});

test("Browser development URL fails closed and never loads local admin key",()=>{
  const client=read("js/rede-client.js");
  const prepare=read("scripts/local-prepare.mjs");
  assert.match(client,/location\.hostname === "127\.0\.0\.1"/);
  assert.match(client,/location\.port === "8080"/);
  assert.match(client,/throw new Error\("Local Supabase configuration/);
  assert.match(client,/import\("\.\/rede-local-config\.mjs"\)/);
  assert.match(prepare,/const \{api, publicKey\} = loadLocalSupabase\(\)/);
  assert.doesNotMatch(prepare,/adminKey\s*[,\]}]/);
  assert.match(read(".gitignore"),/js\/rede-local-config\.mjs/);
});

test("Magic Link template returns only to allowlisted localhost destination",()=>{
  const template=read("supabase/templates/magic_link.html");
  assert.match(template,/\{\{ \.RedirectTo \}\}&token_hash=\{\{ \.TokenHash \}\}&type=email/);
  assert.match(read("supabase/config.toml"),/127\.0\.0\.1:8080\/entrar\.html\?next=rede.html/);
});

test("Integration script uses only local Auth Mailpit and per-user cleanup",()=>{
  const code=read("scripts/local-homologate.mjs");
  assert.match(code,/loadLocalSupabase\(\)/);
  assert.match(code,/127\.0\.0\.1:54324/);
  assert.match(code,/auth\/v1\/verify/);
  assert.match(code,/rede_moderation_log\?moderator_id=eq\./);
  assert.match(code,/owner spoof|owner spoof|owner spoof|owner spoof/i);
  assert.match(code,/functions\/v1\/mecasim-trajectories/);
  assert.doesNotMatch(code,/supabase\.co/);
  assert.doesNotMatch(code,/functions deploy|db push|supabase link/);
});
