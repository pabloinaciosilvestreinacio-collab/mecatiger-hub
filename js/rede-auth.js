import { supabase, safeReturn } from "./rede-client.js?v=20261107a";
import { isVerifiedMember } from "./rede-identity.mjs?v=20261025d";
import { buildAuthEntryUrl, isRecoveryRequest } from "./auth-routing.mjs?v=20261107a";

const status = document.getElementById("auth-status");
const sendForm = document.getElementById("send-code");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const setupForm = document.getElementById("password-setup");
const resetForm = document.getElementById("password-reset");
const params = new URLSearchParams(location.search);
const next = safeReturn(params.get("next"));
const recoveryRequested = isRecoveryRequest(params.get("recovery"));
const savedNextKey = "mecatiger-auth-return";
// Preserve only allowlisted routes; Auth templates append token parameters with &.
const redirectUrl = buildAuthEntryUrl(location.href, next);
// Password recovery intentionally returns to one canonical page, not an arbitrary next value.
const recoveryRedirectUrl = buildAuthEntryUrl(location.href, "rede.html", true);

function tell(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

async function finishLogin(offerPasswordSetup = false) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !isVerifiedMember(data.user)) {
    tell("É necessário confirmar um e-mail válido para acessar a Rede.", true);
    return false;
  }
  if (offerPasswordSetup) {
    sendForm.hidden = true;
    setupForm.hidden = false;
    tell("E-mail confirmado. Crie uma senha para entrar sem depender de um novo link, ou continue sem senha.");
    return true;
  }
  tell("Sessão confirmada. Entrando na Rede...");
  const destination = safeReturn(sessionStorage.getItem(savedNextKey) || next);
  sessionStorage.removeItem(savedNextKey);
  location.replace(destination);
  return true;
}

async function openPasswordReset() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !isVerifiedMember(data.user)) {
    tell("Não foi possível validar este link de recuperação. Solicite outro e-mail.", true);
    return false;
  }
  sendForm.hidden = true;
  setupForm.hidden = true;
  resetForm.hidden = false;
  tell("Link confirmado. Crie uma nova senha para continuar.");
  return true;
}

sessionStorage.setItem(savedNextKey, next);
(async () => {
  const code = params.get("code");
  if (code) {
    history.replaceState({}, "", location.pathname);
    tell("Verificando link de entrada...");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) { tell("Link expirado ou inválido. Solicite outro e-mail.", true); return; }
    if (recoveryRequested) await openPasswordReset();
    else await finishLogin(true);
    return;
  }
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash) {
    // Token hashes must never be kept in browser history after use.
    history.replaceState({}, "", location.pathname);
    if (!["email", "magiclink", "recovery"].includes(type)) { tell("Link inválido. Solicite outro e-mail.", true); return; }
    tell("Verificando link de entrada...");
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) { tell("Link expirado ou inválido. Solicite outro e-mail.", true); return; }
    // Only a verified recovery OTP may open the reset form, never a URL marker on a Magic Link.
    if (type === "recovery") await openPasswordReset();
    else await finishLogin(true);
    return;
  }
  const { data } = await supabase.auth.getUser();
  // The recovery=1 query parameter is only a routing hint, never proof of a valid link.
  if (recoveryRequested) {
    tell("Abra o link de recuperação enviado ao seu e-mail. Apenas esta URL não autoriza trocar a senha.");
    return;
  }
  if (isVerifiedMember(data.user)) await finishLogin();
  else tell("Informe seu e-mail para solicitar um link de acesso.");
})().catch(() => tell("Não foi possível verificar sua sessão. Tente novamente.", true));

sendForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  if (email.length > 320 || !emailInput.checkValidity()) return;
  const button = document.getElementById("send-link");
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
    tell(error?.status === 429 || error?.code === "over_email_send_rate_limit" ? "Limite de envio de e-mails atingido (429). Aguarde antes de tentar novamente; a equipe precisa configurar SMTP próprio para envios confiáveis." : "Falha no acesso: " + (error?.message || "erro de autenticação") + ".", true);
  } finally {
    button.disabled = false;
  }
});

