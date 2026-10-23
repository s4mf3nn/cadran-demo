import { expect, test } from '@playwright/test';
import { longTasksDuring, observeLongTasks } from './longTasks';

/**
 * Garde-fou de la promesse du README : à 1 000 000 d'exigences, aucune interaction ne produit
 * de tâche longue (> 50 ms) sur le main thread. Chaque étape est vérifiée séparément
 * (expect.soft) pour que l'échec nomme toutes les interactions en cause.
 */
test('à 1 M d’exigences, aucune interaction ne bloque le main thread plus de 50 ms', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  const grid = page.getByRole('grid', { name: 'Exigences réglementaires' });
  await expect(grid).toBeVisible({ timeout: 15_000 });
  const scaler = page.getByRole('radiogroup', { name: 'Volume du référentiel' });
  const filters = page.getByRole('complementary', { name: 'Filtres' });
  const map = page.getByRole('region', { name: 'Carte des expositions' });
  await observeLongTasks(page);

  const step = async (name: string, run: () => Promise<void>) => {
    const tasks = await longTasksDuring(page, run);
    expect.soft(tasks, `tâches longues pendant « ${name} »`).toEqual([]);
  };

  await step('passage à 1 M', async () => {
    await scaler.getByRole('radio', { name: /^1\s000\s000 exigences$/ }).click();
    await expect(scaler).toHaveAttribute('aria-busy', 'false', { timeout: 20_000 });
    await expect(grid).toHaveAttribute('aria-rowcount', '1000001', { timeout: 20_000 });
  });

  await step('saisie d’une recherche', async () => {
    await page.keyboard.press('/');
    const input = page.getByRole('dialog', { name: 'Rechercher une exigence' }).getByRole('combobox');
    await input.pressSequentially('données', { delay: 30 });
    await expect(filters).toContainText(/exigences? correspond/);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Rechercher \(filtre actif/ }).click();
    await page.getByRole('button', { name: 'Effacer la recherche' }).click();
    await page.keyboard.press('Escape');
    await expect(grid).toHaveAttribute('aria-rowcount', '1000001');
  });

  await step('tri par référence', async () => {
    await page.getByRole('button', { name: /^Référence$/ }).click();
    await expect(page.getByRole('columnheader', { name: /Référence/ })).toHaveAttribute('aria-sort', 'ascending');
    await page.getByRole('button', { name: /^Référence$/ }).click();
    await expect(page.getByRole('columnheader', { name: /Référence/ })).toHaveAttribute('aria-sort', 'descending');
  });

  await step('filtre par statut', async () => {
    const pill = filters.getByRole('button', { name: /^Non conforme/ });
    await pill.click();
    await expect(pill).toHaveAttribute('aria-pressed', 'true');
    await pill.click();
    await expect(pill).toHaveAttribute('aria-pressed', 'false');
    await expect(grid).toHaveAttribute('aria-rowcount', '1000001');
  });

  await step('navigation jusqu’en fin de table', async () => {
    await grid.focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('row').last()).toHaveAttribute('aria-rowindex', '1000001');
    await page.keyboard.press('Home');
    await expect(page.getByRole('row').nth(1)).toHaveAttribute('aria-rowindex', '2');
  });

  await step('zoom et déplacement de la carte', async () => {
    await map.getByRole('button', { name: 'Zoom avant' }).click();
    await expect(map.getByRole('button', { name: 'Recentrer la carte' })).toBeEnabled();
    const box = (await map.getByRole('group', { name: 'Carte du monde des exigences en risque' }).boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 150, y - 60, { steps: 15 });
    await page.mouse.up();
    await map.getByRole('button', { name: 'Recentrer la carte' }).click();
    await expect(map.getByRole('button', { name: 'Recentrer la carte' })).toBeDisabled();
  });
});
