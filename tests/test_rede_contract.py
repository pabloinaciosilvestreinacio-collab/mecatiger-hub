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

if __name__=="__main__": unittest.main()
