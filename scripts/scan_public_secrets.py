#!/usr/bin/env python3
"""Scan committed files for common credentials without printing secret values.

This is a guardrail, not proof of security. Enable GitHub secret-scanning push
protection and keep privileged credentials out of the frontend and Git history.
"""
from __future__ import annotations
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_FILE_BYTES = 2_000_000
BAD_NAMES = {".env", ".npmrc", ".pypirc", ".netrc", ".pgpass", ".htpasswd", "id_rsa", "id_ed25519"}
SAFE_ENV_EXAMPLES = {".env.example", ".env.sample", ".env.template"}
BAD_EXTENSIONS = {".pem", ".p12", ".pfx", ".key", ".jks", ".keystore", ".sqlite", ".sqlite3", ".db", ".dump"}
BAD_COMPONENTS = {".ssh", ".aws", ".gcloud", ".supabase", ".vercel"}
BAD_NAME_PATTERNS = (
    re.compile(r"(?:service[-_]?account|credentials?|secrets?)[^/]*\.(?:json|yaml|yml|toml|ini)$", re.I),
    re.compile(r"(?:backup|database|production)[^/]*\.(?:sql\.gz|tar|zip)$", re.I),
)
PATTERNS = (
    ("private key PEM", re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----")),
    ("Supabase privileged key", re.compile(r"\bsb_secret_[A-Za-z0-9_-]{10,}\b")),
    ("GitHub classic token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{25,}\b")),
    ("GitHub fine-grained token", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{30,}\b")),
    ("OpenAI secret", re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b")),
    ("AWS access key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
    ("Google API key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("Stripe secret", re.compile(r"\b(?:sk_live|rk_live)_[A-Za-z0-9]{12,}\b")),
    ("Slack token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{15,}\b")),
    ("GitLab token", re.compile(r"\bglpat-[A-Za-z0-9_-]{15,}\b")),
    ("npm token", re.compile(r"\bnpm_[A-Za-z0-9]{20,}\b")),
    ("JWT token", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("database connection URI", re.compile(r"\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s'\"<>]+", re.I)),
    ("literal privileged credential", re.compile(r"\b(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|DATABASE_PASSWORD|PRIVATE_KEY|CLIENT_SECRET)\s*[:=]\s*['\"][^'\"\s]{12,}['\"]", re.I)),
)

def forbidden_path(path: Path) -> bool:
    name = path.name.lower()
    if name in BAD_NAMES or (name.startswith(".env.") and name not in SAFE_ENV_EXAMPLES):
        return True
    if path.suffix.lower() in BAD_EXTENSIONS or any(p.lower() in BAD_COMPONENTS for p in path.parts):
        return True
    if path.parts[:2] == (".github", "workflows"):
        return False  # workflow names may contain "secret"; their contents are scanned
    return any(p.search(name) for p in BAD_NAME_PATTERNS)

def scan_text(content: str):
    for label, pattern in PATTERNS:
        for match in pattern.finditer(content):
            yield content.count("\n", 0, match.start()) + 1, label

def main() -> int:
    try:
        result = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True)
    except (OSError, subprocess.CalledProcessError):
        print("ERROR: execute in a Git working tree", file=sys.stderr)
        return 2
    paths = [Path(p.decode("utf-8", "surrogateescape")) for p in result.stdout.split(b"\0") if p]
    findings = 0
    checked = 0
    for path in paths:
        if forbidden_path(path):
            print(f"BLOCKED sensitive filename: {path}")
            findings += 1
        full = ROOT / path
        if not full.is_file():
            continue
        if full.stat().st_size > MAX_FILE_BYTES:
            print(f"REVIEW oversized tracked file: {path}")
            findings += 1
            continue
        data = full.read_bytes()
        if b"\0" in data:
            continue
        checked += 1
        for line, label in scan_text(data.decode("utf-8", errors="replace")):
            print(f"POSSIBLE SECRET: {path}:{line} ({label})")
            findings += 1
    print(f"Scanned {checked} text files, {len(paths)} tracked paths; alerts: {findings}.")
    print("Pattern matching cannot guarantee absence of secrets or sensitive image metadata.")
    return 1 if findings else 0

if __name__ == "__main__":
    sys.exit(main())
