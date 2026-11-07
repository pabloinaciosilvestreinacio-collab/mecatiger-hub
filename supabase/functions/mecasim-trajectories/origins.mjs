// Explicit CORS origins for the private Meca Sim trajectories API.
// CORS is not authorization: gateway JWT verification and table RLS are mandatory.
// The registered domain is allowlisted in advance WITHOUT changing DNS, Pages or Auth.
export const PUBLIC_TRAJECTORY_ORIGINS = Object.freeze([
  "https://pabloinaciosilvestreinacio-collab.github.io",
  "https://mecatiger.com.br",
  "https://www.mecatiger.com.br"
]);

export const LOCAL_TRAJECTORY_ORIGINS = Object.freeze([
  "http://127.0.0.1:8000",
  "http://localhost:8000"
]);

export const ALLOWED_TRAJECTORY_ORIGINS = Object.freeze([
  ...PUBLIC_TRAJECTORY_ORIGINS,
  ...LOCAL_TRAJECTORY_ORIGINS
]);
