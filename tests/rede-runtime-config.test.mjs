import test from "node:test";
import assert from "node:assert/strict";
import { resolveSupabaseConfig, isLocalPublicKey } from "../js/rede-runtime-config.mjs";

const defaults = Object.freeze({ url: "https://project.supabase.co", key: "sb_publishable_production" });
const local = { url: "http://127.0.0.1:54321/path", key: "sb_publishable_local-test-key" };

test("local browser may use only a loopback Supabase override", () => {
  assert.deepEqual(resolveSupabaseConfig("127.0.0.1", local, defaults), {
    url: "http://127.0.0.1:54321", key: local.key
  });
  assert.deepEqual(resolveSupabaseConfig("localhost", { ...local, url: "http://localhost:54321" }, defaults), {
    url: "http://localhost:54321", key: local.key
  });
});

test("published host ignores an injected override", () => {
  assert.equal(resolveSupabaseConfig("pabloinaciosilvestreinacio-collab.github.io", local, defaults), defaults);
});

test("local browser rejects remote, malformed and non-publishable overrides", () => {
  for (const injected of [
    { ...local, url: "https://attacker.example" },
    { ...local, url: "not a url" },
    { ...local, key: "service-role-like-value" },
    null
  ]) assert.equal(resolveSupabaseConfig("127.0.0.1", injected, defaults), defaults);
});

test("local Supabase CLI legacy anon JWT is allowed, never service_role", () => {
  const make = role => {
    const header = Buffer.from(JSON.stringify({alg:"HS256",typ:"JWT"})).toString("base64url");
    const payload = Buffer.from(JSON.stringify({iss:"supabase",role})).toString("base64url");
    return header+"."+payload+".fake-signature"; // synthetic TEST token; not authentic
  };
  const anon = make("anon");
  const privileged = make("service_role");
  assert.equal(isLocalPublicKey(anon),true);
  assert.equal(isLocalPublicKey(privileged),false);
  assert.equal(isLocalPublicKey("sb_secret_never"),false);
  assert.equal(isLocalPublicKey("malformed.jwt"),false);
  assert.equal(resolveSupabaseConfig("127.0.0.1",{url:"http://127.0.0.1:54321",key:anon},defaults).key,anon);
  assert.equal(resolveSupabaseConfig("127.0.0.1",{url:"http://127.0.0.1:54321",key:privileged},defaults),defaults);
  assert.equal(resolveSupabaseConfig("localhost",{url:"http://127.0.0.1:54322",key:anon},defaults),defaults);
  assert.equal(resolveSupabaseConfig("pabloinaciosilvestreinacio-collab.github.io",{url:"http://127.0.0.1:54321",key:anon},defaults),defaults);
});
