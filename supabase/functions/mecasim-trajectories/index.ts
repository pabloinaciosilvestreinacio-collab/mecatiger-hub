import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { createTrajectoryHandler } from "./handler.mjs";

// GitHub Pages UI remains public. The user's SAVED routes are private.
// The loopback origin is for local homologation, not a replacement for JWT or RLS.
// Configure additional real origins only after reviewing their session isolation.
const handle = createTrajectoryHandler({
  createClient,
  env: name => Deno.env.get(name),
  allowedOrigins: ["https://pabloinaciosilvestreinacio-collab.github.io", "http://127.0.0.1:8080"]
});
Deno.serve(handle);
