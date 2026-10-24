import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { createTrajectoryHandler } from "./handler.mjs";

// GitHub Pages UI remains public. The user's SAVED routes are private.
// Configure additional trusted origins only after approving a custom domain.
const handle = createTrajectoryHandler({
  createClient,
  env: name => Deno.env.get(name),
  allowedOrigins: ["https://pabloinaciosilvestreinacio-collab.github.io"]
});
Deno.serve(handle);
