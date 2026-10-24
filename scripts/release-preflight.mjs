/**
 * Meca Tiger release preflight — read-only and OFFLINE.
 * This script never connects to Supabase/GitHub, deploys, reads secrets or
 * promotes a release. It separates code readiness from human approvals.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_MIGRATIONS = Object.freeze([
  "20261024160000_rede_mecatiger_mvp.sql",
  "20261024163000_require_nonanonymous_identity.sql",
  "20261024170000_mecasim_private_trajectories.sql",
  "20261024190000_mecatiger_site_cms.sql"
]);

export const EXTERNAL_GATES = Object.freeze([
  {id:"approval",label:"Autorização explícita e responsável identificado para publicação"},
  {id:"migration-review",label:"Revisão das migrations e backup/restauração conforme política aprovada"},
  {id:"auth-config",label:"Auth hospedado, URL e redirects estritos, sem login anônimo"},
  {id:"email-delivery",label:"SMTP customizado gratuito autorizado e Magic Link hospedado entregue"},
  {id:"first-editor",label:"Primeiro editor identificado e autorizado individualmente no banco"},
  {id:"moderation",label:"Moderador designado e capacidade de atender denúncias"},
  {id:"privacy",label:"Minimização de dados, LGPD e procedimento para menores revistos"},
  {id:"pages-smoke",label:"Teste pós-publicação da URL GitHub Pages e das funções reais"},
  {id:"legacy-rpc",label:"Auditoria do RPC público de cadastro de métricas e de sua autorização"},
  {id:"costs",label:"Confirmação prévia de limites gratuitos de SMTP/Storage/Auth"}
]);

// The caller can supply a throwaway root for unit tests; no network I/O.
export function inspectRepository(root=process.cwd()) {
  const at=path=>resolve(root,path);
  const read=path=>existsSync(at(path))?readFileSync(at(path),"utf8"):"";
  const checks=[];
  const check=(id,ok,reason)=>checks.push({id,ok:Boolean(ok),reason});
  const migrationsDir=at("supabase/migrations");
  const existing=existsSync(migrationsDir)?readdirSync(migrationsDir).filter(x=>x.endsWith(".sql")).sort():[];
  check("migration-order",REQUIRED_MIGRATIONS.every(n=>existing.includes(n)) &&
    REQUIRED_MIGRATIONS.every((n,i)=>i===0||n>REQUIRED_MIGRATIONS[i-1]) &&
    existing.length===REQUIRED_MIGRATIONS.length,
    "Quatro migrations esperadas, únicas e em ordem; conferência estrutural, não revisão SQL completa");
  const community=read("supabase/migrations/20261024160000_rede_mecatiger_mvp.sql");
  const anon=read("supabase/migrations/20261024163000_require_nonanonymous_identity.sql");
  const sim=read("supabase/migrations/20261024170000_mecasim_private_trajectories.sql");
  const cms=read("supabase/migrations/20261024190000_mecatiger_site_cms.sql");
  check("schema-rls",
    ["rede_profiles","rede_moderators","rede_posts","rede_comments","rede_requests","rede_reports"]
      .every(t=>community.includes("alter table public."+t+" enable row level security")) &&
      sim.includes("mecasim_trajectories enable row level security") &&
      ["meca_site_editors","meca_site_copy","meca_site_gallery"].every(t=>cms.includes("alter table public."+t+" enable row level security")),
    "Políticas RLS previstas nos arquivos; a integração com banco real é testada em workflow separado");
  check("anonymous-deny",anon.includes("as restrictive") && anon.includes("is_anonymous"),
    "Guarda contra identidade Auth anônima presente nos SQL");
  check("editor-no-self-grant",cms.includes("grant select on public.meca_site_editors to authenticated") &&
    !/grant\s+(insert|update|delete|all)\s+on\s+public\.meca_site_editors\s+to\s+authenticated/i.test(cms),
    "Usuários não podem cadastrar seus próprios privilégios de editor");
  const config=read("supabase/config.toml");
  check("local-only-config",config.includes('site_url = "http://127.0.0.1:8000"') &&
    config.includes("enable_anonymous_sign_ins = false") &&
    config.includes("[functions.mecasim-trajectories]") &&
    config.includes("verify_jwt = true"),
    "Config CLI é local; NÃO valida as configurações do Supabase hospedado");
  const client=read("js/rede-client.js");
  const allowed=new Set(["rede.html","mecasim-demo.html","mecasim.html","admin.html"]);
  check("auth-return-allowlist",Array.from(allowed).every(x=>client.includes('"'+x+'"')) &&
    client.includes("safeReturn("),
    "Retornos permitidos no navegador, mas redirects do servidor ainda precisam de aprovação");
  const home=read("index.html"),rede=read("rede.html"),entry=read("entrar.html");
  check("browser-routes",home.includes('src="js/cms-public.js"') &&
    home.includes('href="admin.html"') && rede.includes('src="js/cms-public.js"') &&
    entry.includes('src="js/rede-auth.js"') &&
    existsSync(at("admin.html")) && existsSync(at("js/admin.js")),
    "Rotas, editor e CMS existem nos artefatos estáticos");
  const edge=read("supabase/functions/mecasim-trajectories/index.ts");
  check("edge-present",Boolean(edge) && edge.includes("mecasim-trajectories"),
    "Edge Function está versionada; não significa que foi implantada");
  const template=read("supabase/templates/local-access.html");
  check("test-email-template",template.includes("MECA-TIGER-OTP") &&
    config.includes('content_path = "./supabase/templates/local-access.html"'),
    "O template é EXCLUSIVO dos testes locais; não usar como configuração pública");
  check("release-runbook",existsSync(at("LANCAMENTO_MECATIGER_20261025.md")),
    "Plano de ativação, dependências e volta segura documentados");
  return {
    codeChecks:checks, codeReady:checks.every(x=>x.ok),
    externalGates:EXTERNAL_GATES.map(x=>({...x,status:"PENDENTE_DE_VERIFICACAO_HUMANA"})),
    productionReady:false, // Intentionally impossible to authorize deployment through CI.
    summary:checks.every(x=>x.ok)?"CODIGO_PREPARADO_PRODUCAO_NAO_AUTORIZADA":"FALHA_ESTRUTURAL_NA_PREPARACAO"
  };
}
const invoked=fileURLToPath(import.meta.url)===resolve(process.argv[1]||"");
if(invoked){
  const report=inspectRepository();
  if(process.argv.includes("--json")) console.log(JSON.stringify(report,null,2));
  else{
    console.log("Meca Tiger | pré-lançamento OFFLINE, somente leitura");
    for(const c of report.codeChecks) console.log((c.ok?"PASS":"FAIL")+" "+c.id+" — "+c.reason);
    console.log("Resultado: "+report.summary);
    console.log("Bloqueios operacionais pendentes: "+report.externalGates.length);
    console.log("Nenhum deploy, merge, alteração de banco ou autorização efetuados.");
  }
  if(!report.codeReady) process.exitCode=1;
  if(process.argv.includes("--require-production")) process.exitCode=2;
}
