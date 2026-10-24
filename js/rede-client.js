// Public-only browser client. Never place service-role or private keys here.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2?bundle";

// Only this exact local origin may use the generated development API key.
// Missing local config is a hard error: NEVER fall back to production in a test.
const localOrigin = location.protocol === "http:" &&
  location.hostname === "127.0.0.1" && location.port === "8080";
let clientUrl = "https://rnnzumzqilkuecvgsjnv.supabase.co";
let clientKey = "sb_publishable_7y8VFdcDmyT9-YSu5y0PBw_biRkynOP";
if (localOrigin) {
  const local = await import("./rede-local-config.mjs");
  if (local.url !== "http://127.0.0.1:54321" || !local.key) {
    throw new Error("Local Supabase configuration must use the loopback API");
  }
  clientUrl = local.url;
  clientKey = local.key; // local publishable or anon only, never service_role.
}
export const supabase = createClient(clientUrl, clientKey, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true,
    detectSessionInUrl: true, storageKey: localOrigin ? "mecatiger-rede-local-session-v1" : "mecatiger-rede-session-v1" }
});

// This is a navigation allowlist, not a server access-control boundary.
export function safeReturn(value) {
  const allowed = new Set(["rede.html", "mecasim-demo.html", "mecasim.html"]);
  return allowed.has(value) ? value : "rede.html";
}
