import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowDown01Icon, ArrowUp01Icon, ArrowUp02Icon, StopIcon } from '@hugeicons/core-free-icons';
import { SUGGESTIONS, type AssistantApi, type Turn } from '../hooks/useAssistant';
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
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
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
        {chips.map((c) => (
          <li key={c} className="rounded-full bg-accent px-2.5 py-0.5 text-xs">
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

const SUGGESTIONS_KEY = 'compass.assistant.suggestions';

/** Suggestions visibles par défaut ; le choix est mémorisé (lecture/écriture protégées). */
function useSuggestionsVisible() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(SUGGESTIONS_KEY) !== 'hidden';
    } catch {
      return true;
    }
  });
  const toggle = () =>
    setVisible((v) => {
      try {
        localStorage.setItem(SUGGESTIONS_KEY, v ? 'hidden' : 'visible');
      } catch {
        // Pas de persistance possible : le choix vaut pour la session.
      }
      return !v;
    });
  return [visible, toggle] as const;
}

/** Échange passé : question + réponse figée, sans curseur ni squelette. */
function PastTurn({ turn }: { turn: Turn }) {
  return (
    <>
      <div className="self-end rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground text-sm">{turn.question || 'Analyser la sélection courante'}</div>
      {turn.text && <div className="text-sm leading-relaxed whitespace-pre-wrap">{renderBold(turn.text)}</div>}
      {turn.status === 'aborted' && <p className="text-xs text-muted-foreground">Génération interrompue.</p>}
      {turn.status === 'error' && <p className="text-xs text-destructive">Erreur : {turn.error}</p>}
    </>
  );
}

export function AssistantPanel({ assistant, total }: { assistant: AssistantApi; total?: number }) {
  const { status, text, error, question: asked, history, send, stop, reset, ready } = assistant;
  const [question, setQuestion] = useState('');
  const [showSuggestions, toggleSuggestions] = useSuggestionsVisible();
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === 'thinking' || status === 'streaming';

  // Suivi du bas : on se base sur l'intention de l'utilisateur, pas sur sa distance au bas.
  // Seul un geste vers le haut peut interrompre le suivi (le défilement automatique ne fait que descendre),
  // et il ne reprend que lorsqu'on est revenu tout en bas. Un seuil de distance recollait l'utilisateur
  // dès les premiers pixels d'un geste de remontée, d'où le « sursaut ».
  const stickRef = useRef(true);
  const lastTopRef = useRef(0);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < lastTopRef.current) stickRef.current = false;
    else if (el.scrollHeight - el.scrollTop - el.clientHeight <= 2) stickRef.current = true;
    lastTopRef.current = el.scrollTop;
  };
  // Chaque nouvelle question recolle en bas (et repart d'une position connue, la zone ayant pu être vidée ou masquée).
  useEffect(() => {
    if (status !== 'thinking') return;
    stickRef.current = true;
    lastTopRef.current = scrollRef.current?.scrollTop ?? 0;
  }, [status, history.length]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [history.length, text, status]);

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 py-4">
      <ContextChips total={total} />

      {/* Conversation : annoncée en poli, et seulement une fois la génération terminée (aria-busy). */}
      <div hidden={status === 'idle'} className="flex min-h-0 flex-1 flex-col gap-1.5 px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground">Discussion</h3>
          <Button type="button" variant="ghost" size="xs" disabled={busy} onClick={reset}>
            Nouvelle conversation
          </Button>
        </div>
        <div ref={scrollRef} onScroll={onScroll} aria-live="polite" aria-busy={busy} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-muted/40 p-3">
          {status !== 'idle' && (
            <>
              {history.map((t) => (
                <PastTurn key={t.id} turn={t} />
              ))}
              {history.length > 0 && <hr className="border-border" />}
              <div className="self-end rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground text-sm">{asked || 'Analyser la sélection courante'}</div>

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
                    <Button type="button" size="xs" variant="outline" onClick={() => send(asked, { retry: true })}>
                      Réessayer
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </div>

      <div className={cn('mt-auto flex flex-col gap-3 px-4', status !== 'idle' && 'border-t border-border pt-3')}>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground">Suggestions</h3>
            <Button type="button" variant="ghost" size="xs" aria-expanded={showSuggestions} aria-controls="assistant-suggestions" onClick={toggleSuggestions}>
              {showSuggestions ? 'Masquer' : 'Afficher'}
              <Icon icon={showSuggestions ? ArrowDown01Icon : ArrowUp01Icon} />
            </Button>
          </div>
          <ol id="assistant-suggestions" hidden={!showSuggestions} aria-label="Suggestions" className="flex flex-col gap-1.5">
            {SUGGESTIONS.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  disabled={busy || !ready}
                  onClick={() => send(s)}
                  className="flex min-h-9 w-full items-center gap-2 rounded-lg border border-dashed border-input-strong bg-background px-2 py-1.5 text-left text-sm hover:bg-accent disabled:opacity-50"
                >
                  <Kbd aria-hidden="true">{i + 1}</Kbd>
                  <span className="flex-1">{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-xl border border-input-strong bg-background p-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <label htmlFor="assistant-input" className="sr-only">
            Question à l'assistant
          </label>
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
            <span className="mr-auto flex items-center gap-1 text-xs text-muted-foreground max-md:hidden">
              <Kbd aria-hidden="true">↵</Kbd> envoyer
            </span>
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
