import type { Page } from '@playwright/test';

/** Tâche longue au sens de la Long Tasks API : plus de 50 ms d'affilée sur le main thread. */
export interface LongTask {
  start: number;
  duration: number;
}

declare global {
  interface Window {
    __longTasks?: LongTask[];
  }
}

/**
 * Observe les tâches longues du main thread de la page. Celles du worker n'y figurent pas :
 * c'est précisément ce que l'on veut vérifier, que le travail lourd ne bloque pas l'interface.
 */
export async function observeLongTasks(page: Page) {
  await page.evaluate(() => {
    window.__longTasks = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__longTasks!.push({ start: Math.round(e.startTime), duration: Math.round(e.duration) });
    }).observe({ type: 'longtask' });
  });
}

/**
 * Exécute une étape et renvoie les tâches longues survenues pendant celle-ci.
 * L'observateur est notifié de façon asynchrone : on laisse passer deux frames et un court délai
 * après l'étape pour ne pas manquer une tâche qui viendrait de se terminer.
 */
export async function longTasksDuring(page: Page, step: () => Promise<void>): Promise<LongTask[]> {
  await page.evaluate(() => { window.__longTasks = []; });
  await step();
  return page.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 100));
    return window.__longTasks!;
  });
}
