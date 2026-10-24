import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const browserClient = readFileSync(".mecatiger-browser-build/supabase-browser.mjs", "utf8");
const allowedHosts = new Set(["127.0.0.1", "localhost"]);

export function localEnvironment(required = false) {
  const config = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    mailpit: process.env.MAILPIT_URL
  };
  if (required) {
    assert(config.url && config.key && config.mailpit, "Local Supabase browser environment is required");
    assert(allowedHosts.has(new URL(config.url).hostname));
    assert(allowedHosts.has(new URL(config.mailpit).hostname));
  }
  return config;
}

export async function installLocalApp(context, required = false) {
  const config = localEnvironment(required);
  if (config.url && config.key) {
    await context.addInitScript(value => {
      Object.defineProperty(globalThis, "__MECA_TIGER_LOCAL_CONFIG__", {
        value: Object.freeze(value), configurable: false, writable: false
      });
    }, { url: config.url, key: config.key });
  }
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (allowedHosts.has(url.hostname)) return route.continue();
    if (url.origin === "https://esm.sh" && url.pathname === "/@supabase/supabase-js@2.117.2") {
      return route.fulfill({ status: 200, contentType: "application/javascript", body: browserClient });
    }
    return route.abort("blockedbyclient");
  });
}

function strings(value, result = []) {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) for (const item of value) strings(item, result);
  else if (value && typeof value === "object") for (const item of Object.values(value)) strings(item, result);
  return result;
}

export async function waitForConfirmationLink(email) {
  const { mailpit } = localEnvironment(true);
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const listResponse = await fetch(new URL("/api/v1/messages?limit=100", mailpit));
    if (listResponse.ok) {
      const payload = await listResponse.json();
      const messages = payload.messages ?? payload.Messages ?? (Array.isArray(payload) ? payload : []);
      for (const summary of messages) {
        if (!JSON.stringify(summary).toLowerCase().includes(email.toLowerCase())) continue;
        const id = summary.ID ?? summary.Id ?? summary.id;
        if (!id) continue;
        const fullResponse = await fetch(new URL(`/api/v1/message/${encodeURIComponent(id)}`, mailpit));
        if (!fullResponse.ok) continue;
        for (const value of strings(await fullResponse.json())) {
          const match = value.match(/href=["']([^"']*\/auth\/v1\/verify[^"']*)["']/i);
          if (match) return match[1].replaceAll("&amp;", "&");
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Local Mailpit did not capture a confirmation link for ${email}`);
}
