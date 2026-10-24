import { validateTrajectory, validRouteId } from "./trajectory-validation.mjs";

const MAX_BODY = 5000;

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}

async function limitedJson(req) {
  if (!req.body) throw new RangeError("Missing request body");
  const reader = req.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) throw new RangeError("Request too large");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer));
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RangeError("Invalid request");
  }
  return body;
}

/**
 * This HTTP handler can be unit tested with injected clients.
 * In production createClient uses ONLY a publishable/anon key and forwards
 * the user's Authorization JWT so every table operation is subject to RLS.
 * The gateway's verify_jwt=true provides another token validation layer.
 */
export function createTrajectoryHandler({ createClient, env, allowedOrigins }) {
  return async function trajectoryHandler(req) {
    const origin = req.headers.get("Origin");
    const allowOrigin = origin && allowedOrigins.includes(origin);
    const cors = { "Vary": "Origin",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS" };
    if (allowOrigin) cors["Access-Control-Allow-Origin"] = origin;
    if (origin && !allowOrigin) return json({ error: "Origin not allowed" }, 403, cors);
    if (req.method === "OPTIONS") return new Response(null, {status: 204, headers: cors});
    if (req.method !== "POST") return json({error:"Method not allowed"},405,cors);

    const header = req.headers.get("Authorization") ?? "";
    if (!/^Bearer [^\s]+$/i.test(header)) {
      return json({error:"Authentication required"},401,cors);
    }
    const token = header.slice(7);
    const url = env("SUPABASE_URL");
    let key;
    try { key = JSON.parse(env("SUPABASE_PUBLISHABLE_KEYS") || "{}").default; }
    catch { key = undefined; }
    key ||= env("SUPABASE_ANON_KEY");
    if (!url || !key) return json({error:"Service not configured"},503,cors);

    // Per-request client: do not share JWT context across requests.
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: header } }
    });
    let identity;
    try {
      const {data, error} = await client.auth.getUser(token);
      if (error || !data?.user) return json({error:"Invalid or expired session"},401,cors);
      identity = data.user;
    } catch {
      return json({error:"Authentication unavailable"},503,cors);
    }
    if (identity.is_anonymous !== false || !identity.email ||
        !identity.email_confirmed_at || !identity.id) {
      return json({error:"Confirmed email required"},403,cors);
    }

    let body;
    try { body = await limitedJson(req); }
    catch { return json({error:"Invalid request body"},400,cors); }

    try {
      switch (body.action) {
        case "list": {
          const {data,error} = await client.from("mecasim_trajectories")
            .select("id,name,created_at").eq("owner_id",identity.id)
            .order("created_at",{ascending:false}).order("id",{ascending:false}).limit(30);
          if (error) throw error;
          return json({trajectories:data ?? []},200,cors);
        }
        case "save": {
          let route;
          try { route = validateTrajectory(body.name, body.points); }
          catch { return json({error:"Invalid trajectory data"},422,cors); }
          const {data,error} = await client.from("mecasim_trajectories")
            .insert({owner_id:identity.id,...route})
            .select("id,name,created_at").single();
          if (error) throw error;
          return json({trajectory:data},201,cors);
        }
        case "load": {
          if (!validRouteId(body.id)) return json({error:"Invalid route id"},422,cors);
          const {data,error} = await client.from("mecasim_trajectories")
            .select("id,name,points,created_at").eq("owner_id",identity.id)
            .eq("id",body.id).maybeSingle();
          if (error) throw error;
          if (!data) return json({error:"Route not found"},404,cors);
          return json({trajectory:data},200,cors);
        }
        case "remove": {
          if (!validRouteId(body.id)) return json({error:"Invalid route id"},422,cors);
          const {data,error} = await client.from("mecasim_trajectories")
            .delete().eq("owner_id",identity.id).eq("id",body.id)
            .select("id").maybeSingle();
          if (error) throw error;
          if (!data) return json({error:"Route not found"},404,cors);
          return json({deleted:true},200,cors);
        }
        default: return json({error:"Unknown operation"},400,cors);
      }
    } catch (error) {
      if (error?.code === "P0001") return json({error:"Route quota exceeded"},429,cors);
      if (error?.code === "23514" || error?.code === "23502") {
        return json({error:"Invalid route data"},422,cors);
      }
      // Do not leak database details, SQL, user ids or tokens in responses.
      return json({error:"Operation unavailable"},503,cors);
    }
  };
}
