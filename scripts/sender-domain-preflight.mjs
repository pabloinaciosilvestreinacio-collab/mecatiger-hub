/**
 * Meca Tiger sending-domain preflight.
 * Default mode is entirely offline; --probe DOMAIN makes DNS *read-only*
 * queries to public resolvers. Never changes GitHub Pages, DNS or Supabase.
 */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {resolveTxt,resolveCname,resolveMx} from "node:dns/promises";

const ROOT=resolve(fileURLToPath(new URL("..",import.meta.url)));
const SHARED_DOMAINS=new Set([
  "github.io","gmail.com","googlemail.com","outlook.com","hotmail.com",
  "yahoo.com","icloud.com","proton.me","protonmail.com","live.com"
]);
const RESERVED_TLDS=new Set(["localhost","local","internal","invalid","example","test"]);
const DOMAIN_LABEL=/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
export function normalizeCandidate(value) {
  if(typeof value!=="string")return null;
  const s=value.trim().toLowerCase().replace(/\.$/,"");
  if(s.length>253 || s.length<4 || s.includes(".."))return null;
  const labels=s.split(".");
  if(labels.length<2||labels.some(x=>!DOMAIN_LABEL.test(x)))return null;
  if(RESERVED_TLDS.has(labels.at(-1)) || labels.at(-1).length<2)return null;
  if([...SHARED_DOMAINS].some(x=>s===x||s.endsWith("."+x)))return null;
  if(/^[0-9.]+$/.test(s))return null;
  return s;
}
function readManifest(root=ROOT) {
  return JSON.parse(readFileSync(resolve(root,"release/sender-domain-status-20261024.json"),"utf8"));
}
export function inspectEvidence(manifest) {
  const e=manifest?.evidence||{};
  const domain=normalizeCandidate(e.verified_owned_sender_domain);
  const domainsNeedApproval=(
    e.institutional_dns_permission!=="approved_by_dns_owner" &&
    e.institutional_dns_permission!=="owned_by_team_with_dns_access"
  );
  const blockers=[];
  if(!domain)blockers.push("NO_VERIFIED_SENDER_DOMAIN");
  if(domainsNeedApproval)blockers.push("NO_AUTHORIZED_DNS_OPERATOR");
  if(!e.provider_account_approved)blockers.push("SMTP_PROVIDER_ACCOUNT_NOT_APPROVED");
  if(!e.dns_records_validated)blockers.push("SENDER_DNS_RECORDS_NOT_VALIDATED");
  if(!e.live_smtp_test)blockers.push("CONSENTED_REAL_MAIL_DELIVERY_NOT_TESTED");
  if(!e.hosted_supabase_auth_configured)blockers.push("HOSTED_AUTH_CONFIGURATION_NOT_APPROVED");
  return {
    senderDomain:domain,
    dnsOperatorVerified:!domainsNeedApproval,
    inspectionMode:"offline",
    blockers,
    dnsProven:false,
    providerEnabled:false,
    productionReady:false,
    message:"Preparação não autoriza domínio, DNS, SMTP, alterações hospedadas ou merge."
  };
}
export function summarizeDns({domain,txt=[],dmarc=[],dkim=[],mx=[],selector=null}={}) {
  const normalized=normalizeCandidate(domain);
  if(!normalized)return {validDomain:false,productionReady:false,observed:{},flags:["INVALID_OR_SHARED_DOMAIN"]};
  const join=items=>items.map(x=>Array.isArray(x)?x.join(""):String(x));
  const spf=join(txt).filter(x=>/^v=spf1(?:\s|$)/i.test(x));
  const dmarcRecords=join(dmarc).filter(x=>/^v=dmarc1(?:;|\s|$)/i.test(x));
  const dkimRecords=join(dkim);
  const result={
    validDomain:true,
    senderDomain:normalized,
    inspectionMode:"public_dns_read_only",
    observed:{
      spfRecords:spf.length,
      dmarcRecords:dmarcRecords.length,
      dkimRecordPresent:dkimRecords.some(x=>/^(v=DKIM1|[a-z0-9_.-]+\.)/i.test(x)) || dkimRecords.length>0,
      mxRecords:mx.length,
      selectorSupplied:typeof selector==="string"&&selector.length>0
    },
    flags:[],
    dnsProven:false,
    providerEnabled:false,
    productionReady:false
  };
  if(spf.length===0)result.flags.push("SPF_NOT_OBSERVED_AT_SENDER_DOMAIN");
  if(spf.length>1)result.flags.push("MULTIPLE_SPF_RECORDS");
  if(dmarcRecords.length===0)result.flags.push("DMARC_NOT_OBSERVED_AT_SENDER_DOMAIN");
  if(dmarcRecords.length>1)result.flags.push("MULTIPLE_DMARC_RECORDS");
  if(!selector)result.flags.push("DKIM_SELECTOR_NOT_SUPPLIED");
  else if(!result.observed.dkimRecordPresent)result.flags.push("DKIM_NOT_OBSERVED_FOR_SELECTOR");
  result.flags.push("DNS_VISIBILITY_NOT_PROOF_OF_CONTROL");
  result.flags.push("CHECK_PROVIDER_GENERATED_RECORDS_EXACTLY_BEFORE_AUTHORIZING");
  return result;
}
function toErrorCode(error) {
  return ["ENOTFOUND","ENODATA","ENOTIMP","ETIMEOUT","ESERVFAIL"].includes(error?.code)
    ? error.code : "DNS_LOOKUP_FAILED";
}
export async function probeDns(domain,{selector=null,resolver={resolveTxt,resolveCname,resolveMx}}={}) {
  const d=normalizeCandidate(domain);
  if(!d)throw new Error("Invalid domain: only an owned or authorized DNS candidate is allowed");
  if(selector!==null && (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(selector))) {
    throw new Error("Invalid DKIM selector");
  }
  const read=async(fn,name)=>{try{return await fn(name);}catch(err){
    // DNS absent is not a green check; return as missing, without logging TXT values.
    if(["ENOTFOUND","ENODATA","ENOTIMP"].includes(err.code))return [];
    throw new Error(toErrorCode(err));
  }};
  const txt=await read(resolver.resolveTxt,d);
  const dmarc=await read(resolver.resolveTxt,"_dmarc."+d);
  let dkim=[];
  if(selector){
    const host=selector+"._domainkey."+d;
    const [foundTxt,foundCname]=await Promise.all([
      read(resolver.resolveTxt,host),
      read(resolver.resolveCname,host)
    ]);
    dkim=[...foundTxt,...foundCname];
  }
  const mx=await read(resolver.resolveMx,d);
  return summarizeDns({domain:d,txt,dmarc,dkim,mx,selector});
}
export function offlineCheck(root=ROOT) {
  const manifest=readManifest(root);
  const evidence=inspectEvidence(manifest);
  if(manifest.production_ready!==false)throw Error("Domain manifest must not authorize production");
  if(!manifest.evidence?.github_pages_default_origin?.startsWith("https://"))
    throw Error("GitHub Pages reference missing");
  if(manifest.evidence.github_pages_settings_domain!=="not_verified")
    throw Error("Cannot assert hosted GitHub Pages domain settings without verification");
  if(!Array.isArray(manifest.options)||manifest.options.length!==3)
    throw Error("Domain plan must contain exactly three no-cost choices");
  return {
    ...evidence,
    manifestChecked:true,
    senderProviderChoiceStillPending:manifest.evidence.provider==="not_selected",
    costApprovalRequired:true
  };
}
async function main() {
  const args=process.argv.slice(2);
  const at=args.indexOf("--probe");
  const selectorAt=args.indexOf("--selector");
  if(selectorAt>=0 && at<0)throw Error("Selector requires --probe DOMAIN");
  if(at>=0 && (!args[at+1]||args[at+1].startsWith("--")))throw Error("Missing DNS domain");
  const r=at<0?offlineCheck():await probeDns(args[at+1],{
    selector:selectorAt>=0?args[selectorAt+1]:null
  });
  console.log(JSON.stringify(r,null,2));
  if(!r.validDomain && at>=0)process.exitCode=1;
  if(args.includes("--require-verified-domain"))process.exitCode=3;
  if(args.includes("--authorize-production"))process.exitCode=4;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch(e=>{console.error("Domain preflight blocked: "+e.message);process.exitCode=1;});
}
