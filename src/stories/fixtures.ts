import { generateRequirements } from '../data/generate';
import { initialFilters } from '../store/filters';
import { runQuery } from '../data/query';
import type { AssistantApi } from '../hooks/useAssistant';

/** Jeu déterministe réduit : assez pour des agrégats crédibles, instantané à générer. */
export const requirements = generateRequirements(2000);
export const sample = requirements[0]!;

export const aggregates = runQuery(requirements, initialFilters, { key: 'dueAt', dir: 'asc' }).aggregates;

/** Assistant factice : les stories n'appellent jamais le faux endpoint IA. */
export const fakeAssistant = { status: 'idle', ready: true, send: () => {} } as unknown as AssistantApi;
