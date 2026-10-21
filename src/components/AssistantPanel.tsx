import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowUp02Icon, StopIcon } from '@hugeicons/core-free-icons';
import { SUGGESTIONS, type AssistantApi } from '../hooks/useAssistant';
import { STATUS_LABEL } from '../data/types';
import { useFilters } from '../store/filters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const nf = new Intl.NumberFormat('fr-FR');

/** Rendu minimal du **gras** sans dépendance markdown (et sans dangerouslySetInnerHTML). */
function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

/** Puces qui rappellent la sélection courante, envoyée comme contexte à l'assistant. */
function ContextChips({ total }: { total?: number }) {
  const f = useFilters((s) => s.filters);
  const chips = [
    total != null ? `${nf.format(total)} exigences` : null,
    ...f.statuses.map((s) => STATUS_LABEL[s]),
    f.minRisk > 1 ? `Risque ≥ ${f.minRisk}` : null,
    ...f.categories,
    ...f.countries,
    f.search.trim() ? `« ${f.search.trim()} »` : null,
  ].filter((c): c is string => c != null);

  return (
    <div className="flex flex-col gap-1.5 px-4">
      <h3 className="text-xs font-medium text-muted-foreground">Contexte</h3>
      <ul className="flex flex-wrap gap-1.5">
        {chips.map((c) => <li key={c} className="rounded-full bg-accent px-2.5 py-0.5 text-xs">{c}</li>)}
      </ul>
    </div>
  );
}

export function AssistantPanel({ assistant, total }: { assistant: AssistantApi; total?: number }) {
  const { status, text, error, question: asked, send, stop, ready } = assistant;
  const [question, setQuestion] = useState('');
  const busy = status === 'thinking' || status === 'streaming';

  const submit = () => {
    if (!ready || busy) return;
    send(question.trim());
    setQuestion('');
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-4">
      <ContextChips total={total} />

      {/* Conversation : annoncée en poli, et seulement une fois la génération terminée (aria-busy). */}
      <div aria-live="polite" aria-busy={busy} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
        {status === 'idle' ? (
          <p className="text-sm text-muted-foreground">Posez une question sur la sélection courante, ou lancez une suggestion.</p>
        ) : (
          <>
            <div className="self-end rounded-xl rounded-br-sm bg-accent px-3 py-2 text-sm">
              {asked || 'Analyser la sélection courante'}
            </div>

            {status === 'thinking' && (
              <div className="space-y-2" role="status">
                <p className="text-sm text-muted-foreground">L'assistant analyse la sélection…</p>
                <div aria-hidden="true" className="space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            )}

            {text && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {renderBold(text)}
                {status === 'streaming' && <span aria-hidden="true" className="caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary" />}
              </div>
            )}

            {status === 'aborted' && <p className="text-xs text-muted-foreground">Génération interrompue.</p>}
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between gap-2">
                  <span>Erreur : {error}</span>
                  <Button type="button" size="xs" variant="outline" onClick={() => send(asked)}>Réessayer</Button>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4">
        <ol aria-label="Suggestions" className="flex flex-col gap-1">
          {SUGGESTIONS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                disabled={busy || !ready}
                onClick={() => send(s)}
                className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent disabled:opacity-50"
              >
                <Kbd aria-hidden="true">{i + 1}</Kbd>
                <span className="flex-1">{s}</span>
              </button>
            </li>
          ))}
        </ol>

        <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-xl border border-input-strong bg-background p-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <label htmlFor="assistant-input" className="sr-only">Question à l'assistant</label>
          <textarea
            id="assistant-input"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ex. : que dois-je prioriser ce trimestre ?"
            className="w-full resize-none bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2">
            <span className="mr-auto flex items-center gap-1 text-xs text-muted-foreground"><Kbd aria-hidden="true">↵</Kbd> envoyer</span>
            <Button type="button" variant="outline" size="sm" disabled={!busy} onClick={stop} className={cn(!busy && 'opacity-60')}>
              <Icon icon={StopIcon} />
              Stop
              <Kbd aria-hidden="true">Échap</Kbd>
            </Button>
            <Button type="submit" size="sm" disabled={!ready || busy}>
              Analyser
              <Icon icon={ArrowUp02Icon} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
