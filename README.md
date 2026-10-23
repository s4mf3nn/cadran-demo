# Cadran

Tableau de bord de pilotage de la conformité réglementaire : 150 000 exigences par pays, catégorie, statut, risque et échéance, avec un assistant IA en streaming. Projet de démonstration (données fictives, générées de façon déterministe).

Ce qu'il met en avant :

- **Performance** : gros volume de données traité côté client sans bloquer l'interface (Web Worker, transferts sans copie, virtualisation).
- **Visualisation de données** sur mesure en SVG, dont une carte du monde interactive avec regroupement et zoom.
- **Intégration IA** en streaming (SSE, machine à états, annulation).
- **Accessibilité** visée WCAG 2.2 AA (ARIA grid, navigation clavier, audit axe automatisé) et **tests** unitaires, de composants et end-to-end.

| Bureau (1600×1000) | Carte zoomée et réponse de l'assistant |
| --- | --- |
| ![Tableau de bord sur bureau](docs/desktop-defaut.png) | ![Carte zoomée sur l'Europe et réponse de l'assistant](docs/desktop-carte.png) |

| Mobile (390×844) | Carte | Assistant |
| --- | --- | --- |
| ![Tableau de bord sur mobile](docs/mobile-accueil.png) | ![Carte sur mobile](docs/mobile-carte.png) | ![Assistant sur mobile](docs/mobile-assistant.png) |

## Lancer le projet

```bash
npm install
npm run dev          # http://localhost:5173 (sert aussi le faux endpoint IA en streaming)
npm test             # tests unitaires et composants (Vitest + Testing Library)
npm run e2e          # tests end-to-end (Playwright), après `npx playwright install chromium`
npm run build        # typecheck + build de production
```

## Stack

React 19, TypeScript strict, Vite, Zustand, TanStack Query, TanStack Virtual, d3-geo, Tailwind CSS v4, shadcn/ui (Radix UI), Vitest, React Testing Library, Playwright, GitHub Actions.

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

Les choix structurants :

- **Les calculs sortent du main thread.** Le worker est exposé comme un backend asynchrone via une petite couche RPC (`src/lib/dataWorker.ts`) : chaque appel renvoie une `Promise`, branchée directement dans React Query (cache, annulation, états de chargement). Remplacer le worker par une vraie API HTTP ne changerait que cette couche.
- **La logique métier est pure.** `src/data/query.ts` et `src/lib/geo.ts` n'importent ni React ni le DOM : ils tournent dans le worker ou le navigateur et se testent directement en Vitest.
- **Un état par nature.** Zustand pour l'état synchrone (filtres, panneaux), React Query pour l'asynchrone, avec des sélecteurs ciblés pour éviter les re-rendus en cascade.
- **Une source unique pour les raccourcis** (`src/lib/shortcuts.ts`) : le même registre alimente le gestionnaire clavier et la boîte d'aide `?`, qui ne peuvent donc pas diverger.

## Performance

- Filtre, tri et toutes les agrégations en **une seule passe** dans un **Web Worker**.
- Le dataset n'est cloné vers le main thread qu'une fois ; ensuite, chaque requête ne renvoie qu'un `Uint32Array` d'index **transféré sans copie**.
- Table **virtualisée** : une trentaine de lignes dans le DOM quel que soit le volume, ce qu'un test vérifie.
- Saisie fluide grâce à `useDeferredValue` ; `keepPreviousData` évite le flash vide pendant les recalculs.
- Animations (jauges, vagues, zoom de la carte) pilotées par `requestAnimationFrame` ; les vagues se redessinent sans re-rendu React et s'arrêtent hors écran.
- **Diagnostic au profiler** : en dev, React 19 compare en profondeur les props modifiées pour sa piste « Components », ce qui coûtait environ 1 s par commit sur le tableau de 150 000 lignes. Marquer ce tableau comme valeur opaque (`Symbol.toStringTag`, en dev uniquement) a supprimé le coût.

## Visualisation de données

Les visualisations sont des composants **SVG maison** plutôt qu'une bibliothèque de graphiques : le design demandait des formes spécifiques (jauges segmentées, remplissages en vague, carte en points) que les bibliothèques rendent mal, et le SVG lit directement les tokens CSS du thème.

- **Jauges segmentées** : un seul arc, découpé en 5 segments par `stroke-dasharray`/`dashoffset`.
- **Cartes en vague** : sinusoïde lissée (Catmull-Rom → Bézier) dont la hauteur suit la valeur.
- **Animation cohérente** : un hook `useTween` partagé (même durée, même courbe) qui repart de la valeur affichée si les données changent en cours d'animation.
- **Honnêteté des chiffres** : une part au dénominateur nul s'affiche « — » plutôt qu'un 0 % trompeur.
- **Filtrage croisé** : cliquer un pays dans le classement ou sur la carte filtre toute l'application.

