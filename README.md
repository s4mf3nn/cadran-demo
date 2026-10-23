# Cadran

**[▶ Voir la démo en ligne](https://cadran-demo-nine.vercel.app/)** · **[📖 Storybook](https://cadran-demo-nine.vercel.app/storybook/)**

Tableau de bord de pilotage de la conformité réglementaire : **jusqu'à 1 000 000 d'exigences** par pays, catégorie, statut, risque et échéance, avec un assistant IA en streaming. Projet de démonstration (données fictives, générées de façon déterministe).

> **Montée en charge en un clic** : le sélecteur flottant `150 k | 1 M`, en bas à droite, régénère le référentiel à 1 million d'exigences. Filtres, tri, recherche, carte et table restent fluides : aucune tâche longue sur le main thread.

Ce qu'il met en avant :

- **Performance** : 1 million d'exigences filtrées, triées et agrégées côté client sans bloquer l'interface (Web Worker, données en colonnes transférées sans copie, tri en O(n), virtualisation sans plafond de volume).
- **Visualisation de données** sur mesure en SVG, dont une carte du monde interactive avec regroupement et zoom.
- **Vues partageables** : filtres, tri et fiche ouverte vivent dans l'URL. Un lien reproduit la vue à l'identique, et les boutons précédent/suivant du navigateur la rejouent.
- **Exigences modifiables** : statut, risque, échéance, intitulé, pays, catégorie et réglementation s'éditent depuis la fiche. Les modifications sont conservées dans le navigateur et se répercutent sur la table, les filtres et tous les agrégats, même à 1 M de lignes.
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
npm run storybook    # http://localhost:6006 (catalogue des composants)
npm run build        # typecheck + Storybook + build de production
```

## Stack

React 19, TypeScript strict, Vite, Zustand, TanStack Query, d3-geo, Tailwind CSS v4, shadcn/ui (Radix UI), Vitest, React Testing Library, Playwright, Storybook, GitHub Actions.

## Architecture

```
┌────────────────────────── main thread ──────────────────────────┐
│  Composants React (présentation, ARIA, raccourcis)              │
│        ▲ sélecteurs ciblés                  ▲ résultats         │
│  Zustand : filtres, tri, UI      TanStack Query : cache, états  │
│        │                                    │                   │
│        └──────────► lib/dataWorker (RPC par Promise) ◄──────────┤
└──────────────────────────────┬──────────────────────────────────┘
                               │ postMessage : colonnes (typed arrays) puis index (Uint32Array), transférés sans copie
┌──────────────────────────────▼──────────────────────────────────┐
│  Web Worker : 150 k à 1 M exigences, filtre + tri + agrégats    │
│  src/data/query.ts : fonctions pures, testables sans navigateur │
└─────────────────────────────────────────────────────────────────┘

Assistant IA : hook useAssistantStream ──fetch + ReadableStream (SSE)──► /api/assistant
```

Les choix structurants :

- **Les calculs sortent du main thread.** Le worker est exposé comme un backend asynchrone via une petite couche RPC (`src/lib/dataWorker.ts`) : chaque appel renvoie une `Promise`, branchée directement dans React Query (cache, annulation, états de chargement). Remplacer le worker par une vraie API HTTP ne changerait que cette couche.
- **La logique métier est pure.** `src/data/query.ts` et `src/lib/geo.ts` n'importent ni React ni le DOM : ils tournent dans le worker ou le navigateur et se testent directement en Vitest.
- **Un état par nature.** Zustand pour l'état synchrone (filtres, panneaux), React Query pour l'asynchrone, avec des sélecteurs ciblés pour éviter les re-rendus en cascade.
- **L'URL reflète la vue.** Filtres, tri et fiche ouverte sont synchronisés avec la query string (`src/lib/urlState.ts`, `src/hooks/useUrlState.ts`) : le store Zustand reste la source de vérité de l'interface, l'URL en est le miroir partageable.
- **Les modifications sont une couche, pas une réécriture.** Le référentiel reste généré et immuable ; les éditions vivent à part (`src/store/edits.ts`) et se superposent à lui (`applyEdit`) côté worker et côté affichage.
- **Une source unique pour les raccourcis** (`src/lib/shortcuts.ts`) : le même registre alimente le gestionnaire clavier et la boîte d'aide `?`, qui ne peuvent donc pas diverger.

## Performance

### Jusqu'à 1 000 000 d'exigences

Le sélecteur flottant `150 k | 1 M` régénère le référentiel dans le worker ; l'ancien reste affiché pendant la génération. Mesures à 1 M dans Chromium (Playwright, poste de développement) :

| | 1 000 000 d'exigences |
| --- | --- |
| Génération (worker) | ~200 ms |
| Requête complète : filtre + tri + agrégats (worker) | ~30 à 100 ms |
| Passage 150 k → 1 M, du clic à l'affichage | < 1 s |
| Tâches longues (> 50 ms) sur le main thread : passage à 1 M, saisie d'une recherche, zoom et déplacement de la carte, tri, filtre, navigation jusqu'en fin de table | aucune, vérifié en CI |

Deux tests e2e en font des garanties :

- **Aucune tâche longue** (`e2e/performance.spec.ts`) : un `PerformanceObserver` de la Long Tasks API rejoue chacune de ces interactions à 1 M et échoue si l'une bloque le main thread plus de 50 ms, en nommant l'étape fautive. Le test tourne seul, après les autres, pour qu'aucun navigateur parallèle ne fausse la mesure. Vérifié dans l'autre sens : 80 ms de calcul synchrone ajoutées au tri le font bien échouer.
- **Le bon nombre de lignes** : à chaque palier, dans les deux sens, la table contient exactement le nombre d'exigences annoncé et la dernière ligne est bien `REQ-1000000`.

### Comment

- Filtre, tri et toutes les agrégations en **une seule passe** dans un **Web Worker**.
- Le main thread ne reçoit jamais d'objets : le worker lui **transfère** le référentiel **en colonnes** (typed arrays, ~13 octets par exigence), puis chaque requête ne renvoie qu'un `Uint32Array` d'index. Les lignes sont reconstruites à la demande (`RowSet`) : seule la trentaine affichée par la table existe en mémoire.
- Tri **par comptage** en O(n) (toutes les clés sont de faible cardinalité) : environ 20 ms à 1 M de lignes, contre environ 200 ms pour `sort` + `localeCompare` (mesuré sous Node).
- Table **virtualisée** : une trentaine de lignes dans le DOM quel que soit le volume, ce qu'un test vérifie. Au-delà de 15 M px (1 M de lignes = 46 M px, plus que la hauteur maximale d'un élément dans Chrome ou Firefox), la hauteur défilable est plafonnée et le défilement mis à l'échelle (`src/hooks/useFixedVirtual.ts`) : la dernière ligne reste atteignable.
- Saisie fluide grâce à `useDeferredValue` ; `keepPreviousData` évite le flash vide pendant les recalculs.
- Animations (jauges, vagues, zoom de la carte) pilotées par `requestAnimationFrame` ; les vagues se redessinent sans re-rendu React et s'arrêtent hors écran.
- **Diagnostic au profiler** : en dev, React 19 compare en profondeur les props modifiées pour sa piste « Components », ce qui coûtait environ 1 s par commit sur le tableau de 150 000 lignes. Le tableau de lignes a depuis laissé place à un accès paresseux (`RowSet`), qui supprime le problème à la source.

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

## Vues partageables (état dans l'URL)

Chaque vue a une adresse : on la copie, on l'envoie, on la retrouve. Exemple :

```
?pays=France,Italie&statut=non_conforme&risque=4&echeance=90&tri=risk.desc&fiche=1234
```

- **Clés lisibles** : `q`, `pays`, `categorie`, `statut`, `reglementation`, `risque`, `echeance`, `tri` (`clé.sens`) et `fiche`. Seuls les écarts avec l'état initial apparaissent : la vue par défaut a une URL propre.
- **Précédent/suivant** : chaque changement de filtre, de tri ou de fiche ajoute une entrée d'historique, et `popstate` rejoue l'état, fiche comprise. La saisie dans la recherche *remplace* l'entrée courante au lieu d'en empiler une par frappe.
- **Fiche reconstruite à la demande** : l'URL ne porte que l'identifiant ; l'exigence est relue dans les colonnes du référentiel dès qu'elles sont chargées, y compris sur un lien ouvert à froid.
- **URL tolérante** : valeurs inconnues, risque hors plage ou identifiant inexistant sont ignorés, sans erreur.
- **Codec pur** : `encodeUrlState` / `decodeUrlState` n'ont aucune dépendance au DOM ; aller-retour et cas invalides sont couverts en Vitest, et un test e2e rejoue ouverture, fermeture, retour et avance.
- Limite assumée : la taille du jeu (150 k ou 1 M) n'est pas dans l'URL, la démo repartant toujours de 150 000 exigences.

## Édition des exigences

Dans la fiche d'une exigence, **Modifier** ouvre un formulaire (intitulé, statut, risque, échéance, réglementation, pays, catégorie). La référence reste celle du référentiel.

- **Une couche par-dessus le référentiel** : les modifications sont une table `id → champs modifiés` (`src/data/edits.ts`), persistée dans `localStorage` (clé `cadran:edits`, relue avec validation : ids, champs et valeurs inconnus sont écartés). Les ids sont stables, le jeu étant déterministe, et les 150 000 premières lignes sont communes aux deux paliers : une modification survit au rechargement et au changement de palier.
- **Cohérence avec les calculs** : chaque requête au worker porte les modifications et leur version. Le worker remplace les lignes concernées avant de filtrer, trier et agréger, et restaure les lignes d'origine quand une modification disparaît. Table, filtres, jauges, carte et échéances reflètent donc les valeurs éditées. La fiche ouverte se met à jour immédiatement, sans attendre le recalcul.
- **Rétablir l'original** efface les modifications d'une exigence. Changer la réglementation sans toucher à l'intitulé met à jour le suffixe de l'intitulé (« Sujet (REACH) »).
- **Limites assumées** : pas de serveur, les modifications restent locales à ce navigateur ; l'assistant, qui travaille sur ses propres agrégats côté serveur, ne les voit pas ; ni ajout ni suppression d'exigences.

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
- **Storybook** (`/storybook/`, déployé avec l'app) : les composants de données (`StatusTag`, `RiskMeter`), les visualisations (jauges, vagues, carte), les primitives `ui/*` et les composants riches (`FilterPanel`, `RequirementDetail`) avec leurs états, des `play` functions pour les interactions et l'addon a11y. Les stories s'appuient sur le même générateur déterministe que l'application ; l'état Zustand est préparé par story. Le build de Storybook fait partie de `npm run build` : une story cassée fait échouer la CI.
- La table n'utilise pas le `Table` de shadcn : un vrai `<table>` est incompatible avec le positionnement absolu de la virtualisation. Elle garde une sémantique ARIA grid sur des `div`.

## Qualité et tests

- **TypeScript strict** avec `noUncheckedIndexedAccess`.
- **Pyramide de tests** : fonctions pures en unitaire (requêtes et agrégats, équivalence du tri par comptage avec le comparateur, génération, virtualisation à 1 M, géographie, codec d'URL, parseur SSE, raccourcis), composants avec Testing Library, parcours complets avec Playwright (filtres, édition d'une exigence et rechargement, état dans l'URL et historique, cohérence des totaux, nombre de lignes à 150 k et 1 M, absence de tâches longues à 1 M, carte, tri, raccourcis, annulation de l'assistant, mobile, accessibilité).
- **CI GitHub Actions** : typecheck, tests, build (Storybook inclus), puis e2e avec publication du rapport en cas d'échec.

### Retours d'expérience : des bugs révélés par l'e2e

**La fin du tableau inatteignable à 1 M.** En vérifiant qu'à chaque palier la table contient le bon nombre de lignes, la touche Fin s'arrêtait à la ligne 729 456 sur 1 000 000. Cause : 1 M de lignes de 46 px font 46 M px, au-delà de la hauteur maximale d'un élément (≈ 33,5 M px dans Chrome, ≈ 17,9 M px dans Firefox). Correctif : une virtualisation à hauteur fixe (`src/hooks/useFixedVirtual.ts`) qui plafonne la hauteur défilable à 15 M px et met la position de défilement à l'échelle. En dessous du plafond, le comportement est inchangé.

**Stop qui relançait la requête.**

Le test « l'assistant peut être interrompu » a mis au jour un défaut réel. Les boutons « Analyser » (`type="submit"`) et « Stop » (`type="button"`) occupaient le même emplacement d'un ternaire : React réutilisait le même nœud DOM, si bien qu'un clic sur Stop soumettait le formulaire et relançait une requête au lieu d'annuler. Correctif : une `key` distincte par bouton et une garde dans `onSubmit`. Depuis, « Arrêter » vit hors du formulaire, ce qui supprime le piège à la source ; la garde reste en défense.

**Un worker aveugle à ses propres colonnes.** Le premier essai d'édition a fait échouer le test e2e : toute requête levait une erreur après la première modification. Le worker relisait les colonnes d'origine pour restaurer une ligne, or ces buffers sont *transférés* au main thread et ne lui appartiennent plus (longueur 0). Correctif : il garde les lignes d'origine qu'il remplace. Même test, un second défaut : le bouton « Modifier » et le bouton « Enregistrer » (`type="submit"`) occupaient le même emplacement, et le clic en cours soumettait le formulaire. Même cause, même remède que pour Stop (une `key` par bouton).

## Pistes d'évolution

- Édition en ligne dans le tableau (statut, risque) et persistance côté serveur (React Query `useMutation`, mises à jour optimistes).
- Découpage du bundle (`import()` dynamique de la carte et de l'assistant).
- `SharedArrayBuffer` ou DuckDB-WASM au-delà du million de lignes.
- WebSocket à la place de SSE pour un dialogue bidirectionnel, avec la même machine à états.
