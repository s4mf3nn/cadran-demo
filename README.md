# Cadran Demo

Dashboard de pilotage de la conformité réglementaire, construit comme démo technique pour une mission Senior Frontend React. Le domaine est inspiré d'un projet réel de conformité (exigences réglementaires par pays et par catégorie de produit), avec des données entièrement fictives et générées.

| Clair | Sombre |
| --- | --- |
| ![Desktop clair](docs/desktop-light.png) | ![Desktop sombre](docs/desktop-dark.png) |
| ![Mobile clair](docs/mobile-light.png) | ![Mobile sombre](docs/mobile-dark.png) |

## Lancer le projet

```bash
npm install
npm run dev          # http://localhost:5173 (sert aussi le faux endpoint IA en streaming)
npm test             # tests unitaires et composants (Vitest + Testing Library)
npm run e2e          # tests end-to-end (Playwright), après `npx playwright install chromium`
npm run build        # typecheck + build de production
```

## Stack

React 19, TypeScript strict, Vite, Zustand, TanStack Query, TanStack Virtual, Apache ECharts, Tailwind CSS v4, shadcn/ui (Radix UI, lucide-react, police Inter via @fontsource-variable), Vitest, React Testing Library, Playwright, GitHub Actions.

## Ce que la démo montre, point par point face à la fiche de mission

### Manipulation de larges jeux de données côté client

- **150 000 exigences** générées et interrogées dans un **Web Worker** (`src/workers/data.worker.ts`). Le filtre, le tri et toutes les agrégations se font en une seule passe, hors du main thread, donc l'interface ne gèle jamais.
- Le dataset n'est cloné vers le main thread qu'une fois. Ensuite chaque requête ne renvoie qu'un `Uint32Array` d'index, **transféré sans copie** (Transferable).
- La table est **virtualisée** avec TanStack Virtual : quel que soit le nombre de lignes, une trentaine seulement existent dans le DOM. Un test le vérifie explicitement.
- La saisie reste fluide grâce à `useDeferredValue`, et `keepPreviousData` de React Query évite le flash vide pendant les recalculs.
- Les composants lourds sont mémoïsés (`memo`, `useMemo`) et les sélecteurs Zustand sont ciblés pour éviter les re-rendus inutiles.

### Dataviz

- Quatre graphiques ECharts (donut, barres, carte de chaleur, courbe) en **rendu canvas** : aucun nœud DOM par point.
- **Import modulaire** d'ECharts et **chargement différé** du bloc graphique (`React.lazy`) : le bundle initial reste à environ 440 ko (141 ko gzip), ECharts (608 ko) étant chargé à part.
- **Filtrage croisé** : un clic sur un pays dans le graphique en barres filtre toute l'application.

### Intégration IA en streaming

