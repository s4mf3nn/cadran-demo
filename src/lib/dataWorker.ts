import type { WorkerRequest, WorkerResponse } from '../workers/data.worker';

type Pending = { resolve: (r: WorkerResponse) => void; reject: (e: Error) => void };
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/**
 * Petite couche RPC au-dessus de postMessage : chaque appel renvoie une Promise,
 * ce qui permet de brancher le worker directement dans React Query.
 */
class DataWorkerClient {
  private worker = new Worker(new URL('../workers/data.worker.ts', import.meta.url), { type: 'module' });
  private pending = new Map<number, Pending>();
  private seq = 0;

  constructor() {
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const p = this.pending.get(e.data.id);
      if (!p) return;
      this.pending.delete(e.data.id);
      if (e.data.type === 'error') p.reject(new Error(e.data.message));
      else p.resolve(e.data);
    };
  }

  call<T extends WorkerResponse['type']>(req: DistributiveOmit<WorkerRequest, 'id'>) {
    const id = ++this.seq;
    return new Promise<Extract<WorkerResponse, { type: T }>>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as Pending['resolve'], reject });
      this.worker.postMessage({ ...req, id });
    });
  }
}

let client: DataWorkerClient | null = null;
export const dataWorker = () => (client ??= new DataWorkerClient());
