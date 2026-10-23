/// <reference lib="webworker" />
import { columnBuffers, generateColumns, rowAt, type Columns } from '../data/generate';
import { runQuery } from '../data/query';
import type { Filters, Requirement, Sort } from '../data/types';

export type WorkerRequest =
  | { id: number; type: 'init'; size: number; seed: number }
  | { id: number; type: 'query'; size: number; seed: number; filters: Filters; sort: Sort };

export type WorkerResponse =
  | { id: number; type: 'init'; columns: Columns; size: number; ms: number }
  | { id: number; type: 'query'; result: ReturnType<typeof runQuery>; ms: number }
  | { id: number; type: 'error'; message: string };

declare const self: DedicatedWorkerGlobalScope;

/** Un seul référentiel en mémoire : celui de la dernière taille demandée. */
let current: { size: number; seed: number; data: Requirement[] } | null = null;

function load(size: number, seed: number): Columns {
  const columns = generateColumns(size, seed);
  current = { size, seed, data: Array.from({ length: size }, (_, i) => rowAt(columns, i)) };
  return columns;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  const t0 = performance.now();
  try {
    if (msg.type === 'init') {
      const columns = load(msg.size, msg.seed);
      // Le main thread ne reçoit que les colonnes (~13 octets par ligne), transférées sans copie :
      // cloner 1 M d'objets le bloquerait plusieurs secondes.
      self.postMessage(
        { id: msg.id, type: 'init', columns, size: msg.size, ms: performance.now() - t0 } satisfies WorkerResponse,
        columnBuffers(columns),
      );
    } else {
      // Retour à une taille déjà en cache côté main thread : le worker régénère (déterministe).
      if (current?.size !== msg.size || current.seed !== msg.seed) load(msg.size, msg.seed);
      const result = runQuery(current!.data, msg.filters, msg.sort);
      // Les requêtes ne renvoient que des index : transfert sans copie.
      self.postMessage(
        { id: msg.id, type: 'query', result, ms: performance.now() - t0 } satisfies WorkerResponse,
        [result.indices.buffer],
      );
    }
  } catch (err) {
    self.postMessage({ id: msg.id, type: 'error', message: String(err) } satisfies WorkerResponse);
  }
};
