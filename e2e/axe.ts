import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** WCAG 2.0, 2.1 et 2.2, niveaux A et AA (le tag wcag21a porte notamment 2.5.3 « nom dans l'étiquette »). */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Violations axe de la page, au format « règle: sélecteurs » pour un message d'échec lisible. */
export async function axeViolations(page: Page) {
  // Pendant un fondu d'ouverture (dialogue, tiroir), axe mesurerait des contrastes intermédiaires.
  // On attend la fin des animations finies en cours, avec un plafond : les animations infinies (curseur de streaming)
  // ou anormalement longues ne doivent pas bloquer le test jusqu'à son timeout.
  await page.evaluate(() => {
    const finite = document.getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined));
    return Promise.race([Promise.all(finite), new Promise((resolve) => setTimeout(resolve, 2_000))]);
  });
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
}
