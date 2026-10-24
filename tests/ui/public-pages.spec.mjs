import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installLocalApp } from "./local-app.mjs";

const pages = [
  ["/rede.html", "Rede Meca Tiger"],
  ["/entrar.html?next=rede.html", "Acesso à Rede Meca Tiger"],
  ["/mecasim-demo.html", "Meca Sim"]
];

test.beforeEach(async ({ context }) => {
  await installLocalApp(context);
});

for (const [path, title] of pages) {
  test(`${title}: acessibilidade estrutural`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(new RegExp(title, "i"));
    await expect(page.locator("main")).toHaveCount(1);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter(item => ["serious", "critical"].includes(item.impact));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test(`${title}: não cria rolagem horizontal em celular`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const dimensions = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll("body *")]
        .map(element => ({
          element: element.tagName.toLowerCase(),
          id: element.id,
          className: typeof element.className === "string" ? element.className : "",
          right: Math.round(element.getBoundingClientRect().right),
          scrollWidth: element.scrollWidth
        }))
        .filter(item => item.right > viewport + 1 || item.scrollWidth > viewport + 1)
        .slice(0, 12);
      return { viewport, content: document.documentElement.scrollWidth, offenders };
    });
    expect(dimensions.content, JSON.stringify(dimensions.offenders, null, 2))
      .toBeLessThanOrEqual(dimensions.viewport + 1);
  });
}

test("página de entrada expõe mensagens de autenticação a leitores de tela", async ({ page }) => {
  await page.goto("/entrar.html?next=rede.html", { waitUntil: "domcontentloaded" });
  const status = page.locator("#auth-status");
  await expect(status).toHaveAttribute("role", "status");
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#auth-email")).toHaveAttribute("type", "email");
});
