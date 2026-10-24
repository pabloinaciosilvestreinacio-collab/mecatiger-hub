const LOOPBACK = new Set(["127.0.0.1", "localhost"]);

// Auth local often provides ANON_KEY as a legacy JWT rather than sb_publishable_.
// Only its UNPRIVILEGED "anon" role may be accepted, and ONLY on loopback.
export function isLocalPublicKey(key) {
  if (typeof key !== "string" || key.length > 4096) return false;
  if (key.startsWith("sb_publishable_")) return key.length <= 256;
  const parts = key.split(".");
  if (parts.length !== 3 || parts.some(part => !part)) return false;
  try {
    const urlSafe = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const payload = JSON.parse(atob(urlSafe));
    return payload && payload.role === "anon";
  } catch {
    return false;
  }
}

// Test-only override: published hosts ALWAYS retain the committed public config.
export function resolveSupabaseConfig(hostname, injected, defaults) {
  if (!LOOPBACK.has(hostname) || !injected) return defaults;
  if (typeof injected.url !== "string" || typeof injected.key !== "string") return defaults;
  let url;
  try { url = new URL(injected.url); } catch { return defaults; }
  if (url.protocol !== "http:" || !LOOPBACK.has(url.hostname) || url.port !== "54321") return defaults;
  if (!isLocalPublicKey(injected.key)) return defaults;
  return Object.freeze({ url: url.origin, key: injected.key });
}
