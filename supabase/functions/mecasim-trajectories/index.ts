import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { createTrajectoryHandler } from "./handler.mjs";
import { ALLOWED_TRAJECTORY_ORIGINS } from "./origins.mjs";

// GitHub Pages UI remains public. The user's SAVED routes are private.
// Preserve the old Pages origin during transition; accept only registered HTTPS origins.
const handle = createTrajectoryHandler({
  createClient,
  env: name => Deno.env.get(name),
  allowedOrigins: ALLOWED_TRAJECTORY_ORIGINS
});
Deno.serve(handle);
