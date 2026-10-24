const LOOPBACK = new Set(["127.0.0.1", "localhost"]);

// Test-only override: production hosts always use the committed public client config.
export function resolveSupabaseConfig(hostname, injected, defaults) {
  if (!LOOPBACK.has(hostname) || !injected) return defaults;
  if (typeof injected.url !== "string" || typeof injected.key !== "string") return defaults;
  let url;
  try { url = new URL(injected.url); } catch { return defaults; }
  if (url.protocol !== "http:" || !LOOPBACK.has(url.hostname)) return defaults;
  if (!injected.key.startsWith("sb_publishable_") || injected.key.length > 256) return defaults;
  return Object.freeze({ url: url.origin, key: injected.key });
}
