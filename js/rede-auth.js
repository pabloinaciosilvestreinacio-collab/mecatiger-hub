import { supabase, safeReturn } from "./rede-client.js";

const status = document.getElementById("auth-status");
const sendForm = document.getElementById("send-code");
const verifyForm = document.getElementById("verify-code");
const emailInput = document.getElementById("auth-email");
const codeInput = document.getElementById("auth-code");
const next = safeReturn(new URLSearchParams(location.search).get("next"));
const savedNextKey = "mecatiger-auth-return";
const redirectUrl = new URL("entrar.html", location.href).href;
let lastEmail = "";

function tell(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

async function finishLogin() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  tell("Sessão confirmada. Entrando na Rede...");
  const destination = safeReturn(sessionStorage.getItem(savedNextKey) || next);
  sessionStorage.removeItem(savedNextKey);
  location.replace(destination);
  return true;
}

sessionStorage.setItem(savedNextKey, next);
(async () => {
  const params = new URLSearchParams(location.search);
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash) {
    // Token hashes must never be kept in browser history after use.
    history.replaceState({}, "", location.pathname);
    if (type !== "email") { tell("Link inválido. Solicite outro e-mail.", true); return; }
    tell("Verificando link de entrada...");
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (error) { tell("Link expirado ou inválido. Solicite outro e-mail.", true); return; }
    await finishLogin();
    return;
  }
  const { data } = await supabase.auth.getUser();
  if (data.user) await finishLogin();
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
    lastEmail = email;
    verifyForm.hidden = false;
    tell("Confira seu e-mail. Use o código recebido ou abra o link de acesso. Se não receber, aguarde antes de tentar novamente.");
    codeInput.focus();
  } catch (error) {
    tell("Não foi possível solicitar o acesso. Confira o e-mail e tente novamente mais tarde.", true);
  } finally {
    button.disabled = false;
  }
});

verifyForm.addEventListener("submit", async event => {
  event.preventDefault();
  const token = codeInput.value.replace(/\s/g, "");
  if (!lastEmail || !/^\d{6,8}$/.test(token)) { tell("Digite o código recebido por e-mail.", true); return; }
  const button = verifyForm.querySelector("button");
  button.disabled = true;
  tell("Verificando código...");
  try {
    const { error } = await supabase.auth.verifyOtp({ email: lastEmail, token, type: "email" });
    if (error) throw error;
    await finishLogin();
  } catch (error) {
    tell("Código inválido ou expirado. Verifique o e-mail ou solicite outro.", true);
  } finally {
    button.disabled = false;
  }
});