- `src/hooks/useAssistantStream.ts` consomme une réponse **SSE via `fetch` et `ReadableStream`** (pas `EventSource`, qui ne gère ni le POST ni l'annulation).
- **Machine à états explicite** : `idle → thinking → streaming → done | aborted | error`, avec un squelette de chargement pendant la latence du premier token et un curseur pendant le flux.
- **Annulation** par `AbortController` (bouton Stop, nouvelle question, démontage du composant).
- **Rendu regroupé par frame** : les tokens s'accumulent dans une ref et l'état n'est mis à jour qu'une fois par `requestAnimationFrame`, au lieu d'un re-rendu par token.
- Le parseur SSE (`src/lib/sse.ts`) gère les événements coupés entre deux chunks réseau, ce qui est testé.
- On n'envoie au modèle que les agrégats, pas les 150 000 lignes.
- Le faux backend (`server/mockLlm.ts`) simule latence et tokens. Pour brancher une vraie API, seul l'endpoint change.

### Accessibilité

- Table avec la sémantique **ARIA grid** (`aria-rowcount`, `aria-rowindex`, `aria-sort`, `aria-activedescendant`) et une **navigation clavier complète** : flèches, Page Up/Down, Home/End, Entrée.
- Filtres en `fieldset`/`legend`, boutons bascule avec `aria-pressed`, labels associés à chaque champ.
- Graphiques décrits par `role="img"` et `aria-label`, avec le module ARIA d'ECharts activé.
- L'assistant annonce ses changements d'état dans une région `role="status"` sans relire chaque token aux lecteurs d'écran.
- `prefers-reduced-motion` respecté.

### Qualité

- TypeScript strict avec `noUncheckedIndexedAccess`.
- La logique métier (`src/data/query.ts`) est faite de **fonctions pures**, exécutées dans le worker en production et testées directement.
- Tests unitaires, tests de composants et 4 scénarios e2e Playwright, le tout dans une **CI GitHub Actions** (typecheck, tests, build, e2e avec rapport en cas d'échec).

## Design system (shadcn/ui)

- **Composants** : `src/components/ui/*` (button, card, input, label, slider, badge, toggle-group, skeleton, alert, scroll-area, tooltip), générés par `npx shadcn@latest` (preset Vega, base Radix, couleur neutral, icônes lucide importées une à une). Config dans `components.json`, alias `@/*` → `src/*`.
- **Tokens** : tout vit dans `src/index.css` (`:root`, `.dark`, puis `@theme inline`), sans `tailwind.config.js`. Tokens shadcn standard (`background`, `card`, `muted`, `primary`, `destructive`, `chart-1..5`…) plus des tokens de statut `--success`, `--info`, `--warning` (avec `-foreground`). Conforme = success, en cours = info, à évaluer = warning, non conforme = destructive. Plus aucune couleur Tailwind en dur dans les composants.
- **Contrastes** : valeurs vérifiées par calcul (AA 4,5:1 pour le texte, 3:1 pour les bordures de champs et les séries de graphiques) en clair et en sombre. En sombre, les badges de statut utilisent un liseré plutôt qu'une teinte de fond, qui ferait passer le contraste sous 4,5:1.
- **Thème sombre** : classe `dark` sur `<html>`. Un script inline dans `index.html` l'applique avant le premier rendu (préférence enregistrée dans `localStorage`, sinon `prefers-color-scheme`), donc pas de flash. Le bouton de l'en-tête bascule et mémorise, avec `try/catch` autour du stockage.
- **ECharts** dessine dans un canvas et ne lit ni `var(--x)` ni `oklch()`. `useChartTheme` lit les tokens avec `getComputedStyle`, les convertit en `rgb()` via un canvas 1x1 et se met à jour quand la classe de `<html>` change (`MutationObserver`). La carte de chaleur reste séquentielle et monotone dans les deux thèmes (de la couleur de la carte vers `--destructive`).
- **Pourquoi pas le composant `Table` de shadcn ?** Il rend un vrai `<table>` dans un conteneur à overflow. La virtualisation positionne les lignes en absolu avec `translateY`, ce qui est incompatible avec le modèle de rendu d'un `<table>`. La table garde donc sa structure ARIA grid (`div role="grid"`, `row`, `gridcell`, `columnheader`) et ne reprend que le style shadcn : tokens, `Badge`, `Button` ghost pour le tri, icônes lucide.
- **Captures** : `docs/` (1600×1000 et 390×844, clair et sombre).

## Anecdote utile en entretien

Le test e2e « l'assistant peut être interrompu » a révélé un vrai bug. Les boutons « Analyser » (`type="submit"`) et « Stop » (`type="button"`) étaient rendus au même emplacement d'un ternaire, donc React réutilisait le même nœud DOM. Le clic sur Stop finissait par soumettre le formulaire, ce qui relançait une requête au lieu d'annuler la précédente. La correction tient en deux lignes : une `key` distincte sur chaque bouton pour forcer deux nœuds séparés, et une garde dans `onSubmit` quand une génération est déjà en cours.

## Pistes d'évolution à évoquer

- Remplacer SSE par **WebSocket** pour un dialogue bidirectionnel (la même machine à états s'applique).
- Passer le tri et le filtre sur `SharedArrayBuffer` ou une base en mémoire type DuckDB-WASM au-delà du million de lignes.
- Carte géographique réelle (ECharts geo ou MapLibre) à la place de la carte de chaleur.
- Storybook pour documenter les composants et tests d'accessibilité automatisés avec axe-core.
