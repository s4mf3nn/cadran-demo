import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // L'assistant flottant est fermé par défaut : on l'ouvre pour les scénarios qui l'utilisent.
  await page.addInitScript(() => localStorage.setItem('cadran.panel.right', 'open'));
  await page.goto('/');
  await expect(page.getByRole('grid', { name: 'Exigences réglementaires' })).toBeVisible({ timeout: 15_000 });
});

test('filtrer met à jour les KPI et la table', async ({ page }) => {
  const kpi = page.locator('dd').first();
  const before = await kpi.textContent();
  await page.getByRole('checkbox', { name: /Non conforme/ }).click();
  await expect(kpi).not.toHaveText(before ?? '');
  await expect(page.getByRole('row').nth(1)).toContainText('Non conforme');
});

test('la table reste virtualisée sur 150 000 lignes', async ({ page }) => {
  const count = await page.getByRole('row').count();
  expect(count).toBeLessThan(80);
  await page.getByRole('grid').focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('row').last()).toBeVisible();
});

test("l'assistant affiche un état d'attente puis streame la réponse", async ({ page }) => {
  await page.getByRole('button', { name: 'Analyser' }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await expect(page.getByText('Constat principal')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Analyser' })).toBeVisible({ timeout: 15_000 });
});

test("l'assistant peut être interrompu", async ({ page }) => {
  await page.getByRole('button', { name: 'Analyser' }).click();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText('Génération interrompue.', { exact: true }).last()).toBeVisible();
});

test('( réduit le panneau de filtres, et son état survit à un rechargement', async ({ page }) => {
  const left = page.getByRole('button', { name: /panneau de filtres/ });
  await expect(left).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('(');
  await expect(left).toHaveAttribute('aria-expanded', 'false');
  await page.reload();
  await expect(page.getByRole('grid', { name: 'Exigences réglementaires' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /panneau de filtres/ })).toHaveAttribute('aria-expanded', 'false');
  // Le centre prend la largeur libérée.
  const box = await page.getByRole('main').boundingBox();
  expect(box!.width).toBeGreaterThan(1400);
});

test('? ouvre l’aide qui liste les raccourcis', async ({ page }) => {
  await page.keyboard.press('?');
  const dialog = page.getByRole('dialog', { name: 'Raccourcis clavier' });
  await expect(dialog).toBeVisible();
  for (const label of ['Rechercher', 'Lancer la suggestion 3', 'Ouvrir la ligne']) {
    await expect(dialog.getByText(label)).toBeVisible();
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('/ ouvre la modale de recherche ; les touches simples sont ignorées dans un champ', async ({ page }) => {
  await page.keyboard.press('/');
  const dialog = page.getByRole('dialog', { name: 'Rechercher une exigence' });
  const input = dialog.getByRole('combobox');
  await expect(input).toBeFocused();
  await page.keyboard.type('s?');
  await expect(input).toHaveValue('s?');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('⌘J met le focus sur la question, 1 lance une suggestion, Échap l’arrête', async ({ page }) => {
  await page.keyboard.press('Control+j');
  await expect(page.locator('#assistant-input')).toBeFocused();
  await page.locator('#filter-status').focus();
  await page.keyboard.press('1');
  await expect(page.getByRole('button', { name: /Stop/ })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Génération interrompue.', { exact: true }).last()).toBeVisible();
});

test('clic sur la barre d’un pays : filtre pressé (aria-pressed)', async ({ page }) => {
  const bar = page.getByRole('button', { name: /^Filtrer sur / }).first();
  await expect(bar).toHaveAttribute('aria-pressed', 'false');
  await bar.click();
  await expect(page.getByRole('button', { name: /^Filtrer sur / }).first()).toHaveAttribute('aria-pressed', 'true');
});

test('aucune violation axe WCAG 2 AA (desktop)', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
});
