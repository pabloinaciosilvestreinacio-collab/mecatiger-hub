import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_RETURN_ROUTES, authAllowedRedirects, buildAuthEntryUrl,
  isRecoveryRequest, safeReturn
} from "../js/auth-routing.mjs";

const base = "https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/";

test("Auth return paths fail closed and recovery has one canonical redirect", () => {
  assert.deepEqual(AUTH_RETURN_ROUTES, ["rede.html", "mecasim-demo.html", "mecasim.html", "admin.html"]);
  assert.equal(safeReturn("admin.html"), "admin.html");
  assert.equal(safeReturn("https://evil.example"), "rede.html");
  assert.equal(safeReturn("../../admin.html"), "rede.html");
  assert.equal(buildAuthEntryUrl(base, "admin.html"), base + "entrar.html?next=admin.html");
  assert.equal(buildAuthEntryUrl(base, "admin.html", true), base + "entrar.html?next=admin.html&recovery=1");
  assert.equal(isRecoveryRequest("1"), true);
  assert.equal(isRecoveryRequest("true"), false);
  assert.deepEqual(authAllowedRedirects(base), [
    base + "entrar.html?next=rede.html",
    base + "entrar.html?next=mecasim-demo.html",
    base + "entrar.html?next=mecasim.html",
    base + "entrar.html?next=admin.html",
    base + "entrar.html?next=rede.html&recovery=1"
  ]);
});
