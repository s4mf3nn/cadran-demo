import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowUp02Icon, Cancel01Icon, RefreshIcon, SparklesIcon, StopCircleIcon } from '@hugeicons/core-free-icons';
import { SUGGESTIONS, type AssistantApi, type Turn } from '../hooks/useAssistant';
import { COUNTRIES, type Aggregates } from '../data/types';
import { filterChips, type FilterChip } from '../lib/labels';
import { useFilters } from '../store/filters';
import { useUi } from '../store/ui';
import { RIGHT_PANEL_ID } from './layout/RightPanel';
import { STATUS_DOT } from './StatusTag';
import { SegmentBar } from './viz/DotGauge';
import { nf, SEG_BG } from './viz/format';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** Rendu minimal du **gras** sans dépendance markdown (et sans dangerouslySetInnerHTML). */
function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong> : part,
  );
}

const HEADER_BUTTON = 'grid size-10 shrink-0 place-items-center rounded-full text-foreground hover:bg-surface disabled:text-muted disabled:hover:bg-transparent';

function HeaderButton({ icon, label, ...props }: { icon: typeof RefreshIcon; label: string } & React.ComponentProps<'button'>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} className={HEADER_BUTTON} {...props}>
          <Icon icon={icon} size={24} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/** En-tête : tuile Sparkles, titre et sous-titre, puis Nouvelle conversation (et Fermer sur desktop). */
