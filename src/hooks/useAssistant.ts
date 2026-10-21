import { useCallback, useState } from 'react';
import type { Aggregates } from '../data/types';
import { useAssistantStream, type StreamStatus } from './useAssistantStream';

export const SUGGESTIONS = [
  'Quelles exigences non conformes dois-je prioriser ce trimestre ?',
  'Quels pays concentrent le plus de risque ?',
  'Résume l’état de conformité de la sélection.',
] as const;

/** Échange terminé, conservé pour garder le fil de la conversation. */
export interface Turn {
  id: number;
  question: string;
  text: string;
  status: StreamStatus;
  error: string | null;
}

/** Flux de l'assistant + envoi d'une question avec le contexte de la sélection courante (agrégats, pas les 150 000 lignes). */
export function useAssistant(aggregates?: Aggregates) {
  const stream = useAssistantStream();
  const { ask, clear, status, question: lastQuestion, text, error } = stream;
  const [history, setHistory] = useState<Turn[]>([]);

  // `retry` rejoue l'échange courant (en erreur) : il ne doit pas être archivé en doublon.
  const send = useCallback(
    (question: string, { retry = false } = {}) => {
      if (!aggregates) return;
      if (!retry && status !== 'idle') {
        setHistory((h) => [...h, { id: h.length, question: lastQuestion, text, status, error }]);
      }
      ask({
        question,
        context: { total: aggregates.total, atRisk: aggregates.atRisk, topCountry: aggregates.byCountry[0]?.country },
      });
    },
    [ask, aggregates, status, lastQuestion, text, error],
  );

  const reset = useCallback(() => {
    clear();
    setHistory([]);
  }, [clear]);

  return { ...stream, history, send, reset, ready: aggregates != null };
}

export type AssistantApi = ReturnType<typeof useAssistant>;
