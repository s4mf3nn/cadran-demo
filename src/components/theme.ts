const KEY = 'theme';
const root = () => document.documentElement;

/** Source de vérité : la classe `dark` sur <html>, posée avant le rendu par le script d'index.html. */
export function isDark(): boolean {
  return root().classList.contains('dark');
}

/** S'abonne aux changements de thème en observant la classe de <html>. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(root(), { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

export function setTheme(dark: boolean): void {
  root().classList.toggle('dark', dark);
  try {
    localStorage.setItem(KEY, dark ? 'dark' : 'light');
  } catch {
    // Stockage indisponible (navigation privée, données bloquées) : le thème vaut pour la session seulement.
  }
}
