import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installLocalApp } from "./local-app.mjs";

const pages = [
  ["/", "MECATIGER FTC #32578"],
  ["/rede.html", "Rede Meca Tiger"],
  ["/entrar.html?next=rede.html", "Acesso à Rede Meca Tiger"],
  ["/mecasim.html", "Meca Sim · MECATIGER FTC #32578"],
  ["/admin.html", "Painel da equipe — Meca Tiger"]
];

const responsiveWidths = [320, 360, 390, 768, 1440];

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

  test(`${title}: não cria rolagem horizontal nos tamanhos-alvo`, async ({ page }) => {
    for (const width of responsiveWidths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const dimensions = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const offenders = [...document.body.querySelectorAll("*")]
          .map(element => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id,
              className: typeof element.className === "string" ? element.className : "",
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            };
          })
          .filter(item => item.right > viewport + 1 && item.width > 0)
          .slice(0, 10);
        return { viewport, content: document.documentElement.scrollWidth, offenders };
      });
      expect(dimensions.content, `horizontal overflow in ${path} at ${width}px: ${JSON.stringify(dimensions.offenders)}`)
        .toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  });
}


test("Home keeps optional registration closed until the visitor asks", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1_100);
  const panel = page.locator("#cadastro-panel");
  await expect(panel).toBeHidden();

  const registrationButton = page.getByRole("button", {
    name: /cadastro opcional de participação/i
  });
  await expect(registrationButton).toBeVisible();
  await registrationButton.click();
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Este cadastro é opcional");
  await expect(page.getByRole("button", { name: /continuar sem cadastro/i })).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = axe.violations.filter(item => ["serious", "critical"].includes(item.impact));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);

  for (const width of responsiveWidths) {
    await page.setViewportSize({ width, height: 844 });
    const dimensions = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const offenders = [...document.body.querySelectorAll("*")]
        .map(element => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            className: typeof element.className === "string" ? element.className : "",
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          };
        })
        .filter(item => item.right > viewport + 1 && item.width > 0)
        .slice(0, 10);
      return { viewport, content: document.documentElement.scrollWidth, offenders };
    });
    expect(dimensions.content, `horizontal overflow at ${width}px: ${JSON.stringify(dimensions.offenders)}`)
      .toBeLessThanOrEqual(dimensions.viewport + 1);
  }
});

test("página de entrada expõe mensagens de autenticação a leitores de tela", async ({ page }) => {
  await page.goto("/entrar.html?next=rede.html", { waitUntil: "domcontentloaded" });
  const status = page.locator("#auth-status");
  await expect(status).toHaveAttribute("role", "status");
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#auth-email")).toHaveAttribute("type", "email");
});

test("Meca Sim exige login antes de mostrar a prévia autenticada", async ({ page }) => {
  await page.goto("/mecasim-demo.html");
  await page.waitForURL(/\/entrar\.html\?next=mecasim-demo\.html$/, { timeout: 20_000 });
  await expect(page).toHaveTitle(/Acesso à Rede Meca Tiger/i);
  await expect(page.locator("#auth-status")).toBeVisible();
});

// Published-read-only scenario: explanatory content must not pretend to be user posts.
test("Rede explica o processo completo e a separação dos cadastros", async ({ page }) => {
  await page.goto("/rede.html", {waitUntil:"domcontentloaded"});
  const section=page.locator("#como-funciona");
  await expect(section).toBeVisible();
  await expect(section.locator("ol > li")).toHaveCount(4);
  await expect(section).toContainText("Entre com e-mail confirmado");
  await expect(section).toContainText("não substitui esse login");
  await expect(section).toContainText("A equipe Meca Tiger revisa publicações");
  await expect(page.locator(".rede-banner")).toContainText("não cria uma conta");
  await expect(page.locator("#feed-status")).not.toContainText("5 publicações");
});
