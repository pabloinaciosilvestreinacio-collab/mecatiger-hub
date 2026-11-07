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
