import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

await mkdir("test-results", { recursive: true });
await build({
  entryPoints: ["@supabase/supabase-js"],
  outfile: "test-results/supabase-browser.mjs",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome120"],
  logLevel: "warning"
});
