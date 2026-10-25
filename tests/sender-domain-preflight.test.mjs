import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {
  normalizeCandidate,inspectEvidence,summarizeDns,probeDns,offlineCheck
} from "../scripts/sender-domain-preflight.mjs";

test("No approved domain or DNS control: real site remains NO-GO",()=>{
  const r=offlineCheck();
  assert.equal(r.productionReady,false);
  assert.equal(r.dnsOperatorVerified,false);
  assert.equal(r.senderDomain,null);
  assert.equal(r.manifestChecked,true);
  assert.equal(r.senderProviderChoiceStillPending,true);
  assert(r.blockers.includes("NO_VERIFIED_SENDER_DOMAIN"));
  assert(r.blockers.includes("NO_AUTHORIZED_DNS_OPERATOR"));
});
test("Email providers and shared public hosts cannot be treated as sender-owned domains",()=>{
  for(const x of [
    null, "", "gmail.com","foo.gmail.com","github.io","mecatiger.github.io",
    "hotmail.com","outlook.com","localhost","example.com","t.test",
    "http://school.edu.br", "school.edu.br/abc", "school.edu.br:443",
    "pablo@school.edu.br", "a..school.edu.br", "-bad.school.edu.br",
    "127.0.0.1","192.168.0.1","foo_.edu.br"
  ])assert.equal(normalizeCandidate(x),null,JSON.stringify(x));
  assert.equal(normalizeCandidate("  MECA.SCHOOL.EDU.BR.  "),"meca.school.edu.br");
});
test("DNS presence is observability, never proof of control nor SMTP delivery",()=>{
  const r=summarizeDns({
    domain:"smtp.school.edu.br",selector:"mselector",
    txt:[["v=spf1 include:_spf.mail.example -all"]],
    dmarc:[["v=DMARC1; p=reject; rua=mailto:reports@school.edu.br"]],
    dkim:[["v=DKIM1; k=rsa; p=FAKE_PUBLIC_RECORD_ONLY"]],
    mx:[{exchange:"mx.smtp.school.edu.br",priority:10}]
  });
  assert.equal(r.observed.spfRecords,1);
  assert.equal(r.observed.dmarcRecords,1);
  assert.equal(r.observed.dkimRecordPresent,true);
  assert.equal(r.observed.mxRecords,1);
  assert.equal(r.productionReady,false);
  assert.equal(r.dnsProven,false);
  assert(r.flags.includes("DNS_VISIBILITY_NOT_PROOF_OF_CONTROL"));
});
test("Missing SPF, DKIM, DMARC and conflicting SPF generate explicit warnings",()=>{
  const r=summarizeDns({
    domain:"send.school.edu.br",
    txt:[["v=spf1 include:one.example -all"],["v=spf1 include:two.example -all"]],
    dmarc:[],dkim:[],mx:[],selector:"mailer"
  });
  assert(r.flags.includes("MULTIPLE_SPF_RECORDS"));
  assert(r.flags.includes("DMARC_NOT_OBSERVED_AT_SENDER_DOMAIN"));
  assert(r.flags.includes("DKIM_NOT_OBSERVED_FOR_SELECTOR"));
  assert.equal(r.productionReady,false);
});
test("Read-only DNS probe uses supplied resolver, never changes DNS nor assumes authorization",async()=>{
  const requested=[];
  const fake={
    resolveTxt:async name=>{requested.push(["TXT",name]);
      if(name==="_dmarc.mail.school.edu.br")return [["v=DMARC1;p=none"]];
      if(name==="s1._domainkey.mail.school.edu.br")return [["v=DKIM1;p=FAKE"]];
      return [["v=spf1 -all"]];},
    resolveCname:async name=>{requested.push(["CNAME",name]);return [];},
    resolveMx:async name=>{requested.push(["MX",name]);return [];}
  };
  const result=await probeDns("mail.school.edu.br",{selector:"s1",resolver:fake});
  assert.deepEqual(requested,[
    ["TXT","mail.school.edu.br"],
    ["TXT","_dmarc.mail.school.edu.br"],
    ["TXT","s1._domainkey.mail.school.edu.br"],
    ["CNAME","s1._domainkey.mail.school.edu.br"],
    ["MX","mail.school.edu.br"]
  ]);
  assert.equal(result.validDomain,true);
  assert.equal(result.productionReady,false);
  await assert.rejects(probeDns("mecatiger.github.io",{resolver:fake}),/Invalid domain/);
  await assert.rejects(probeDns("school.edu.br",{selector:"x/../../x",resolver:fake}),/Invalid DKIM selector/);
});
test("Domain operator approval and hosted setup cannot be fabricated by an offline script",()=>{
  const fake={
    evidence:{
      verified_owned_sender_domain:"mail.school.edu.br",
      institutional_dns_permission:"approved_by_dns_owner",
      provider_account_approved:true,dns_records_validated:true,live_smtp_test:true,
      hosted_supabase_auth_configured:true
    }
  };
  const r=inspectEvidence(fake);
  assert.equal(r.dnsOperatorVerified,true);
  assert.equal(r.blockers.length,0);
  assert.equal(r.productionReady,false);
  assert.equal(r.providerEnabled,false);
});
test("CLI preflight stays blocked even with green structural checks",()=>{
  for(const [args,code] of [[[],0],[["--require-verified-domain"],3],[["--authorize-production"],4]]){
    const r=spawnSync(process.execPath,["scripts/sender-domain-preflight.mjs",...args],
      {encoding:"utf8",timeout:12000});
    assert.equal(r.status,code,r.stderr+"\n"+r.stdout);
    const report=JSON.parse(r.stdout);
    assert.equal(report.productionReady,false);
  }
});
