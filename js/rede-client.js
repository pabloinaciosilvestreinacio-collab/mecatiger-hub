// Public-only browser client. Never place service-role or private keys here.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2?bundle";
import { resolveSupabaseConfig } from "./rede-runtime-config.mjs";

const defaults = {
  url: "https://rnnzumzqilkuecvgsjnv.supabase.co",
  key: "sb_publishable_7y8VFdcDmyT9-YSu5y0PBw_biRkynOP"
};
const config = resolveSupabaseConfig(location.hostname, globalThis.__MECA_TIGER_LOCAL_CONFIG__, defaults);

export const supabase = createClient(config.url, config.key, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true,
    detectSessionInUrl: false, storageKey: "mecatiger-rede-session-v1" }
});

// This is a navigation allowlist, not a server access-control boundary.
export function safeReturn(value) {
  const allowed = new Set(["rede.html", "mecasim-demo.html", "mecasim.html", "admin.html"]);
  return allowed.has(value) ? value : "rede.html";
}
