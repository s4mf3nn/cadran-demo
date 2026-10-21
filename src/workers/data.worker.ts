/// <reference lib="webworker" />
import { generateRequirements } from '../data/generate';
import { runQuery } from '../data/query';
import type { Filters, Requirement, Sort } from '../data/types';

export type WorkerRequest =
  | { id: number; type: 'init'; size: number; seed: number }
  | { id: number; type: 'query'; filters: Filters; sort: Sort };

export type WorkerResponse =
  | { id: number; type: 'init'; data: Requirement[]; ms: number }
  | { id: number; type: 'query'; result: ReturnType<typeof runQuery>; ms: number }
  | { id: number; type: 'error'; message: string };

declare const self: DedicatedWorkerGlobalScope;

let data: Requirement[] = [];

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  const t0 = performance.now();
  try {
    if (msg.type === 'init') {
      data = generateRequirements(msg.size, msg.seed);
      // Le dataset est cloné une seule fois vers le main thread (pour l'affichage).
      self.postMessage({ id: msg.id, type: 'init', data, ms: performance.now() - t0 } satisfies WorkerResponse);
    } else {
      const result = runQuery(data, msg.filters, msg.sort);
      // Les requêtes suivantes ne renvoient que des index : transfert sans copie.
      self.postMessage(
        { id: msg.id, type: 'query', result, ms: performance.now() - t0 } satisfies WorkerResponse,
        [result.indices.buffer],
      );
    }
  } catch (err) {
    self.postMessage({ id: msg.id, type: 'error', message: String(err) } satisfies WorkerResponse);
  }
};
