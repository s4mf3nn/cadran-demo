import { useId, useState, type FormEvent } from 'react';
import { useAssistantStream } from '../hooks/useAssistantStream';
import type { Aggregates } from '../data/types';

const STATUS_TEXT = {
  idle: '',
  thinking: "L'assistant analyse la sélection…",
  streaming: 'Réponse en cours…',
  done: 'Réponse terminée.',
  aborted: 'Génération interrompue.',
  error: 'Une erreur est survenue.',
} as const;

/** Rendu minimal du **gras** sans dépendance markdown (et sans dangerouslySetInnerHTML). */
function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function AssistantPanel({ aggregates }: { aggregates?: Aggregates }) {
  const { status, text, error, ask, stop } = useAssistantStream();
  const [question, setQuestion] = useState('');
  const inputId = useId();
  const busy = status === 'thinking' || status === 'streaming';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!aggregates || busy) return;
    // On envoie un résumé des agrégats, pas les 150 000 lignes : c'est le contexte utile au modèle.
    ask({
      question,
      context: { total: aggregates.total, atRisk: aggregates.atRisk, topCountry: aggregates.byCountry[0]?.country },
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby={`${inputId}-title`}>
      <h2 id={`${inputId}-title`} className="text-sm font-semibold text-slate-700">Assistant conformité (IA)</h2>

      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">Question à l'assistant</label>
        <input
          id={inputId}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex. : que dois-je prioriser ce trimestre ?"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {busy ? (
          <button key="stop" type="button" onClick={stop} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white">
            Stop
          </button>
        ) : (
          <button key="submit" type="submit" disabled={!aggregates} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            Analyser
          </button>
        )}
      </form>

      {/* Annonce discrète des changements d'état pour les lecteurs d'écran, sans relire chaque token. */}
      <p role="status" className="sr-only">{STATUS_TEXT[status]}</p>

      {status === 'thinking' && (
        <div aria-hidden="true" className="space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        </div>
      )}

      {text && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800" aria-busy={busy}>
          {renderBold(text)}
          {status === 'streaming' && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-slate-500 align-middle" />}
        </div>
      )}

      {status === 'aborted' && <p className="text-xs text-slate-500">Génération interrompue.</p>}
      {status === 'error' && <p role="alert" className="text-sm text-red-700">Erreur : {error}</p>}
    </section>
  );
}
