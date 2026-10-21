import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

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

test('aucune violation axe et aucune touche de raccourci affichée', async ({ page }) => {
  await expect(page.locator('kbd:visible')).toHaveCount(0);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
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
