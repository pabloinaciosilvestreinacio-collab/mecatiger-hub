"""Static contract checks; authorization requires a separate test database."""
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT/"supabase/migrations/20261024160000_rede_mecatiger_mvp.sql"

class LocalRefs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs=[]
    def handle_starttag(self, tag, attrs):
        info=dict(attrs)
        if tag=="a" and "href" in info: self.refs.append(info["href"])
        if tag=="script" and "src" in info: self.refs.append(info["src"])
        if tag=="link" and "href" in info: self.refs.append(info["href"])

class RedeContracts(unittest.TestCase):
    def test_routes(self):
        for p in ("rede.html","entrar.html","rede.css","js/rede-client.js",
                  "js/rede-auth.js","js/rede.js","js/sim-gate.js"):
            with self.subTest(file=p): self.assertTrue((ROOT/p).is_file())

    def test_internal_references(self):
        for page in ROOT.glob("*.html"):
            parser=LocalRefs()
            parser.feed(page.read_text(encoding="utf-8"))
            for ref in parser.refs:
                url=urlsplit(ref)
                if url.scheme or ref.startswith(("#","//","mailto:")) or not url.path: continue
                with self.subTest(page=page.name,target=ref):
                    self.assertTrue((ROOT/url.path.lstrip("/")).is_file(), ref)

    def test_text_rendering(self):
        code=(ROOT/"js/rede.js").read_text(encoding="utf-8")
        self.assertIn(".textContent",code)
        self.assertNotIn(".innerHTML",code)
        self.assertIn("getUser()",code)

    def test_auth_client(self):
        code=(ROOT/"js/rede-client.js").read_text(encoding="utf-8")
        self.assertIn("sb_publishable_",code)
        self.assertNotIn("sb_secret_",code)
        self.assertNotIn("service_role",code)
        self.assertIn("flowType: \"pkce\"",code)
        self.assertIn("safeReturn",code)

    def test_rls_contract(self):
        sql=MIGRATION.read_text(encoding="utf-8").lower()
        for table in ("rede_profiles","rede_moderators","rede_posts","rede_comments",
                      "rede_requests","rede_reports","rede_moderation_log"):
            with self.subTest(table=table):
                self.assertIn(f"alter table public.{table} enable row level security",sql)
        self.assertIn("rate limit reached",sql)
        self.assertIn("new.created_at := now()",sql)
        self.assertIn("create schema if not exists app_private",sql)
        self.assertNotIn("grant insert on public.rede_moderators",sql)

    def test_simulator_limitation(self):
        gate=(ROOT/"js/sim-gate.js").read_text(encoding="utf-8")
        self.assertIn("getUser()",gate)
        self.assertIn("publicly retrievable",gate)
        self.assertIn('src="js/sim-gate.js"',(ROOT/"mecasim-demo.html").read_text(encoding="utf-8"))


    def test_social_actions_do_not_fake_success(self):
        source=(ROOT/"js/rede.js").read_text(encoding="utf-8")
        for table in ("rede_profiles","rede_posts","rede_comments","rede_requests",
                      "rede_reports","rede_moderators"):
            with self.subTest(table=table):
                self.assertIn(f'from("{table}")',source)
        self.assertIn("profileReady",source)
        self.assertIn("isModerator",source)
        self.assertIn('status","approved"',source)
        self.assertIn("window.confirm(",source)

    def test_public_pages_disclose_private_simulator_limitation(self):
        document=(ROOT/"REDE_MVP.md").read_text(encoding="utf-8")
        self.assertIn("NÃO bloqueia leitura",document)
        self.assertIn("NÃO foi executada",document)
        site=(ROOT/"index.html").read_text(encoding="utf-8")
        self.assertIn("rede.html",site)
        self.assertIn("não cria uma conta autenticada",site)

    def test_no_superuser_access_from_browser(self):
        client=(ROOT/"js/rede-client.js").read_text(encoding="utf-8")
        self.assertNotIn("sb_secret_",client)
        for source in (ROOT/"js/rede-auth.js",ROOT/"js/rede.js",ROOT/"js/sim-gate.js"):
            code=source.read_text(encoding="utf-8")
            with self.subTest(file=source.name):
                self.assertNotIn("auth.admin",code)
                self.assertNotIn(".innerHTML",code)

    def test_async_forms_do_not_use_event_currenttarget_after_await(self):
        source=(ROOT/"js/rede.js").read_text(encoding="utf-8")
        self.assertNotIn("event.currentTarget.reset()",source)
        self.assertGreaterEqual(source.count("const form=event.currentTarget"),2)
        self.assertIn("form.reset()",source)

    def test_identity_operations_are_gated_until_profile_and_role_load(self):
        source=(ROOT/"js/rede.js").read_text(encoding="utf-8")
        self.assertIn("function syncIdentityControls()",source)
        self.assertIn("identityLoading",source)
        self.assertIn("identityResolved",source)
        self.assertIn("epoch !== identityEpoch",source)
        self.assertIn("button.disabled = !usable",source)
        self.assertIn('$("post-form").hidden = !usable || !profileReady',source)
        self.assertIn('$("profile-form").querySelector(\'button[type="submit"]\').disabled = !usable',source)
        self.assertIn("identityResolved = !profile.error && !mod.error",source)
        self.assertIn('$("own-items").replaceChildren()',source)
        self.assertIn('$("mod-items").replaceChildren()',source)

    def test_rede_participation_is_explicit_and_not_falsely_populated(self):
        page=(ROOT/"rede.html").read_text(encoding="utf-8")
        main=(ROOT/"index.html").read_text(encoding="utf-8")
        editorial=(ROOT/"REDE_CONTEUDOS_INICIAIS.md").read_text(encoding="utf-8")
        operations=(ROOT/"REDE_OPERACAO_LANCAMENTO.md").read_text(encoding="utf-8")
        privacy=(ROOT/"REDE_PRIVACIDADE_REVISAO.md").read_text(encoding="utf-8")
        self.assertIn('id="como-funciona"',page)
        self.assertIn('aria-labelledby="como-funciona-title"',page)
        self.assertIn("<ol",page)
        for step in ("Explore sem entrar", "Entre com e-mail confirmado",
                     "Envie conteúdo ou um pedido", "Aguarde a análise"):
            self.assertIn(step,page)
        for anchor in ('rede.html#ajuda','rede.html#conexao','rede.html#compartilhar'):
            self.assertIn(anchor,main)
        self.assertIn("não cria uma conta autenticada",main)
        self.assertIn("não cria uma conta",page)
        self.assertIn("não há evidência",editorial)
        self.assertIn("Pendente",editorial)
        self.assertIn("NÃO publicações cadastradas",editorial)
        self.assertIn("não executar",operations.lower())
        self.assertIn("RASCUNHO",privacy)
        self.assertIn("menores",privacy.lower())

    def test_rede_has_privacy_contact_without_false_deletion_guarantee(self):
        page=(ROOT/"rede.html").read_text(encoding="utf-8")
        self.assertIn("mecatiger6@gmail.com",page)
        self.assertIn("retencao",page.lower().replace("ç","c").replace("ã","a"))
        self.assertIn("em revisão",page)
        self.assertNotIn("exclusão imediata",page.lower())


    def test_visual_admin_is_separate_and_never_contains_secrets(self):
        admin=(ROOT/"admin.html").read_text(encoding="utf-8")
        logic=(ROOT/"js/admin.js").read_text(encoding="utf-8")
        model=(ROOT/"js/cms-model.mjs").read_text(encoding="utf-8")
        cms=(ROOT/"js/cms-public.js").read_text(encoding="utf-8")
        migration=(ROOT/"supabase/migrations/20261024190000_mecatiger_site_cms.sql").read_text(encoding="utf-8").lower()
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        for path in ("admin.css","js/admin.js","js/cms-model.mjs","js/cms-public.js","ADMIN_EDITOR.md"):
            self.assertTrue((ROOT/path).is_file(),path)
        self.assertIn('id="admin-content" hidden',admin)
        self.assertIn("meca_site_editors",logic)
        self.assertIn("isVerifiedMember",logic)
        self.assertIn("getUser()",logic)
        self.assertNotIn("service_role",logic.lower())
        self.assertNotIn("auth.admin",logic)
        self.assertNotIn(".innerHTML",cms)
        self.assertIn("textContent",cms)
        self.assertIn("CMS_ASSET_PATH",model)
        self.assertIn("image/webp",logic)
        self.assertIn('data-cms-text="home-intro"',home)
        self.assertIn('id="meca-photo-gallery"',home)
        self.assertIn('href="admin.html"',home)
        self.assertIn("enable row level security",migration)
        self.assertIn("verified editors can upload webp gallery assets",migration)
        self.assertIn("for insert to authenticated",migration)
        self.assertIn("for update to authenticated",migration)
        self.assertNotIn("grant insert on public.meca_site_editors to authenticated",migration)
        self.assertNotIn("for delete to authenticated",migration)

if __name__=="__main__": unittest.main()
