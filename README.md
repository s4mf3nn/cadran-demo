# Cadran

Cadran est un tableau de bord de pilotage de la conformité réglementaire : exigences par pays et par catégorie de produit, échéances, niveaux de risque et avancement. Il est pensé pour manipuler de gros volumes de données côté client sans jamais bloquer l'interface, et pour intégrer un assistant IA en streaming.

Les données sont entièrement fictives et générées de façon déterministe.

| Panneaux ouverts (1600×1000) | Panneaux réduits + aide `?` | Mobile (390×844) |
| --- | --- | --- |
| ![Desktop, panneaux ouverts](docs/desktop-ouvert.png) | ![Desktop, panneaux réduits et aide](docs/desktop-reduit-aide.png) | ![Mobile](docs/mobile.png) |

## Lancer le projet

```bash
npm install
npm run dev          # http://localhost:5173 (sert aussi le faux endpoint IA en streaming)
npm test             # tests unitaires et composants (Vitest + Testing Library)
npm run e2e          # tests end-to-end (Playwright), après `npx playwright install chromium`
npm run build        # typecheck + build de production
```

## Stack

React 19 (hooks), TypeScript strict, Vite, Zustand, TanStack Query, TanStack Virtual, Apache ECharts, Tailwind CSS v4, shadcn/ui (Radix UI, cmdk, vaul), Vitest, React Testing Library, Playwright, GitHub Actions.

## Architecture

```
┌────────────────────────── main thread ──────────────────────────┐
│  Composants React (présentation, ARIA, raccourcis)              │
│        ▲ sélecteurs ciblés                  ▲ résultats         │
│  Zustand : filtres, tri, UI      TanStack Query : cache, états  │
│        │                                    │                   │
│        └──────────► lib/dataWorker (RPC par Promise) ◄──────────┤
└──────────────────────────────┬──────────────────────────────────┘
                               │ postMessage (Uint32Array transféré)
┌──────────────────────────────▼──────────────────────────────────┐
│  Web Worker : 150 000 exigences, filtre + tri + agrégats        │
│  src/data/query.ts : fonctions pures, testables sans navigateur │
└─────────────────────────────────────────────────────────────────┘

Assistant IA : hook useAssistantStream ──fetch + ReadableStream (SSE)──► /api/assistant
```

### Séparation des responsabilités

| Couche | Rôle | Emplacement |
| --- | --- | --- |
| Domaine | Types, génération des données, filtre/tri/agrégation en fonctions pures, sans dépendance à React ni au DOM | `src/data/` |
| Transport | Client RPC du worker, parseur SSE, export CSV | `src/lib/`, `src/workers/` |
| État client | Filtres, tri, sélection (Zustand) ; état d'interface et panneaux, persistés | `src/store/` |
| État serveur / asynchrone | Cache et statuts de chargement des calculs du worker (TanStack Query) | `src/hooks/useCadranData.ts` |
| Présentation | Composants de mise en page, tableau, graphiques, assistant, primitives shadcn/ui | `src/components/` |

Les choix structurants :

- **Les calculs sortent du main thread.** Le worker est exposé comme un backend asynchrone via une petite couche RPC (`src/lib/dataWorker.ts`) : chaque appel renvoie une `Promise`, ce qui permet de le brancher directement dans React Query et d'en obtenir cache, annulation et états de chargement sans code dédié. Remplacer le worker par une vraie API HTTP ne changerait que cette couche.
- **La logique métier est pure.** `src/data/query.ts` n'importe ni React ni le DOM. Elle s'exécute dans le worker en production et se teste directement en Vitest.
- **Un état par nature.** Zustand pour l'état local synchrone (filtres, panneaux), React Query pour tout ce qui est asynchrone. Les sélecteurs sont ciblés pour éviter les re-rendus en cascade.
- **Un registre unique pour les raccourcis** (`src/lib/shortcuts.ts`) alimente à la fois le hook global `useHotkeys` et la boîte d'aide `?`, pour que la documentation ne diverge jamais du comportement.

## Performance sur de grands jeux de données

- **150 000 exigences** générées et interrogées dans un **Web Worker** (`src/workers/data.worker.ts`). Le filtre, le tri et toutes les agrégations se font en une seule passe, hors du main thread.
- Le dataset n'est cloné vers le main thread qu'une fois. Ensuite, chaque requête ne renvoie qu'un `Uint32Array` d'index, **transféré sans copie** (Transferable).
- La table est **virtualisée** (TanStack Virtual) : quel que soit le nombre de lignes, une trentaine seulement existent dans le DOM. Un test le vérifie explicitement.
- La saisie reste fluide grâce à `useDeferredValue` ; `keepPreviousData` évite le flash vide pendant les recalculs.
- Les composants coûteux sont mémoïsés (`memo`, `useMemo`).

## Visualisation de données

