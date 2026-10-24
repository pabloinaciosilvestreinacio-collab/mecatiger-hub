import assert from "node:assert/strict";
import crypto from "node:crypto";

const apiUrl = required("SUPABASE_URL");
const anonKey = required("SUPABASE_ANON_KEY");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const jwtSecret = required("SUPABASE_JWT_SECRET");
const mailpitUrl = required("MAILPIT_URL");
const allowedHosts = new Set(["127.0.0.1", "localhost"]);
for (const value of [apiUrl, mailpitUrl]) {
  assert(allowedHosts.has(new URL(value).hostname), `Homologation refused non-local URL: ${value}`);
}

const suffix = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const fixtures = {
  a: { email: `aluno-a-${suffix}@mecatiger.invalid`, name: "Aluno Teste A" },
  b: { email: `aluno-b-${suffix}@mecatiger.invalid`, name: "Aluno Teste B" },
  moderator: { email: `moderador-${suffix}@mecatiger.invalid`, name: "Moderador Teste" }
};

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function localFetch(input, init = {}) {
  const url = new URL(input);
  assert(allowedHosts.has(url.hostname), `Network boundary blocked: ${url.href}`);
  return fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
}

async function jsonRequest(base, path, { method = "GET", key = anonKey, token, body, headers = {} } = {}) {
  const response = await localFetch(new URL(path, base), {
    method,
    headers: {
      apikey: key,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, data };
}

function messageArray(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.messages ?? payload?.Messages ?? [];
}

async function waitForOtp(email) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const { response, data } = await jsonRequest(mailpitUrl, "/api/v1/messages?limit=100", { key: "" });
    if (response.ok) {
      for (const summary of messageArray(data)) {
        if (!JSON.stringify(summary).toLowerCase().includes(email.toLowerCase())) continue;
        const id = summary.ID ?? summary.Id ?? summary.id;
        if (!id) continue;
        const full = await jsonRequest(mailpitUrl, `/api/v1/message/${encodeURIComponent(id)}`, { key: "" });
        const match = JSON.stringify(full.data).match(/MECA-TIGER-OTP[^0-9]{0,160}([0-9]{6})/i);
        if (match) return match[1];
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`OTP not captured by local Mailpit for ${email}`);
}

async function createEmailSession(fixture) {
  const requested = await jsonRequest(apiUrl, "/auth/v1/otp", {
    method: "POST",
    body: { email: fixture.email, create_user: true,
      data: { test_fixture: true, display_name: fixture.name } }
  });
  assert(requested.response.ok, `OTP request failed: ${JSON.stringify(requested.data)}`);
  const token = await waitForOtp(fixture.email);
  const verified = await jsonRequest(apiUrl, "/auth/v1/verify", {
    method: "POST", body: { email: fixture.email, token, type: "email" }
  });
  assert(verified.response.ok, `OTP verification failed: ${JSON.stringify(verified.data)}`);
  assert(verified.data?.access_token && verified.data?.refresh_token && verified.data?.user?.id);
  assert.equal(verified.data.user.is_anonymous, false);
  assert(verified.data.user.email_confirmed_at, "Email was not confirmed");
  return verified.data;
}

async function rest(path, options = {}) {
  return jsonRequest(apiUrl, `/rest/v1/${path}`, options);
}

async function edge(session, body, origin = "http://127.0.0.1:8000") {
  return jsonRequest(apiUrl, "/functions/v1/mecasim-trajectories", {
    method: "POST",
    token: session?.access_token,
    body,
    headers: { Origin: origin }
  });
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function expiredJwt(userId) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    aud: "authenticated", role: "authenticated", sub: userId,
    email: fixtures.a.email, is_anonymous: false,
    iat: Math.floor(Date.now() / 1000) - 7200,
    exp: Math.floor(Date.now() / 1000) - 3600
  }));
  const signature = crypto.createHmac("sha256", jwtSecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

console.log("[homologation] creating three fictitious users through local email OTP");
const sessions = {
  a: await createEmailSession(fixtures.a),
  b: await createEmailSession(fixtures.b),
  moderator: await createEmailSession(fixtures.moderator)
};
assert.notEqual(sessions.a.user.id, sessions.b.user.id);

for (const key of Object.keys(fixtures)) {
  const session = sessions[key];
  const profile = await rest("rede_profiles", {
    method: "POST", token: session.access_token,
    body: { id: session.user.id, display_name: fixtures[key].name },
    headers: { Prefer: "return=representation" }
  });
  assert.equal(profile.response.status, 201, JSON.stringify(profile.data));
}

const moderatorGrant = await rest("rede_moderators", {
  method: "POST", key: serviceRoleKey, token: serviceRoleKey,
  body: { user_id: sessions.moderator.user.id },
  headers: { Prefer: "return=minimal" }
});
assert.equal(moderatorGrant.response.status, 201, JSON.stringify(moderatorGrant.data));

console.log("[homologation] checking Rede moderation and cross-user RLS");
const createdPost = await rest("rede_posts", {
  method: "POST", token: sessions.a.access_token,
  body: { author_id: sessions.a.user.id, kind: "conhecimento", category: "programacao",
    title: "Teste local de isolamento", content: "Conteúdo fictício para validar a homologação local." },
  headers: { Prefer: "return=representation" }
});
assert.equal(createdPost.response.status, 201, JSON.stringify(createdPost.data));
const post = createdPost.data[0];
assert.equal(post.status, "pending");

const hiddenFromB = await rest(`rede_posts?id=eq.${post.id}&select=id,status`, { token: sessions.b.access_token });
assert(hiddenFromB.response.ok);
assert.deepEqual(hiddenFromB.data, []);
const hiddenFromGuest = await rest(`rede_posts?id=eq.${post.id}&select=id,status`, { token: anonKey });
assert(hiddenFromGuest.response.ok);
assert.deepEqual(hiddenFromGuest.data, []);
const visibleToModerator = await rest(`rede_posts?id=eq.${post.id}&select=id,status`, {
  token: sessions.moderator.access_token
});
assert.equal(visibleToModerator.data?.[0]?.status, "pending");
const approved = await rest(`rede_posts?id=eq.${post.id}`, {
  method: "PATCH", token: sessions.moderator.access_token,
  body: { status: "approved" }, headers: { Prefer: "return=representation" }
});
assert.equal(approved.response.status, 200, JSON.stringify(approved.data));
const publicPost = await rest(`rede_posts?id=eq.${post.id}&select=id,status`, { token: anonKey });
assert.equal(publicPost.data?.[0]?.status, "approved");

console.log("[homologation] checking Edge Function CRUD and owner isolation");
assert.equal((await edge(null, { action: "list" })).response.status, 401);
assert.equal((await edge({ access_token: "forged" }, { action: "list" })).response.status, 401);
assert.equal((await edge(sessions.a, { action: "list" }, "https://hostile.example")).response.status, 403);

const saved = await edge(sessions.a, {
  action: "save", name: "Rota descartável A", points: [{ x: 1.83, y: 0.65 }, { x: 2.1, y: 1.2 }]
});
assert.equal(saved.response.status, 201, JSON.stringify(saved.data));
const routeId = saved.data.trajectory.id;
const listA = await edge(sessions.a, { action: "list" });
assert.equal(listA.response.status, 200, JSON.stringify(listA.data));
assert(listA.data.trajectories.some(item => item.id === routeId));
const listB = await edge(sessions.b, { action: "list" });
assert.equal(listB.response.status, 200, JSON.stringify(listB.data));
assert(!listB.data.trajectories.some(item => item.id === routeId));
assert.equal((await edge(sessions.b, { action: "load", id: routeId })).response.status, 404);
assert.equal((await edge(sessions.b, { action: "remove", id: routeId })).response.status, 404);
const loaded = await edge(sessions.a, { action: "load", id: routeId });
assert.equal(loaded.response.status, 200, JSON.stringify(loaded.data));
assert.equal(loaded.data.trajectory.name, "Rota descartável A");
assert.equal((await edge(sessions.a, { action: "remove", id: routeId })).response.status, 200);
assert.equal((await edge(sessions.a, { action: "load", id: routeId })).response.status, 404);

console.log("[homologation] checking anonymous, expired, unauthorized and logout cases");
const anonymousAttempt = await jsonRequest(apiUrl, "/auth/v1/signup", { method: "POST", body: {} });
assert(!anonymousAttempt.response.ok, "Anonymous signup unexpectedly enabled");
const expired = expiredJwt(sessions.a.user.id);
const expiredRest = await rest("rede_profiles?select=id", { token: expired });
assert.equal(expiredRest.response.status, 401);
assert.equal((await edge({ access_token: expired }, { action: "list" })).response.status, 401);

const logout = await jsonRequest(apiUrl, "/auth/v1/logout?scope=global", {
  method: "POST", token: sessions.a.access_token
});
assert(logout.response.ok, JSON.stringify(logout.data));
const refresh = await jsonRequest(apiUrl, "/auth/v1/token?grant_type=refresh_token", {
  method: "POST", body: { refresh_token: sessions.a.refresh_token }
});
assert(!refresh.response.ok, "Refresh token remained valid after global logout");

console.log("LOCAL SUPABASE HOMOLOGATION PASSED");
console.log("Evidence: email OTP, confirmed sessions, moderator, public/pending feed, RLS isolation, Edge CRUD, expired JWT and logout.");
