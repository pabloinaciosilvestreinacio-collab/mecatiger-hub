import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {inspectAuth,validateRedirect,assertNoUnsafeRedirect,HOSTED_REDIRECTS,
  AUTH_ROUTES,SITE_BASE} from "../scripts/auth-smtp-preflight.mjs";

test("four hosted redirects are exact and remain on the GitHub Pages origin",()=>{
  assert.equal(HOSTED_REDIRECTS.length,4);
  assert.equal(AUTH_ROUTES.length,4);
  assert.ok(assertNoUnsafeRedirect(HOSTED_REDIRECTS));
  for(const x of HOSTED_REDIRECTS) assert.equal(validateRedirect(x),true,x);
  assert.ok(SITE_BASE.endsWith("/mecatiger-hub/"));
});
test("redirects with wildcard, open redirect, altered origin or attacker query fail closed",()=>{
  for(const bad of [
    "https://evil.example/entrar.html?next=admin.html",
    SITE_BASE+"entrar.html?next=../../admin.html",
    SITE_BASE+"entrar.html?next=https://evil.example",
    SITE_BASE+"entrar.html?next=admin.html&more=1",
    SITE_BASE+"entrar.html?next=admin.html#token",
    SITE_BASE+"entrar.html?next=admin.html/../rede.html",
    SITE_BASE+"entrar.html?next=*",
    "http://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/entrar.html?next=admin.html",
    null
  ])assert.equal(validateRedirect(bad),false,JSON.stringify(bad));
  assert.equal(assertNoUnsafeRedirect([...HOSTED_REDIRECTS,HOSTED_REDIRECTS[0]]),false);
  assert.equal(assertNoUnsafeRedirect(["https://evil.example"]),false);
});
test("repository Auth implementation and email template drafts satisfy offline checks",()=>{
  const r=inspectAuth();
  assert.equal(r.codeReady,true,JSON.stringify(r.checks.filter(x=>!x.passed)));
  assert.equal(r.productionReady,false);
  assert.equal(r.hostedConfigVerified,false);
  assert.equal(r.smtpProvisioned,false);
  assert.equal(r.firstAdminProvisioned,false);
  assert.equal(r.checks.length,8);
  assert.equal(r.blockers.length,5);
});
test("Auth preflight refuses to approve hosted config, even when all checks pass",()=>{
  for(const [flag,status] of [
    ["",0],["--require-hosted",3],["--authorize-production",4]
  ]) {
    const r=spawnSync(process.execPath,
      ["scripts/auth-smtp-preflight.mjs",...(flag?[flag]:[])],{
        encoding:"utf8",timeout:15000
      });
    assert.equal(r.status,status,r.stderr+"\n"+r.stdout);
    const output=JSON.parse(r.stdout);
    assert.equal(output.productionReady,false);
    assert.equal(output.firstAdminProvisioned,false);
  }
});