- Deux graphiques ECharts (histogramme des échéances, carte de chaleur pays × catégorie) en **rendu canvas** : aucun nœud DOM par point.
- **Import modulaire** d'ECharts et **chargement différé** du bloc graphique (`React.lazy`) : le bundle initial reste à environ 440 ko (141 ko gzip), ECharts (608 ko) étant chargé à part.
- **Filtrage croisé** : un clic sur le total d'un pays dans la carte de chaleur filtre toute l'application.
- **Thème lu depuis les tokens CSS.** ECharts dessine dans un canvas et ne comprend ni `var(--x)` ni `color-mix()`. `useChartTheme` lit les tokens avec `getComputedStyle` et les convertit en `rgb()`, de sorte que les graphiques suivent le design system sans couleur dupliquée.
- La carte de chaleur expose un résumé textuel de ses cellules les plus exposées, et ses totaux par pays sont des boutons `aria-pressed` qui filtrent sur le pays.

## Intégration IA en streaming

- `src/hooks/useAssistantStream.ts` consomme une réponse **SSE via `fetch` et `ReadableStream`**, et non `EventSource`, qui ne gère ni le POST ni l'annulation.
- **Machine à états explicite** : `idle → thinking → streaming → done | aborted | error`, avec un squelette de chargement pendant la latence du premier token et un curseur pendant le flux.
- **Annulation** par `AbortController` (bouton Stop, nouvelle question, démontage du composant).
- **Rendu regroupé par frame** : les tokens s'accumulent dans une ref et l'état n'est mis à jour qu'une fois par `requestAnimationFrame`, au lieu d'un re-rendu par token.
- Le parseur SSE (`src/lib/sse.ts`) gère les événements coupés entre deux chunks réseau, ce qui est couvert par des tests.
- Seuls les **agrégats** sont envoyés au modèle, jamais les 150 000 lignes.
- Le faux backend (`server/mockLlm.ts`, plugin Vite) simule latence et tokens. Pour brancher une vraie API, seul l'endpoint change. Le passage à WebSocket réutiliserait la même machine à états.

## Accessibilité

- Table avec la sémantique **ARIA grid** (`aria-rowcount`, `aria-rowindex`, `aria-sort`, `aria-activedescendant`) et une **navigation clavier complète** : flèches, Page Up/Down, Home/End, Espace, Entrée.
- Filtres en `fieldset`/`legend`, boutons bascule avec `aria-pressed`, labels associés à chaque champ.
- Graphiques décrits par `role="img"` et `aria-label`, module ARIA d'ECharts activé.
- L'assistant annonce ses changements d'état dans une région `role="status"` sans faire relire chaque token par les lecteurs d'écran.
- `prefers-reduced-motion` respecté ; la couleur ne porte jamais seule l'information (chaque statut a fond, texte et libellé).
- Audit axe (WCAG 2 AA) en e2e, en desktop et en mobile. Les champs de saisie et cases à cocher utilisent un contour à ≥ 3:1 (WCAG 1.4.11).

## Design system

- **Tokens** dans `src/index.css` (`:root` puis `@theme inline`), sans `tailwind.config.js`. Chaque statut a trois tokens (`--status-*`, `-bg`, `-fg`).
- **Composants** shadcn/ui au-dessus de Radix UI (dialogues, popovers, cmdk pour la palette de recherche, vaul pour les tiroirs mobiles). Icônes Hugeicons via un wrapper unique (`components/ui/icon.tsx`).
- **Mise en page adaptative** : filtres à gauche, contenu fluide, assistant en fenêtre flottante qui se superpose sans redimensionner le tableau de bord. Les panneaux se réduisent en rail et mémorisent leur état dans `localStorage` (avec `try/catch` et repli par défaut). Sous 768 px, ils deviennent des tiroirs ouverts depuis une barre flottante, et la table devient une liste virtualisée avec des cibles tactiles de 44 px.
- **Pourquoi pas le composant `Table` de shadcn ?** Il rend un vrai `<table>`, incompatible avec le positionnement absolu (`translateY`) de la virtualisation. La table garde donc une structure ARIA grid (`div role="grid"`, `row`, `gridcell`, `columnheader`).

## Qualité et tests

- **TypeScript strict** avec `noUncheckedIndexedAccess`.
- **Pyramide de tests** : fonctions pures (requêtes, génération, parseur SSE, raccourcis) en unitaire, composants avec Testing Library (table virtualisée, détail d'une exigence), parcours utilisateur avec Playwright (filtres, raccourcis, panneaux, annulation de l'assistant, mobile, accessibilité).
- **CI GitHub Actions** : typecheck, tests, build, puis e2e avec publication du rapport en cas d'échec.

### Retour d'expérience : un bug révélé par l'e2e

Le test « l'assistant peut être interrompu » a mis au jour un défaut réel. Les boutons « Analyser » (`type="submit"`) et « Stop » (`type="button"`) occupaient le même emplacement d'un ternaire : React réutilisait le même nœud DOM, si bien qu'un clic sur Stop soumettait le formulaire et relançait une requête au lieu d'annuler la précédente. Le correctif tient en une `key` distincte par bouton et une garde dans `onSubmit` quand une génération est en cours. L'interface affiche désormais les deux boutons en permanence (Stop désactivé hors génération), ce qui supprime le piège à la source ; la garde reste en défense.

## Pistes d'évolution

- **WebSocket** à la place de SSE pour un dialogue bidirectionnel, avec la même machine à états.
- `SharedArrayBuffer` ou base en mémoire type DuckDB-WASM au-delà du million de lignes.
- Carte géographique réelle (ECharts geo ou MapLibre) à la place de la carte de chaleur.
- Storybook pour documenter les composants.