function AssistantHeader({ onReset, resetDisabled, closable }: { onReset: () => void; resetDisabled: boolean; closable: boolean }) {
  const setPanel = useUi((s) => s.setPanel);
  return (
    <div className="flex shrink-0 items-center gap-3 pt-5 pr-2.5 pl-5">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-foreground">
        <Icon icon={SparklesIcon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg leading-6 font-semibold">Assistant</h2>
        <p className="truncate text-sm text-muted">Analyse la sélection en cours</p>
      </div>
      <div className="flex">
        <HeaderButton icon={RefreshIcon} label="Nouvelle conversation" onClick={onReset} disabled={resetDisabled} />
        {closable && (
          <HeaderButton icon={Cancel01Icon} label="Fermer l'assistant" aria-expanded aria-controls={RIGHT_PANEL_ID} onClick={() => setPanel('right', false)} />
        )}
      </div>
    </div>
  );
}

const chipDot = (c: FilterChip) =>
  c.kind === 'status' ? STATUS_DOT[c.status!] : c.kind === 'risk' ? SEG_BG[c.risk! - 1] : 'bg-muted';

/** Puces qui rappellent la sélection courante, envoyée comme contexte à l'assistant. */
function ContextChips({ total }: { total?: number }) {
  const f = useFilters((s) => s.filters);
  const chips = filterChips(f);
  const all: FilterChip[] = total != null ? [{ label: `Toutes les exigences · ${nf.format(total)}`, kind: 'other' }] : [];
  return (
    <ul aria-label="Contexte de l'analyse" className="flex shrink-0 flex-wrap gap-2 px-5">
      {(chips.length ? chips : all).map((c) => (
        <li key={c.label} className="inline-flex h-8 items-center gap-2 rounded-full border-[1.5px] border-track px-3 text-sm text-foreground-soft">
          <span aria-hidden="true" className={cn('size-1.5 rounded-full', chipDot(c))} />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

/** Mini-cartes des pays cités dans la réponse : volume en risque et barre de 5 segments (au prorata du premier pays). */
function CountryCards({ countries, aggregates }: { countries: string[]; aggregates: Aggregates }) {
  const max = aggregates.byCountry[0]?.count ?? 0;
  const cards = countries
    .map((name) => aggregates.byCountry.find((c) => c.country === name))
    .filter((c): c is Aggregates['byCountry'][number] => c != null)
    .slice(0, 2);
  if (!cards.length) return null;
  return (
    <ul aria-label="Pays cités" className="grid grid-cols-2 gap-2.5">
      {cards.map((c) => (
        <li key={c.country} className="flex flex-col gap-1 rounded-3xl border-2 border-card-border px-4 pt-3 pb-4">
          <span className="truncate text-sm text-muted">{c.country}</span>
          <span className="num-tight text-stat" aria-label={`${nf.format(c.count)} exigences en risque`}>{nf.format(c.count)}</span>
          <SegmentBar value={max ? c.count / max : 0} className="mt-1.5" />
        </li>
      ))}
    </ul>
  );
}

/** Pays de la liste cités dans le texte, dans leur ordre d'apparition. */
function citedCountries(text: string): string[] {
  return COUNTRIES.filter((c) => text.includes(c)).sort((a, b) => text.indexOf(a) - text.indexOf(b));
}

/** Réponse : paragraphes en --foreground-soft, chiffres clés en gras blanc, mini-cartes après le premier paragraphe qui cite des pays. */
function Answer({ text, aggregates, caret }: { text: string; aggregates?: Aggregates; caret?: boolean }) {
  const paragraphs = text.split(/\n\n+/);
  const cardsAt = aggregates ? paragraphs.findIndex((p) => citedCountries(p).length > 0) : -1;
  return (
    <div className="flex flex-col gap-3.5 text-body leading-relaxed text-foreground-soft">
      {paragraphs.map((p, i) => (
        <Fragment key={i}>
          <p className="whitespace-pre-wrap">
            {renderBold(p)}
            {caret && i === paragraphs.length - 1 && <span aria-hidden="true" className="caret ml-1 inline-block h-[1.05em] w-[7px] translate-y-[0.18em] rounded-[1px] bg-foreground" />}
          </p>
          {i === cardsAt && aggregates && <CountryCards countries={citedCountries(p)} aggregates={aggregates} />}
        </Fragment>
      ))}
    </div>
  );
}

function Question({ children }: { children: ReactNode }) {
  return <div className="ml-10 self-end rounded-[22px_22px_6px_22px] bg-surface px-5 py-3.5 text-body leading-relaxed">{children}</div>;
}

/** Échange passé : question + réponse figée, sans curseur ni squelette. */
function PastTurn({ turn }: { turn: Turn }) {
  return (
    <>
      <Question>{turn.question || 'Analyser la sélection courante'}</Question>
      {turn.text && <Answer text={turn.text} />}
      {turn.status === 'aborted' && <p className="text-sm text-muted">Génération interrompue.</p>}
      {turn.status === 'error' && <p className="text-sm text-destructive">Erreur : {turn.error}</p>}
    </>
  );
}

export function AssistantPanel({ assistant, total, aggregates, closable = false }: { assistant: AssistantApi; total?: number; aggregates?: Aggregates; closable?: boolean }) {
  const { status, text, error, question: asked, history, send, stop, reset, ready } = assistant;
  const [question, setQuestion] = useState('');
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-4">
      <AssistantHeader onReset={reset} resetDisabled={busy || status === 'idle'} closable={closable} />
      <ContextChips total={total} />

      <div ref={scrollRef} onScroll={onScroll} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2">
        {/* Conversation : annoncée en poli, et seulement une fois la génération terminée (aria-busy). */}
        <div hidden={status === 'idle'} aria-live="polite" aria-busy={busy} className="flex flex-col gap-4">
          <h3 className="sr-only">Discussion</h3>
          {status !== 'idle' && (
            <>
              {history.map((t) => (
                <PastTurn key={t.id} turn={t} />
              ))}
              {history.length > 0 && <hr className="border-line" />}
              <Question>{asked || 'Analyser la sélection courante'}</Question>

              {status === 'thinking' && (
                <div className="space-y-2" role="status">
                  <p className="text-body text-muted">L'assistant analyse la sélection…</p>
                  <div aria-hidden="true" className="space-y-2">
                    <Skeleton className="h-3 w-3/4 rounded-full" />
                    <Skeleton className="h-3 w-1/2 rounded-full" />
                  </div>
                </div>
              )}

              {text && <Answer text={text} aggregates={aggregates} caret={status === 'streaming'} />}

              {status === 'aborted' && <p className="text-sm text-muted">Génération interrompue.</p>}
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

        <div className="flex flex-col gap-2.5 max-md:hidden">
          <h3 id="assistant-suggestions-title" className="text-sm text-muted">Suggestions</h3>
          <ol aria-labelledby="assistant-suggestions-title" className="flex flex-col gap-2">
            {SUGGESTIONS.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  disabled={busy || !ready}
                  onClick={() => send(s)}
                  aria-keyshortcuts={String(i + 1)}
                  className="flex min-h-[46px] w-full items-center gap-3 rounded-pill border-[1.5px] border-track px-5 py-2 text-left text-body hover:bg-surface disabled:text-muted disabled:hover:bg-transparent"
                >
                  <span className="flex-1">{s}</span>
                  <span aria-hidden="true" className="text-caption text-muted tabular-nums">{i + 1}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-3 px-5">
        {busy && (
          <button
            type="button"
            onClick={stop}
            aria-keyshortcuts="Escape"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-body hover:bg-track"
          >
            <Icon icon={StopCircleIcon} size={20} />
            Arrêter
            <span aria-hidden="true" className="text-muted">Échap</span>
          </button>
        )}

        <form onSubmit={onSubmit} className="flex h-[58px] w-full items-center gap-2 rounded-full bg-surface pr-[9px] pl-6 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground">
          <label htmlFor="assistant-input" className="sr-only">
            Question à l'assistant
          </label>
          <textarea
            id="assistant-input"
            rows={1}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Demander à Cadran…"
            className="h-6 flex-1 resize-none bg-transparent text-body leading-6 outline-none placeholder:text-muted focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={!ready || busy}
            aria-label="Envoyer"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:bg-track disabled:text-muted"
          >
            <Icon icon={ArrowUp02Icon} size={20} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}
