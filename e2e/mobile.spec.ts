import { expect, test } from '@playwright/test';
import { axeViolations } from './axe';

test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible({ timeout: 15_000 });
});

test('la barre flottante ouvre les tiroirs Filtres et Assistant', async ({ page }) => {
  await page.getByRole('button', { name: 'Filtres' }).click();
  await expect(page.getByRole('dialog', { name: 'Filtres' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Assistant' }).click();
  await expect(page.getByRole('dialog', { name: /Assistant/ })).toBeVisible();
});

test('à chaque palier, la liste mobile va jusqu’à la dernière exigence', async ({ page }) => {
  const large = page.getByRole('radio', { name: /^1\s000\s000 exigences$/ });
  const list = page.getByRole('list', { name: 'Exigences réglementaires' });
  for (const size of [150_000, 1_000_000]) {
    if (size > 150_000) await large.click();
    await expect(list.getByRole('listitem').first()).toHaveAttribute('aria-setsize', String(size), { timeout: 20_000 });
    await list.evaluate((ul) => { const el = ul.parentElement!; el.scrollTop = el.scrollHeight; });
    await expect(list.getByRole('listitem').last()).toHaveAttribute('aria-posinset', String(size));
  }
});

test('aucune violation axe et aucune touche de raccourci affichée', async ({ page }) => {
  await expect(page.locator('kbd:visible')).toHaveCount(0);
  expect(await axeViolations(page)).toEqual([]);
});

test('les cibles tactiles font au moins 44 px', async ({ page }) => {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button:not([role=checkbox]), [role=radio], input:not([type=checkbox])')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height > 0 && (r.height < 43.5 || r.width < 43.5))
      .map(({ el }) => `${el.tagName} ${el.getAttribute('aria-label') ?? el.textContent?.slice(0, 20)}`),
  );
  expect(small).toEqual([]);
});

test('les raccourcis à une touche sont coupés sur mobile (WCAG 2.1.4)', async ({ page }) => {
  await page.keyboard.press('/');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
