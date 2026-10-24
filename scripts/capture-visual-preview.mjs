import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE_URL = 'http://127.0.0.1:8080';
const OUT = 'visual-preview';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const shots = [
  { path: 'index.html', file: '01-home-desktop.png', width: 1440, height: 900 },
  { path: 'index.html', file: '02-home-mobile.png', width: 390, height: 844 },
  { path: 'rede.html', file: '03-rede-comunidade.png', width: 1440, height: 900 },
  { path: 'mecasim.html', file: '04-meca-sim.png', width: 1440, height: 900 },
  { path: 'entrar.html', file: '05-entrada.png', width: 1440, height: 900 },
  { path: 'admin.html', file: '06-admin-bloqueado.png', width: 1440, height: 900 }
];

try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
    // Visualize the normal content as a returning visitor, without any signup or data writes.
    await page.addInitScript(() => {
      sessionStorage.setItem('mecatiger-registration-seen', '1');
    });
    await page.goto(`${BASE_URL}/${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1400);
    if (shot.path === 'index.html') {
      const skip = page.locator('.panel-close[data-skip-registration]');
      if (await skip.isVisible()) await skip.click();
      // Trigger IntersectionObserver scroll-reveal effects before full-page capture.
      await page.evaluate(async () => {
        const step = Math.max(300, Math.round(window.innerHeight * 0.7));
        const maxY = document.documentElement.scrollHeight;
        for (let y = 0; y <= maxY; y += step) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 110));
        }
        window.scrollTo(0, maxY);
        await new Promise((resolve) => setTimeout(resolve, 200));
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: `${OUT}/${shot.file}`, fullPage: true, animations: 'disabled' });
    console.log(`Captured ${shot.file}`);
    await page.close();
  }
  const signup = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await signup.goto(`${BASE_URL}/index.html?cadastro=teste`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await signup.waitForTimeout(1000);
  await signup.screenshot({ path: `${OUT}/07-cadastro-opcional.png`, fullPage: false, animations: 'disabled' });
  await signup.close();
} finally {
  await browser.close();
}
