/**
 * Meca Tiger release preflight — read-only and OFFLINE.
 * This script never connects to Supabase/GitHub, deploys, reads secrets or
 * promotes a release. It separates code readiness from human approvals.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_MIGRATIONS = Object.freeze([
  "20261025032012_rede_mecatiger_mvp.sql",
  "20261025032022_require_nonanonymous_identity.sql",
  "20261025032028_mecasim_private_trajectories.sql",
  "20261025032035_mecatiger_site_cms.sql",
  "20261025140000_rede_request_messages.sql",
  "20261025160000_admin_access_and_team_members.sql",
  "20261025170000_fix_admin_access_email_return_type.sql"
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
    "Sete migrations allowlisted, únicas e em ordem; conferência estrutural, não revisão SQL completa");
  const community=read("supabase/migrations/20261025032012_rede_mecatiger_mvp.sql");
  const anon=read("supabase/migrations/20261025032022_require_nonanonymous_identity.sql");
  const sim=read("supabase/migrations/20261025032028_mecasim_private_trajectories.sql");
  const cms=read("supabase/migrations/20261025032035_mecatiger_site_cms.sql");
  const messages=read("supabase/migrations/20261025140000_rede_request_messages.sql");
  const team=read("supabase/migrations/20261025160000_admin_access_and_team_members.sql");
  const accessFix=read("supabase/migrations/20261025170000_fix_admin_access_email_return_type.sql");
  check("schema-rls",
    ["rede_profiles","rede_moderators","rede_posts","rede_comments","rede_requests","rede_reports"]
      .every(t=>community.includes("alter table public."+t+" enable row level security")) &&
      messages.includes("rede_request_messages enable row level security") &&
      sim.includes("mecasim_trajectories enable row level security") &&
      ["meca_site_editors","meca_site_copy","meca_site_gallery","meca_site_pages"].every(t=>cms.includes("alter table public."+t+" enable row level security")) &&
      ["meca_site_admins","meca_site_team_members"].every(t=>team.includes("alter table public."+t+" enable row level security")) && accessFix.includes("u.email::text"),
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
  check("browser-routes",/src="js\/cms-public\.js\?v=[^"]+"/.test(home) &&
    home.includes('href="admin.html"') && /src="js\/cms-public\.js\?v=[^"]+"/.test(rede) &&
    /src="js\/rede-auth\.js\?v=[^"]+"/.test(entry) &&
    existsSync(at("admin.html")) && existsSync(at("js/admin.js")) &&
    read("js/admin.js").includes('rpc("meca_site_is_admin")') &&
    read("js/admin.js").includes('rpc("meca_site_set_access"') &&
    existsSync(at("pagina.html")) && existsSync(at("conteudo.html")),
    "Rotas, editor e CMS existem nos artefatos estáticos");
  const edge=read("supabase/functions/mecasim-trajectories/index.ts");
  const privateSim=read("js/mecasim-private.js");
  check("edge-present",!privateSim.includes("location.hostname") && edge.includes("createTrajectoryHandler") && edge.includes("Deno.serve(handle)") && existsSync(at("supabase/functions/mecasim-trajectories/handler.mjs")),
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
    console.log(report.summary);
    console.log("Bloqueios operacionais pendentes: "+report.externalGates.length);
    console.log("Nenhum deploy, merge, alteração de banco ou autorização efetuados.");
  }
  if(!report.codeReady) process.exitCode=1;
  if(process.argv.includes("--require-production")) process.exitCode=2;
}
