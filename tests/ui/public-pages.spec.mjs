import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installLocalApp } from "./local-app.mjs";

const pages = [
  ["/", "MECATIGER FTC #32578"],
  ["/rede.html", "Rede Meca Tiger"],
  ["/entrar.html?next=rede.html", "Acesso à Rede Meca Tiger"],
  ["/mecasim.html", "Meca Sim · MECATIGER FTC #32578"],
  ["/admin.html", "Painel da equipe — Meca Tiger"],
  ["/conteudo.html", "Conteúdo do Hub"],
  ["/pagina.html?slug=teste", "Página do Hub"]
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


test("Home opens optional registration only after explicit choice", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const panel = page.locator("#cadastro-panel");
  await expect(panel).toBeHidden();
  const registrationButton = page.getByRole("button", { name: /cadastro para métricas/i });
  await expect(registrationButton).toBeVisible();
  await registrationButton.click();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("role", "dialog");
  await expect(panel).toHaveAttribute("aria-modal", "true");
  await expect(panel).toContainText("Este cadastro é opcional");
  const skipButton = page.getByRole("button", { name: /agora não/i });
  await expect(skipButton).toBeVisible();
  await skipButton.click();
  await expect(panel).toBeHidden();

  await expect(page.getByRole("button", { name: /cadastro opcional de participação/i })).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include("#cadastro-panel")
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
  await expect(section).toContainText("Entre na Rede pelo site");
  await expect(section).toContainText("Informe seu e-mail para receber um link de acesso");
  await expect(section).toContainText("não cria essa conta");
  await expect(section).toContainText("envie publicações e conexões pelos formulários do site");
  await expect(section).toContainText("A equipe analisa os pedidos no painel administrativo");
  await expect(page.locator(".rede-banner")).toContainText("Os formulários ficam no site");
  await expect(page.locator("#ajuda button[data-request-kind=ajuda]")).toBeVisible();
  await expect(page.locator("#conexao button[data-request-kind=conexao]")).toBeVisible();
  await expect(page.locator("#compartilhar a[href^='mailto:']")).toHaveCount(0);
  await expect(page.locator("#compartilhar")).not.toContainText("e-mail");
  await expect(page.locator(".rede-banner")).toContainText("não cria uma conta");
  await expect(page.locator("#feed-status")).not.toContainText("5 publicações");
});