### Carte du monde

- Projection Equal Earth (d3-geo) et tracé Natural Earth (~50 Ko), calculés une fois au chargement. Les continents sont une trame de points dont le pas reste constant à l'écran : zoomer ajoute des points au lieu de les grossir.
- **Regroupement des pays proches** à l'échelle courante (algorithme glouton sur barycentres pondérés). Cliquer un groupe zoome juste assez pour séparer ses membres.
- Zoom, déplacement à la souris ou au doigt, sans que le glisser ne déclenche de clic parasite.
- Regroupement et calcul du zoom sont des fonctions pures testées unitairement.

## Intégration IA en streaming

- Consommation **SSE via `fetch` et `ReadableStream`** plutôt qu'`EventSource`, qui ne gère ni le POST ni l'annulation.
- **Machine à états explicite** : `idle → thinking → streaming → done | aborted | error`.
- **Annulation** par `AbortController` (bouton Arrêter, Échap, nouvelle question, démontage).
- **Un rendu par frame** et non par token : les tokens s'accumulent dans une ref, l'état est mis à jour une fois par `requestAnimationFrame`.
- Parseur SSE robuste aux événements coupés entre deux chunks réseau, couvert par des tests.
- Seuls les **agrégats** sont envoyés au modèle, jamais les lignes brutes.
- Backend simulé (plugin Vite en local, Vercel Function en ligne) : brancher un vrai LLM ne change que l'endpoint.

## Accessibilité

- Table en **ARIA grid** (`aria-rowcount`, `aria-rowindex`, `aria-sort`, `aria-activedescendant`) avec navigation clavier par ligne (flèches, Page Up/Down, Début/Fin, Entrée).
- Lien d'évitement vers le contenu principal ; raccourcis à une touche désactivables dans Réglages et coupés d'office sur mobile (WCAG 2.1.4).
- Visualisations décrites textuellement ; points de la carte focusables et activables au clavier.
- L'assistant annonce ses changements d'état via `role="status"` sans faire relire chaque token.
- `prefers-reduced-motion` respecté ; la couleur ne porte jamais seule l'information ; contrastes visés, y compris pour les contrôles (WCAG 1.4.11).
- **Audit axe WCAG 2.0 à 2.2, niveaux A et AA** automatisé en e2e, en desktop et en mobile, y compris avec une réponse de l'assistant et la fiche d'exigence ouverte.
- Limites : un audit automatisé ne détecte qu'une partie des défauts. Aucun audit manuel ni test aux lecteurs d'écran n'a été mené ; le projet ne revendique donc pas de conformité RGAA.

## Design system

- Tokens dans `src/index.css` exposés à Tailwind v4 via `@theme inline` (couleurs, échelle typographique, rayons). Les composants n'utilisent pas de valeurs arbitraires.
- shadcn/ui sur Radix UI, avec ses tokens redirigés vers ceux du projet.
- Mise en page en 3 zones sur bureau (filtres, tableau de bord, assistant), panneaux réductibles et mémorisés ; sur mobile, tiroirs, liste virtualisée et cibles tactiles de 44 px.
- La table n'utilise pas le `Table` de shadcn : un vrai `<table>` est incompatible avec le positionnement absolu de la virtualisation. Elle garde une sémantique ARIA grid sur des `div`.

## Qualité et tests

- **TypeScript strict** avec `noUncheckedIndexedAccess`.
- **Pyramide de tests** : fonctions pures en unitaire (requêtes et agrégats, génération, géographie, parseur SSE, raccourcis), composants avec Testing Library, parcours complets avec Playwright (filtres, cohérence des totaux, carte, tri, raccourcis, annulation de l'assistant, mobile, accessibilité).
- **CI GitHub Actions** : typecheck, tests, build, puis e2e avec publication du rapport en cas d'échec.

### Retour d'expérience : un bug révélé par l'e2e

Le test « l'assistant peut être interrompu » a mis au jour un défaut réel. Les boutons « Analyser » (`type="submit"`) et « Stop » (`type="button"`) occupaient le même emplacement d'un ternaire : React réutilisait le même nœud DOM, si bien qu'un clic sur Stop soumettait le formulaire et relançait une requête au lieu d'annuler. Correctif : une `key` distincte par bouton et une garde dans `onSubmit`. Depuis, « Arrêter » vit hors du formulaire, ce qui supprime le piège à la source ; la garde reste en défense.

## Pistes d'évolution

- Découpage du bundle (`import()` dynamique de la carte et de l'assistant).
- `SharedArrayBuffer` ou DuckDB-WASM au-delà du million de lignes.
- WebSocket à la place de SSE pour un dialogue bidirectionnel, avec la même machine à états.
- Storybook pour documenter les composants.
