import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {resolve} from "node:path";
import {auditSqlText,inspectCheckout,reconcile,EXPECTED_FILES} from "../scripts/audit-migration-reconciliation.mjs";
import {readFileSync} from "node:fs";

const snap=JSON.parse(readFileSync("release/hosted-baseline-20261025.json","utf8"));
const safeSql=Object.fromEntries(EXPECTED_FILES.map(n=>[n,
  "create table if not exists public.rede_profiles(id uuid primary key); alter table public.rede_profiles enable row level security;"]));

test("hosted history matches the four applied migrations; no production write authorization is inferred",()=>{
  const v=inspectCheckout();
  assert.equal(v.valid,true,JSON.stringify(v.issues));
  assert.equal(v.historyAligned,true);
  assert.equal(v.requiresManualReconciliation,false);
  assert.equal(v.productionReady,false);
  assert.match(v.recommendation,/Auth, SMTP/);
  assert.deepEqual(snap.hosted_migrations.map(x=>x.version),[
    "20261013171020","20261013173230","20261013174946","20261019231824",
    "20261025032012","20261025032022","20261025032028","20261025032035"
  ]);
});

test("SQL inspector rejects changes to legacy table, RPC, privileges and destructive DDL",()=>{
  for(const sql of [
    "delete from public.community_registrations where id=1;",
    "truncate table public.rede_posts;",
    "drop table if exists public.community_metrics;",
    "alter table public.community_metrics add column hacked text;",
    "create or replace function public.register_community_member() returns void language sql as $$select 1$$;",
    "grant insert on public.community_registrations to anon;",
    "revoke select on public.community_metrics from authenticated;",
    "create table public.community_registrations(id uuid);"
  ])assert.notDeepEqual(auditSqlText(sql),[],sql);
  assert.deepEqual(auditSqlText("create table public.rede_requests (id bigint);"),[]);
});

test("duplicate version, overlapping remote history or extra migration forces fail closed",()=>{
  const collision={...snap,hosted_migrations:[...snap.hosted_migrations,
    {version:"20261025032012",name:"unexpected"}]};
  assert.equal(reconcile(collision,EXPECTED_FILES,safeSql).valid,false);
  assert.equal(reconcile(snap,[...EXPECTED_FILES,EXPECTED_FILES[0]],safeSql).valid,false);
  assert.equal(reconcile(snap,[...EXPECTED_FILES,"20261025235959_unreviewed.sql"],safeSql).valid,false);
  assert.equal(reconcile(snap,EXPECTED_FILES,{}).valid,false);
  const modified={...safeSql,[EXPECTED_FILES[0]]:"truncate table public.community_registrations;"};
  assert.equal(reconcile(snap,EXPECTED_FILES,modified).valid,false);
});

test("CLI explicitly blocks falsely claiming aligned history or authorized production",()=>{
  for(const [flag,status] of [["",0],["--require-aligned",0],["--authorize-production",4]]){
    const p=spawnSync(process.execPath,["scripts/audit-migration-reconciliation.mjs",...(flag?[flag]:[])],{
      cwd:resolve("."),encoding:"utf8",timeout:10000
    });
    assert.equal(p.status,status,p.stderr+"\n"+p.stdout);
    const report=JSON.parse(p.stdout);
    assert.equal(report.productionReady,false);
  }
});
