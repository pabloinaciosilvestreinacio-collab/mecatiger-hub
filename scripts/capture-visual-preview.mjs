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
      const skip = page.locator('[data-skip-registration]');
      if (await skip.isVisible()) await skip.click();
      await page.evaluate(() => window.scrollTo(0, 0));
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
