import { useId, useState, type FormEvent } from 'react';
import { useAssistantStream } from '../hooks/useAssistantStream';
import type { Aggregates } from '../data/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

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
    <Card size="sm" role="region" aria-labelledby={`${inputId}-title`} className="min-h-0 overflow-y-auto">
      <CardHeader>
        <CardTitle id={`${inputId}-title`} role="heading" aria-level={2} className="text-sm">Assistant conformité (IA)</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Label htmlFor={inputId} className="sr-only">Question à l'assistant</Label>
          <Input
            id={inputId}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex. : que dois-je prioriser ce trimestre ?"
            className="flex-1"
          />
          {busy ? (
            <Button key="stop" type="button" variant="secondary" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={!aggregates}>
              Analyser
            </Button>
          )}
        </form>

        {/* Annonce discrète des changements d'état pour les lecteurs d'écran, sans relire chaque token. */}
        <p role="status" className="sr-only">{STATUS_TEXT[status]}</p>

        {status === 'thinking' && (
          <div aria-hidden="true" className="space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        )}

        {text && (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground" aria-busy={busy}>
            {renderBold(text)}
            {status === 'streaming' && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-muted-foreground align-middle" />}
          </div>
        )}

        {status === 'aborted' && <p className="text-xs text-muted-foreground">Génération interrompue.</p>}
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>Erreur : {error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
