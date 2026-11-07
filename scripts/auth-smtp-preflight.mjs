// Read-only Auth/SMTP preflight for the Meca Tiger GitHub Pages static site.
// Produces no credentials, requests, emails or authorization to deploy.
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {AUTH_RETURN_ROUTES,authAllowedRedirects} from "../js/auth-routing.mjs";

const ROOT=resolve(fileURLToPath(new URL("..",import.meta.url)));
export const SITE_BASE="https://pabloinaciosilvestreinacio-collab.github.io/mecatiger-hub/";
export const AUTH_ROUTES=AUTH_RETURN_ROUTES;
export const HOSTED_REDIRECTS=authAllowedRedirects(SITE_BASE);
export function validateRedirect(target,siteBase=SITE_BASE) {
  return typeof target==="string"&&authAllowedRedirects(siteBase).includes(target);
}
export function assertNoUnsafeRedirect(urls,siteBase=SITE_BASE) {
  const allowed=authAllowedRedirects(siteBase);
  return Array.isArray(urls)&&urls.length===allowed.length&&
    urls.every(v=>validateRedirect(v,siteBase))&&
    new Set(urls).size===allowed.length;
}
const get=(root,p)=>readFileSync(resolve(root,p),"utf8");
export function inspectAuth(root=ROOT) {
  const checks=[];
  const check=(id,passed,note)=>checks.push({id,passed:Boolean(passed),note});
  const client=get(root,"js/rede-client.js");
  const auth=get(root,"js/rede-auth.js");
  const routing=get(root,"js/auth-routing.mjs");
  const identity=get(root,"js/rede-identity.mjs");
  const cms=get(root,"supabase/migrations/20261025032035_mecatiger_site_cms.sql");
  const local=get(root,"supabase/config.toml");
  const options=JSON.parse(get(root,"release/auth-smtp-options-20261024.json"));
  const confirmation=get(root,"release/auth-email-templates/confirmation.html");
  const magic=get(root,"release/auth-email-templates/magic_link.html");
  const recovery=get(root,"release/auth-email-templates/recovery.html");
  check("trusted-production-base",SITE_BASE.startsWith("https://")&&
    new URL(SITE_BASE).hostname==="pabloinaciosilvestreinacio-collab.github.io",
    "Site URL é uma referência para a configuração futura, não a configuração hospedada atual");
  check("strict-redirects",assertNoUnsafeRedirect(HOSTED_REDIRECTS),
    "Apenas URLs exatas de retorno, inclusive recuperação; sem wildcard, host estranho ou rota arbitrária");
  check("frontend-navigation-allowlist",AUTH_ROUTES.every(route=>routing.includes('"'+route+'"'))&&
    client.includes('from "./auth-routing.mjs"')&&auth.includes("safeReturn(")&&
    auth.includes("emailRedirectTo: redirectUrl")&&auth.includes("recoveryRedirectUrl"),
    "O navegador recusa destinos fora da allowlist e envia redirectTo explícito");
  check("pkce-verified-email",client.includes('flowType: "pkce"')&&
    client.includes("detectSessionInUrl: false")&&client.includes("persistSession: true")&&
    client.includes("autoRefreshToken: true")&&client.includes('storageKey: "mecatiger-rede-session-v1"')&&
    auth.includes("signInWithOtp(")&&auth.includes("verifyOtp(")&&
    auth.includes('["email", "magiclink", "recovery"].includes(type)')&&
    auth.includes("verifyOtp({ token_hash: tokenHash, type })")&&
    auth.includes("exchangeCodeForSession(code)")&&
    auth.includes("resetPasswordForEmail(")&&auth.includes("updateUser({ password })")&&
    identity.includes("email_confirmed_at")&&identity.includes("is_anonymous === false"),
    "Sessão exige email confirmado; local testa OTP/Magic Link, hosted ainda não testado");
  check("no-browser-role-bootstrap",cms.includes("meca_site_editors")&&
    !/grant\s+(?:insert|update|delete|all)\s+on\s+public\.meca_site_editors\s+to\s+authenticated/i.test(cms)&&
    cms.includes("enable row level security"),
    "Somente operador autorizado atribui editor; não existe auto-cadastro administrativo");
  check("auth-local-not-hosted",local.includes('site_url = "http://127.0.0.1:8000"')&&
    local.includes("enable_anonymous_sign_ins = false")&&
    local.includes("enable_confirmations = true")&&
    ["127.0.0.1","localhost"].every(host=>authAllowedRedirects("http://"+host+":8000/").every(url=>
      local.includes(JSON.stringify(url)))),
    "A configuração versionada pertence à CLI local, não ao projeto hospedado");
  check("email-templates",confirmation.includes("{{ .ConfirmationURL }}")&&
    magic.includes("{{ .ConfirmationURL }}")&&
    recovery.includes("{{ .ConfirmationURL }}")&&
    !confirmation.includes("{{ .Token }}")&&!magic.includes("{{ .Token }}")&&!recovery.includes("{{ .Token }}")&&
    !confirmation.includes("{{ .Email }}")&&!magic.includes("{{ .Email }}")&&!recovery.includes("{{ .Email }}"),
    "Rascunhos sem PII, rastreamento e código de autenticação publicado em logs");
  check("free-providers-only",options.providers.length===3&&
    options.providers.every(x=>x.smtp===true&&x.verified_domain_required===true&&
      Number.isInteger(x.free_daily||x.free_monthly)&&Boolean(x.docs)),
    "Os limites são fotografia das páginas oficiais, sujeitos a nova conferência");
  return {
    codeReady:checks.every(x=>x.passed),
    productionReady:false,
    hostedConfigVerified:false,
    smtpProvisioned:false,
    firstAdminProvisioned:false,
    recommendedProvider:"resend — somente se possuir domínio verificado e conta $0 aprovada",
    blockers:[
      "Escolher provedor gratuito e verificar requisitos reais de domínio/remetente sem contratar serviço",
      "Configurar SMTP, templates, Site URL e redirects exatos apenas após autorização",
      "Testar Mail Link/OTP para e-mails reais consentidos após autorização",
      "Concluir migrations e credenciar primeiro editor por UUID verificado, nunca com senha compartilhada",
      "Homologar bloqueios RLS e fluxo de revogação e revisar menores/LGPD"
    ],checks
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let report;
  try{report=inspectAuth();}
  catch(err){console.error("Auth preflight stopped: cannot inspect required repository artifacts");process.exit(1);}
  console.log(JSON.stringify(report,null,2));
  if(!report.codeReady)process.exitCode=1;
  if(process.argv.includes("--require-hosted"))process.exitCode=3;
  if(process.argv.includes("--authorize-production"))process.exitCode=4;
}
