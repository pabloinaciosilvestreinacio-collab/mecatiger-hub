import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

await mkdir(".mecatiger-browser-build", { recursive: true });
await build({
  entryPoints: ["@supabase/supabase-js"],
  outfile: ".mecatiger-browser-build/supabase-browser.mjs",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome120"],
  logLevel: "warning"
});
