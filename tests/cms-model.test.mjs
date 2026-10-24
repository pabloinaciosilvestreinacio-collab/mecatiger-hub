import test from "node:test";
import assert from "node:assert/strict";
import { CMS_SLOTS, CMS_ASSET_PATH, MAX_PHOTO_BYTES,
  validCopy, validCaption, validAssetPath } from "../js/cms-model.mjs";

test("CMS only edits explicitly approved copy fields",()=>{
  assert.equal(Object.keys(CMS_SLOTS).length,4);
  assert.ok(validCopy("home-intro","Texto de teste sem marcação"));
  assert.equal(validCopy("unknown-slot","Alteração não autorizada"),false);
  assert.equal(validCopy("home-intro","x"),false);
  assert.equal(validCopy("home-intro","x".repeat(701)),false);
  assert.equal(validCopy("__proto__","Conteúdo suspeito"),false);
});

test("Only generated webp object paths are accepted",()=>{
  const user="550e8400-e29b-41d4-a716-446655440000";
  const object="aa0eb400-e29b-41d4-a716-446655440111";
  assert.ok(validAssetPath(user+"/"+object+".webp"));
  for(const path of [
    "javascript:alert(1)", "https://evil.example/a.webp",
    "../../private.webp", user+"/evil.svg",
    user+"/a/b.webp",user+"/"+object+".svg",
    user+"/"+object+".webp?token=x"
  ])assert.equal(validAssetPath(path),false);
  assert.equal(CMS_ASSET_PATH.test(""),false);
  assert.equal(MAX_PHOTO_BYTES,2097152);
});

test("Captions cannot store empty, oversized or non-text values",()=>{
  assert.ok(validCaption("Foto da equipe"));
  assert.equal(validCaption("a"),false);
  assert.equal(validCaption("x".repeat(161)),false);
  assert.equal(validCaption({}),false);
});
