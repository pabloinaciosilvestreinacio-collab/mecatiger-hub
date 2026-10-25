import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {inspectRepository,REQUIRED_MIGRATIONS,EXTERNAL_GATES} from "../scripts/release-preflight.mjs";

const base=resolve(dirname(fileURLToPath(import.meta.url)),"..");

test("exact migration order and additive launch artifact inventory",()=>{
  assert.deepEqual(REQUIRED_MIGRATIONS,[
    "20261025032012_rede_mecatiger_mvp.sql",
    "20261025032022_require_nonanonymous_identity.sql",
    "20261025032028_mecasim_private_trajectories.sql",
    "20261025032035_mecatiger_site_cms.sql"
  ]);
  const actual=inspectRepository(base);
  assert.equal(actual.codeReady,true,JSON.stringify(actual.codeChecks.filter(c=>!c.ok)));
  assert(actual.codeChecks.length>=8);
});

test("preflight NEVER treats a clean repository as permission for production",()=>{
  const p=inspectRepository(base);
  assert.equal(p.productionReady,false);
  assert(p.externalGates.length>=8);
  assert(p.externalGates.every(c=>c.status==="PENDENTE_DE_VERIFICACAO_HUMANA"));
  assert(EXTERNAL_GATES.some(c=>c.id==="email-delivery"));
  assert(EXTERNAL_GATES.some(c=>c.id==="privacy"));
  assert(EXTERNAL_GATES.some(c=>c.id==="legacy-rpc"));
});

test("fails closed for unknown checkout/missing migration",()=>{
  const noRepository=inspectRepository("/__unavailable_mecatiger_nonexistent__");
  assert.equal(noRepository.codeReady,false);
  assert.equal(noRepository.productionReady,false);
  assert(noRepository.codeChecks.some(c=>c.id==="migration-order"&&!c.ok));
});

test("CLI requires separate production authorization even when source checks pass",()=>{
  const result=spawnSync(process.execPath,["scripts/release-preflight.mjs","--require-production"],{
    cwd:base,encoding:"utf8",timeout:12000
  });
  assert.equal(result.status,2,result.stderr||result.stdout);
  assert.match(result.stdout,/CODIGO_PREPARADO_PRODUCAO_NAO_AUTORIZADA/);
  assert.doesNotMatch(result.stdout,/service_role.*[A-Za-z0-9_-]{20}/i);
});
