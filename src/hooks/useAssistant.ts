import { useCallback } from 'react';
import type { Aggregates } from '../data/types';
import { useAssistantStream } from './useAssistantStream';

export const SUGGESTIONS = [
  'Quelles exigences non conformes dois-je prioriser ce trimestre ?',
  'Quels pays concentrent le plus de risque ?',
  'Résume l’état de conformité de la sélection.',
] as const;

/** Flux de l'assistant + envoi d'une question avec le contexte de la sélection courante (agrégats, pas les 150 000 lignes). */
export function useAssistant(aggregates?: Aggregates) {
  const stream = useAssistantStream();
  const { ask } = stream;

  const send = useCallback(
    (question: string) => {
      if (!aggregates) return;
      ask({
        question,
        context: { total: aggregates.total, atRisk: aggregates.atRisk, topCountry: aggregates.byCountry[0]?.country },
      });
    },
    [ask, aggregates],
  );

  return { ...stream, send, ready: aggregates != null };
}

export type AssistantApi = ReturnType<typeof useAssistant>;
