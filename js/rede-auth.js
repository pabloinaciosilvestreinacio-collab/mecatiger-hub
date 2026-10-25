import { supabase, safeReturn } from "./rede-client.js?v=20261025d";
import { isVerifiedMember } from "./rede-identity.mjs?v=20261025d";

const status = document.getElementById("auth-status");
const sendForm = document.getElementById("send-code");
const emailInput = document.getElementById("auth-email");
const next = safeReturn(new URLSearchParams(location.search).get("next"));
const savedNextKey = "mecatiger-auth-return";
// Preserve only allowlisted routes; the link template must append token params with &.
const redirectUrl = new URL(`entrar.html?next=${encodeURIComponent(next)}`, location.href).href;

function tell(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

async function finishLogin() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !isVerifiedMember(data.user)) {
    tell("É necessário confirmar um e-mail válido para acessar a Rede.", true);
    return false;
  }
  tell("Sessão confirmada. Entrando na Rede...");
  const destination = safeReturn(sessionStorage.getItem(savedNextKey) || next);
  sessionStorage.removeItem(savedNextKey);
  location.replace(destination);
  return true;
}

sessionStorage.setItem(savedNextKey, next);
(async () => {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  if (code) {
    history.replaceState({}, "", location.pathname);
    tell("Verificando link de entrada...");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) { tell("Link expirado ou inválido. Solicite outro e-mail.", true); return; }
    await finishLogin();
    return;
  }
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash) {
    // Token hashes must never be kept in browser history after use.
    history.replaceState({}, "", location.pathname);
    if (!["email", "magiclink"].includes(type)) { tell("Link inválido. Solicite outro e-mail.", true); return; }
    tell("Verificando link de entrada...");
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) { tell("Link expirado ou inválido. Solicite outro e-mail.", true); return; }
    await finishLogin();
    return;
  }
  const { data } = await supabase.auth.getUser();
  if (isVerifiedMember(data.user)) await finishLogin();
  else tell("Informe seu e-mail para solicitar um link de acesso.");
})().catch(() => tell("Não foi possível verificar sua sessão. Tente novamente.", true));

sendForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  if (email.length > 320 || !emailInput.checkValidity()) return;
  const button = sendForm.querySelector("button");
  button.disabled = true;
  tell("Solicitando acesso por e-mail...");
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl, shouldCreateUser: true }
    });
    if (error) throw error;
    tell("Confira seu e-mail e abra o link de acesso. Ele é pessoal e expira; não o encaminhe a outras pessoas.");
  } catch (error) {
    tell("Não foi possível solicitar o acesso. Confira o e-mail e tente novamente mais tarde.", true);
  } finally {
    button.disabled = false;
  }
});