document.getElementById("password-login").addEventListener("click", async () => {
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  if (!emailInput.checkValidity() || !password) {
    tell("Informe um e-mail válido e sua senha.", true);
    return;
  }
  const button = document.getElementById("password-login");
  button.disabled = true;
  tell("Verificando e-mail e senha...");
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await finishLogin();
  } catch {
    tell("Não foi possível entrar com esses dados. Confira o e-mail, a senha e se a conta já foi confirmada.", true);
  } finally { button.disabled = false; }
});

document.getElementById("password-signup").addEventListener("click", async () => {
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  if (!emailInput.checkValidity() || password.length < 12) {
    tell("Informe um e-mail válido e uma senha com pelo menos 12 caracteres.", true);
    return;
  }
  const button = document.getElementById("password-signup");
  button.disabled = true;
  tell("Criando sua conta...");
  try {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: redirectUrl }
    });
    if (error) throw error;
    if (data.session && isVerifiedMember(data.user)) await finishLogin(true);
    else tell("Se o endereço puder ser cadastrado, enviaremos a confirmação por e-mail. Depois de confirmar, você poderá definir ou usar sua senha.");
  } catch (error) {
    const limited = error?.status === 429 || error?.code === "over_email_send_rate_limit";
    tell(limited
      ? "O Supabase limitou o envio de confirmações. Aguarde e configure um SMTP próprio para liberar envios confiáveis."
      : "Não foi possível criar a conta. Verifique os dados e tente novamente mais tarde.", true);
  } finally { button.disabled = false; }
});

document.getElementById("password-recovery").addEventListener("click", async () => {
  const email = emailInput.value.trim().toLowerCase();
  if (!emailInput.checkValidity()) {
    tell("Informe um e-mail válido para recuperar a senha.", true);
    return;
  }
  const button = document.getElementById("password-recovery");
  button.disabled = true;
  tell("Solicitando recuperação de senha...");
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirectUrl
    });
    if (error) throw error;
    // This wording intentionally does not reveal whether the e-mail has an account.
    tell("Se este endereço tiver uma conta, enviaremos um link para criar uma nova senha. Não encaminhe esse link.");
  } catch (error) {
    const limited = error?.status === 429 || error?.code === "over_email_send_rate_limit";
    tell(limited
      ? "Não foi possível enviar agora por limite de segurança. Aguarde antes de tentar novamente."
      : "Não foi possível solicitar a recuperação agora. Tente novamente mais tarde.", true);
  } finally { button.disabled = false; }
});

setupForm.addEventListener("submit", async event => {
  event.preventDefault();
  const password = document.getElementById("new-password").value;
  const confirmation = document.getElementById("confirm-password").value;
  if (password.length < 12 || password !== confirmation) {
    tell(password !== confirmation ? "As senhas não coincidem." : "Use uma senha com pelo menos 12 caracteres.", true);
    return;
  }
  const button = setupForm.querySelector('[type="submit"]');
  button.disabled = true;
  tell("Salvando senha...");
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    await finishLogin();
  } catch {
    tell("Não foi possível salvar a senha. Tente novamente ou continue com o link de acesso.", true);
  } finally { button.disabled = false; }
});

document.getElementById("skip-password-setup").addEventListener("click", () => finishLogin());

resetForm.addEventListener("submit", async event => {
  event.preventDefault();
  const password = document.getElementById("reset-password").value;
  const confirmation = document.getElementById("confirm-reset-password").value;
  if (password.length < 12 || password !== confirmation) {
    tell(password !== confirmation ? "As senhas não coincidem." : "Use uma senha com pelo menos 12 caracteres.", true);
    return;
  }
  const button = resetForm.querySelector('[type="submit"]');
  button.disabled = true;
  tell("Salvando nova senha...");
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    await finishLogin();
  } catch {
    tell("Não foi possível salvar a nova senha. Solicite outro link de recuperação.", true);
  } finally { button.disabled = false; }
});
