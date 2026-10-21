import { useCallback, useEffect, useRef, useState } from 'react';
import { readSSE } from '../lib/sse';

export type StreamStatus = 'idle' | 'thinking' | 'streaming' | 'done' | 'aborted' | 'error';

/**
 * Gère une réponse LLM en streaming :
 * - machine à états explicite (thinking -> streaming -> done/aborted/error)
 * - annulation via AbortController (bouton Stop, nouvelle question, démontage)
 * - rendu regroupé par frame : on accumule les tokens dans une ref et on ne
 *   déclenche qu'un setState par requestAnimationFrame, au lieu d'un par token.
 */
export interface AskPayload {
  question: string;
  context?: unknown;
}

export function useAssistantStream(endpoint = '/api/assistant') {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Dernière question posée : affichée dans la conversation et rejouée par « Réessayer ».
  const [question, setQuestion] = useState('');

  const controllerRef = useRef<AbortController | null>(null);
  const bufferRef = useRef('');
  const rafRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    rafRef.current = null;
    setText(bufferRef.current);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(flush);
  }, [flush]);

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    bufferRef.current = '';
    setText('');
    setError(null);
    setQuestion('');
    setStatus('idle');
  }, []);

  const ask = useCallback(
    async (payload: AskPayload) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      bufferRef.current = '';
      setText('');
      setError(null);
      setQuestion(payload.question);
      setStatus('thinking');

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        for await (const data of readSSE(res.body)) {
          if (controller.signal.aborted || data === '[DONE]') break;
          const { delta } = JSON.parse(data) as { delta: string };
          if (!bufferRef.current) setStatus('streaming');
          bufferRef.current += delta;
          scheduleFlush();
        }
        flush();
        // Selon le navigateur, l'annulation peut terminer le flux proprement au lieu de lever une erreur.
        setStatus(controller.signal.aborted ? 'aborted' : 'done');
      } catch (e) {
        flush();
        if (controller.signal.aborted) setStatus('aborted');
        else {
          setError(e instanceof Error ? e.message : String(e));
          setStatus('error');
        }
      }
    },
    [endpoint, flush, scheduleFlush],
  );

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return { status, text, error, question, ask, stop, clear };
}
