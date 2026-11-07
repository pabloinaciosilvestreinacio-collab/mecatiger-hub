// Navigation policy shared by the browser Auth client and offline release checks.
// This controls only return paths; Supabase and RLS remain the access-control boundary.
export const AUTH_RETURN_ROUTES = Object.freeze([
  "rede.html",
  "mecasim-demo.html",
  "mecasim.html",
  "admin.html"
]);

export const DEFAULT_AUTH_RETURN = "rede.html";

export function safeReturn(value) {
  return AUTH_RETURN_ROUTES.includes(value) ? value : DEFAULT_AUTH_RETURN;
}

export function isRecoveryRequest(value) {
  return value === "1";
}

export function buildAuthEntryUrl(baseHref, route = DEFAULT_AUTH_RETURN, recovery = false) {
  const url = new URL("entrar.html", baseHref);
  url.searchParams.set("next", safeReturn(route));
  if (recovery) url.searchParams.set("recovery", "1");
  return url.href;
}

export function authAllowedRedirects(siteBase) {
  return Object.freeze([
    ...AUTH_RETURN_ROUTES.map(route => buildAuthEntryUrl(siteBase, route)),
    buildAuthEntryUrl(siteBase, DEFAULT_AUTH_RETURN, true)
  ]);
}
