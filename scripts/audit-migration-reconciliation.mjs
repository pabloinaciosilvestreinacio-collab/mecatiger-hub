/**
 * Read-only migration-history reconciliation audit.
 * No network, privileged key, database command, SQL execution, or production mutation.
 */
import {readFileSync,readdirSync} from "node:fs";
import {resolve,basename} from "node:path";
import {fileURLToPath} from "node:url";

const projectRoot=resolve(fileURLToPath(new URL("..",import.meta.url)));
export const EXPECTED_FILES=Object.freeze([
  "20261025032012_rede_mecatiger_mvp.sql",
  "20261025032022_require_nonanonymous_identity.sql",
  "20261025032028_mecasim_private_trajectories.sql",
  "20261025032035_mecatiger_site_cms.sql",
  "20261025140000_rede_request_messages.sql",
  "20261025160000_admin_access_and_team_members.sql",
  "20261025170000_fix_admin_access_email_return_type.sql"
]);
export const EXPECTED_APPLIED_FILES=Object.freeze(EXPECTED_FILES.slice(0,7));
export const EXPECTED_HOSTED_MIGRATIONS=Object.freeze([
  ["20261013171020","create_community_registration_metrics"],
  ["20261013173230","count_competitors_as_students"],
  ["20261013174946","add_brazilian_state_metrics"],
  ["20261019231824","secure_public_registration_rpc_v2"],
  ["20261025032012","rede_mecatiger_mvp"],
  ["20261025032022","require_nonanonymous_identity"],
  ["20261025032028","mecasim_private_trajectories"],
  ["20261025032035","mecatiger_site_cms"],
  ["20261025140659","rede_request_messages"],
  ["20261025153851","admin_access_and_team_members"],
  ["20261025153927","fix_admin_access_email_return_type"]
]);
export const PROTECTED_LEGACY_OBJECTS=Object.freeze([
  "community_registrations","community_metrics","register_community_member"
]);
const NEW_OBJECTS=new Set([
 "rede_profiles","rede_moderators","rede_posts","rede_comments","rede_requests",
 "rede_reports","rede_moderation_log","rede_request_messages","mecasim_trajectories",
 "meca_site_editors","meca_site_copy","meca_site_gallery","meca_site_pages",
 "meca_site_admins","meca_site_team_members"
]);
export const normalizeVersion = filename => {
  const m=/^([0-9]{14})_[a-z0-9_]+\.sql$/.exec(filename);
  return m?.[1]??null;
};
// Static SQL heuristic, not a complete SQL parser; no DDL or executable SQL created.
export function auditSqlText(sql,{allowAdminRoleRevocations=false}={}) {
  if(typeof sql!=="string")return ["SQL inválido"];
  const statements=sql.replace(/--[^\n]*/g," ")
    .replace(/\/\*[\s\S]*?\*\//g," ")
    .split(";")
    .map(x=>x.trim()).filter(Boolean);
  const risks=[];
  for(const stmt of statements) {
    const roleRevocation=allowAdminRoleRevocations &&
      /^(?:else\s+)?delete\s+from\s+public\.(meca_site_admins|meca_site_editors|rede_moderators)\b/i.test(stmt);
    if(/\b(drop\s+(table|schema|function|policy|trigger|index|view)|truncate\b|delete\s+from\b)/i.test(stmt) && !roleRevocation)
      risks.push("Operação destrutiva detectada");
    if(/\b(update|insert\s+into|merge\s+into|alter\s+table|create\s+or\s+replace\s+function|drop\s+function)\s+(?:if\s+(?:not\s+)?exists\s+)?(?:public\.)?(?:community_registrations|community_metrics|register_community_member)\b/i.test(stmt))
      risks.push("Tentativa de escrever em estrutura legada");
    if(/\b(?:grant|revoke)\b[\s\S]*?\bon\s+(?:table\s+|function\s+)?(?:public\.)?(?:community_registrations|community_metrics|register_community_member)\b/i.test(stmt))
      risks.push("Permissões do cadastro legado alteradas");
    for(const m of stmt.matchAll(/\balter\s+table\s+(?:if\s+exists\s+)?public\.([a-z0-9_]+)/gi))
      if(!NEW_OBJECTS.has(m[1].toLowerCase()))
        risks.push("ALTER TABLE fora dos novos objetos: "+m[1]);
    for(const m of stmt.matchAll(/\bcreate\s+(?:or\s+replace\s+)?table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]+)/gi))
      if(!NEW_OBJECTS.has(m[1].toLowerCase()))
        risks.push("CREATE TABLE fora do escopo: "+m[1]);
  }
  return [...new Set(risks)];
}
export function reconcile(remote, filenames, sqlByFile) {
  const issues=[];
  if(!remote||!Array.isArray(remote.hosted_migrations)||!Array.isArray(remote.hosted_public_tables))
    return {valid:false,historyAligned:false,requiresManualReconciliation:true,issues:["Inventário hospedado ausente"]};
  const versions=remote.hosted_migrations.map(x=>x.version);
  if(versions.some(x=>typeof x!=="string"||!/^\d{14}$/.test(x))||
    new Set(versions).size!==versions.length||versions.some((x,i)=>i>0&&x<=versions[i-1]))
    issues.push("Histórico hospedado inconsistente: versões duplicadas, inválidas ou fora de ordem");
  if(filenames.some(x=>normalizeVersion(x)===null)||new Set(filenames).size!==filenames.length)
    issues.push("Migrações locais com nomes ou versões inválidas");
  const localVersions=filenames.map(normalizeVersion);
  if(new Set(localVersions).size!==localVersions.length)
    issues.push("Versões duplicadas no checkout");
  if(JSON.stringify([...filenames].sort())!==JSON.stringify([...EXPECTED_FILES].sort()))
    issues.push("Conjunto de novas migrações fora da lista aprovada");
  if(filenames.some((x,i)=>i>0&&x<=filenames[i-1]))
    issues.push("Sequência local desordenada");
  for(const f of filenames) {
    if(typeof sqlByFile?.[f]!=="string") {issues.push("SQL ausente: "+f);continue;}
    const allowAdminRoleRevocations=f==="20261025160000_admin_access_and_team_members.sql";
    for(const danger of auditSqlText(sqlByFile[f],{allowAdminRoleRevocations}))
      issues.push(f+": "+danger);
  }
  const legacyTables=["community_registrations","community_metrics"];
  if(!legacyTables.every(x=>remote.hosted_public_tables.some(t=>t.name===x&&t.rls_enabled===true)))
    issues.push("Tabela antiga sem RLS ou não encontrada na fotografia hospedada");
  if(remote.legacy_rpc?.name!=="register_community_member"||remote.legacy_rpc?.security_definer!==true)
    issues.push("RPC de cadastro hospedado mudou desde a inspeção");
  // All seven repository product migrations are confirmed applied; two hosted timestamps
  // are mapped explicitly because Supabase registered them during reviewed application.
  const expectedVersions=EXPECTED_HOSTED_MIGRATIONS.map(x=>x[0]);
  const expectedNames=new Map(EXPECTED_HOSTED_MIGRATIONS);
  const remoteByVersion=new Map(remote.hosted_migrations.map(x=>[x.version,x.name]));
  const inventoryAligned=JSON.stringify(versions)===JSON.stringify(expectedVersions);
  const hostedVersionByFile=new Map([
    ["20261025140000_rede_request_messages.sql","20261025140659"],
    ["20261025160000_admin_access_and_team_members.sql","20261025153851"],
    ["20261025170000_fix_admin_access_email_return_type.sql","20261025153927"]
  ]);
  const appliedAligned=EXPECTED_APPLIED_FILES.every(filename=>{
    const version=hostedVersionByFile.get(filename)||normalizeVersion(filename);
    const name=basename(filename,".sql").slice(15);
    return remoteByVersion.get(version)===name && expectedNames.get(version)===name;
  });
  const lastRemoteVersion=versions.at(-1);
  const pendingFiles=EXPECTED_FILES.filter(filename=>!EXPECTED_APPLIED_FILES.includes(filename));
  const pendingVersionsValid=pendingFiles.every(filename=>{
    const version=normalizeVersion(filename);
    return version>lastRemoteVersion && !remoteByVersion.has(version);
  });
  if(!inventoryAligned)issues.push("Histórico hospedado difere do inventário verificado após implantação");
  if(!appliedAligned)issues.push("Versão/nome local das migrations aplicadas não corresponde ao histórico hospedado");
  if(!pendingVersionsValid)issues.push("Migration em revisão colide com o histórico ou não é posterior ao remoto");
  const historyAligned=inventoryAligned&&appliedAligned&&pendingVersionsValid;
  const safeSql=issues.length===0;
  return {
    valid:safeSql,
    historyAligned,
    requiresManualReconciliation:!historyAligned,
    productionReady:false,
    issues,
    snapshotAgeWarning:"Inventário atualizado em 25/10/2026 após as migrações de administração e equipe; confira novamente contra o remoto antes de novas alterações.",
    recommendation:!safeSql?"STOP: corrigir risco estrutural ou alteração de objeto legado.":
      !historyAligned?"STOP: histórico remoto diverge do inventário pós-implantação.":
      "STOP: schema alinhado; Auth, SMTP, contas editor/moderador e homologação ponta a ponta seguem pendentes."
  };
}
export function inspectCheckout(root=projectRoot){
  const snapshot=JSON.parse(readFileSync(resolve(root,"release/hosted-baseline-20261025.json"),"utf8"));
  const dir=resolve(root,"supabase/migrations");
  const files=readdirSync(dir).filter(x=>x.endsWith(".sql")).sort();
  const sqlByFile=Object.fromEntries(files.map(x=>[x,readFileSync(resolve(dir,x),"utf8")]));
  return reconcile(snapshot,files,sqlByFile);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let result;
  try{result=inspectCheckout();}
  catch(error){result={valid:false,historyAligned:false,requiresManualReconciliation:true,productionReady:false,issues:["Falha ao ler arquivos de auditoria: "+error.code]};}
  console.log(JSON.stringify(result,null,2));
  if(!result.valid)process.exitCode=1;
  if(process.argv.includes("--require-aligned")&&!result.historyAligned)process.exitCode=3;
  if(process.argv.includes("--authorize-production"))process.exitCode=4;
}
