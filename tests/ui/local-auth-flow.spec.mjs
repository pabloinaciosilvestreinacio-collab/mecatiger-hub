import { test, expect } from "@playwright/test";
import { installLocalApp, waitForConfirmationLink } from "./local-app.mjs";

test("OTP, Rede, Meca Sim e logout funcionam pelo navegador local", async ({ context, page }) => {
  await installLocalApp(context, true);
  const email = `navegador-${Date.now()}@mecatiger.invalid`;
  const postTitle = `Fluxo completo ${Date.now()}`;
  const routeName = `Rota UI ${Date.now()}`;

  await page.goto("/entrar.html?next=rede.html");
  await page.locator("#auth-email").fill(email);
  await page.getByRole("button", { name: "Solicitar link de acesso" }).click();
  await expect(page.locator("#auth-status")).toContainText("Confira seu e-mail");

  const confirmationLink = await waitForConfirmationLink(email);
  await page.goto(confirmationLink);
  await page.waitForURL(/\/rede\.html$/, { timeout: 20_000 });
  await expect(page.locator("#rede-identity")).toContainText("Sessão autenticada");
  // Identity banner appears before the async profile/RLS queries settle.
  // Wait for the initial profile check before submitting a new profile.
  await expect(page.locator("#post-status")).toContainText("Salve seu perfil público antes de publicar.");

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
});
