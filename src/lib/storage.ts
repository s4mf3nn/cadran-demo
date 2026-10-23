/** Booléen persisté sous deux valeurs texte `[vrai, faux]`, gardées telles quelles pour relire les choix déjà enregistrés. */
export type FlagValues = readonly [on: string, off: string];

/** Lecture protégée : valeur absente, inconnue ou stockage indisponible → `fallback`. */
export function readFlag(key: string, [on, off]: FlagValues, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === on ? true : v === off ? false : fallback;
  } catch {
    return fallback;
  }
}

/** Écriture protégée : sans persistance possible, le choix vaut pour la session. */
export function writeFlag(key: string, [on, off]: FlagValues, value: boolean) {
  try {
    localStorage.setItem(key, value ? on : off);
  } catch {
    // Stockage indisponible (navigation privée, quota) : rien à faire.
  }
}
