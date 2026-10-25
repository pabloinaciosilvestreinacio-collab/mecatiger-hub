import { test, expect } from "@playwright/test";
import { installLocalApp, waitForConfirmationLink } from "./local-app.mjs";

test("OTP, Rede, Meca Sim e logout funcionam pelo navegador local", async ({ context, page }) => {
  await installLocalApp(context, true);
  const email = `navegador-${Date.now()}@mecatiger.invalid`;
  const postTitle = `Fluxo completo ${Date.now()}`;
  const routeName = `Rota UI ${Date.now()}`;

  // Keep the first profile read pending to reproduce the previously unguarded race.
  // Requests still target the disposable local Supabase; no mocked authorization.
  let notifyProfileRead, releaseProfileRead;
  const intercepted = new Promise(resolve => { notifyProfileRead = resolve; });
  const held = new Promise(resolve => { releaseProfileRead = resolve; });
  let heldOnce = false;
  const holdFirstProfileRead = async route => {
    if (!heldOnce && route.request().method() === "GET" &&
        route.request().url().includes("select=display_name")) {
      heldOnce = true;
      notifyProfileRead();
      await held;
    }
    await route.continue();
  };
  await page.route("**/rest/v1/rede_profiles?*", holdFirstProfileRead);

  await page.goto("/entrar.html?next=rede.html");
  await page.locator("#auth-email").fill(email);
  await page.getByRole("button", { name: "Solicitar link de acesso" }).click();
  await expect(page.locator("#auth-status")).toContainText("Confira seu e-mail");

  const confirmationLink = await waitForConfirmationLink(email);
  await page.goto(confirmationLink);
  await expect(page.locator("#password-setup")).toBeVisible();
  await page.locator("#new-password").fill("Senha-de-teste-local-2026!");
  await page.locator("#confirm-password").fill("Senha-de-teste-local-2026!");
  await page.getByRole("button", { name: "Salvar senha e continuar" }).click();
  await page.waitForURL(/\/rede\.html$/, { timeout: 20_000 });
  // The session may be valid while profile/moderator queries remain in flight.
  // No authenticated action is available until both checks have resolved.
  await Promise.race([
    intercepted,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Profile request did not start")), 20_000))
  ]);
  await expect(page.locator("#rede-identity")).toContainText("Verificando sessão e permissões");
  await expect(page.locator("#profile-form button[type=submit]")).toBeDisabled();
  await expect(page.locator("#post-form")).toBeHidden();
  for (const button of await page.locator("[data-request-kind]").all()) {
    await expect(button).toBeEnabled();
  }
  await page.locator("[data-request-kind=ajuda]").click();
  await expect(page.locator("#help-status")).toContainText("Aguarde enquanto verificamos sua sessão.");
  // Keep this handler installed until test teardown: removing it while a held route
  // is resuming can cause Playwright to handle the same request twice.
  releaseProfileRead();
  await expect(page.locator("#rede-identity")).toContainText("Sessão autenticada");
  await expect(page.locator("#post-status")).toContainText("Salve seu perfil público antes de publicar.");
  await expect(page.locator("#profile-form button[type=submit]")).toBeEnabled();

  await page.locator("#display-name").fill("Participante UI");
  await page.locator("#profile-form").getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.locator("#profile-status")).toContainText("Perfil salvo");
  await expect(page.locator("#post-form")).toBeVisible();

  await page.locator("#post-title").fill(postTitle);
  await page.locator("#post-content").fill("Conteúdo fictício criado pelo navegador contra o Supabase local.");
  await page.locator("#post-form").getByRole("button", { name: "Enviar para aprovação" }).click();
  await expect(page.locator("#post-status")).toContainText("Publicação recebida");
  await expect(page.locator("#own-items")).toContainText(postTitle);

  await page.goto("/mecasim-demo.html");
  await expect(page.locator("#route-private-status")).toContainText("Biblioteca vazia");
  await page.getByRole("button", { name: "Adicionar ponto" }).click();
  const canvas = page.locator("#arena");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Arena canvas is not visible");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator("#count")).toContainText("1 / 16");
  await page.locator("#route-name").fill(routeName);
  await page.getByRole("button", { name: "Salvar rota" }).click();
  await expect(page.locator("#route-private-status")).toContainText("Rota salva com segurança");
  await expect(page.locator("#saved-route-select")).toContainText(routeName);

  await page.getByRole("button", { name: "Limpar rota" }).click();
  await expect(page.locator("#count")).toContainText("0 / 16");
  await page.getByRole("button", { name: "Carregar rota" }).click();
  await expect(page.locator("#count")).toContainText("1 / 16");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Excluir rota" }).click();
  await expect(page.locator("#route-private-status")).toContainText("Trajetória excluída");

  await page.goto("/rede.html");
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page.locator("#rede-identity")).toContainText("Modo visitante");
  await page.goto("/mecasim-demo.html");
  await page.waitForURL(/\/entrar\.html\?next=mecasim-demo\.html$/, { timeout: 20_000 });
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("Senha-de-teste-local-2026!");
  await page.getByRole("button", { name: "Entrar com senha" }).click();
  await page.waitForURL(url => url.pathname.endsWith("/mecasim-demo.html"), { timeout: 20_000 });
});
