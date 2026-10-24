// Local-only Supabase CLI environment reader. NEVER commit or log returned keys.
// Invokes supabase status -o env (not supabase link or cloud management).
import { execFileSync } from "node:child_process";

function readValue(input) {
  const value = input.trim();
  return (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
    ? value.slice(1, -1) : value;
}

export function loadLocalSupabase() {
  let raw;
  try {
    raw = execFileSync("supabase", ["status", "-o", "env"], {
      encoding:"utf8", stdio:["ignore","pipe","pipe"], timeout:20000,
      maxBuffer:1024*512
    });
  } catch {
    throw new Error(
      "O Supabase CLI local não está ativo. Execute supabase start e confira supabase status --help."
    );
  }
  return parseLocalStatus(raw);
}

export function parseLocalStatus(raw) {
  const values = {};
  for (const line of raw.split(/\r?\n/u)) {
    const match = line.trim().match(/^([A-Z][A-Z0-9_]*)=(.*)$/u);
    if (match) values[match[1]] = readValue(match[2]);
  }
  const api = (values.API_URL || "").replace("localhost", "127.0.0.1");
  if (api !== "http://127.0.0.1:54321") {
    // Refuse to use admin keys against remote instances, even if env is wrong.
    throw new Error("ABORTADO: o endpoint do Supabase não é exatamente 127.0.0.1:54321.");
  }
  const publicKey = values.PUBLISHABLE_KEY || values.ANON_KEY;
  const adminKey = values.SERVICE_ROLE_KEY || values.SECRET_KEY;
  if (!publicKey || !adminKey) {
    throw new Error("Supabase CLI local sem chaves esperadas. Verifique supabase status -o env sem publicar a saída.");
  }
  return Object.freeze({api, publicKey, adminKey});
}
