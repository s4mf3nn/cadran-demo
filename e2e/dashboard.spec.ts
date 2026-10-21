import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
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
