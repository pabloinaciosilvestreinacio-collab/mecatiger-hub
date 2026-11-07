import { test, expect } from "@playwright/test";
import { installLocalApp } from "./local-app.mjs";

test("recovery URL marker alone never opens a password reset form", async ({ context, page }) => {
  await installLocalApp(context, true);
  await page.goto("/entrar.html?next=rede.html&recovery=1");
  await expect(page.locator("#password-reset")).toBeHidden();
  await expect(page.locator("#send-code")).toBeVisible();
  await expect(page.locator("#auth-status"))
    .toContainText("Apenas esta URL não autoriza trocar a senha.");
});

test("expired Auth redirect is rejected and internal details are removed", async ({ context, page }) => {
  await installLocalApp(context, true);
  await page.goto("/entrar.html?next=rede.html&error=access_denied&error_code=otp_expired&error_description=SECRET_INTERNAL_REASON");
  await expect(page.locator("#auth-status")).toContainText("Link expirado ou inválido");
  await expect(page.locator("#auth-status")).not.toContainText("SECRET_INTERNAL_REASON");
  await expect(page.locator("#password-reset")).toBeHidden();
  await expect(page).toHaveURL(/\/entrar\.html$/);
});

test("rejected Auth hash callback is scrubbed and cannot open reset", async ({ context, page }) => {
  await installLocalApp(context, true);
  await page.goto("/entrar.html?next=rede.html&recovery=1#error=access_denied&error_code=otp_expired");
  await expect(page.locator("#auth-status")).toContainText("Link expirado ou inválido");
  await expect(page.locator("#password-reset")).toBeHidden();
  await expect(page).toHaveURL(/\/entrar\.html$/);
});
