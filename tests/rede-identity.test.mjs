import test from "node:test";
import assert from "node:assert/strict";
import { isVerifiedMember } from "../js/rede-identity.mjs";

const verified = {
  id: "user-1", email: "student@example.invalid",
  email_confirmed_at: "2026-10-24T10:00:00Z", is_anonymous: false
};

test("verified, non-anonymous email account has member access", () => {
  assert.equal(isVerifiedMember(verified), true);
});

test("anonymous Auth session cannot interact even with uid and email", () => {
  assert.equal(isVerifiedMember({...verified, is_anonymous: true}), false);
});

test("unconfirmed email cannot interact", () => {
  assert.equal(isVerifiedMember({...verified, email_confirmed_at: null}), false);
});

test("missing identity marker fails closed", () => {
  const { is_anonymous: _ignored, ...missingFlag } = verified;
  assert.equal(isVerifiedMember(missingFlag), false);
  assert.equal(isVerifiedMember(null), false);
  assert.equal(isVerifiedMember({}), false);
});

test("account without an address cannot interact", () => {
  assert.equal(isVerifiedMember({...verified, email: ""}), false);
});
