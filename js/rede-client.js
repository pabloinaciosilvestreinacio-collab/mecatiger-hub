// Public-only browser client. Never place service-role or private keys here.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2?bundle";

export const supabase = createClient("https://rnnzumzqilkuecvgsjnv.supabase.co", "sb_publishable_7y8VFdcDmyT9-YSu5y0PBw_biRkynOP", {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true,
    detectSessionInUrl: true, storageKey: "mecatiger-rede-session-v1" }
});

// This is a navigation allowlist, not a server access-control boundary.
export function safeReturn(value) {
  const allowed = new Set(["rede.html", "mecasim-demo.html", "mecasim.html"]);
  return allowed.has(value) ? value : "rede.html";
}
