import type { Plugin } from 'vite';

/**
 * Faux endpoint LLM servi par le dev server Vite.
 * POST /api/assistant  { question, context }  ->  text/event-stream
 *
 * Il simule ce que renverrait une vraie API d'IA : de la latence avant le
 * premier token, puis un flux de tokens au format SSE, terminé par [DONE].
 * Côté front, on le consomme exactement comme on consommerait OpenAI,
 * Anthropic ou une API maison.
 */
export function mockLlmPlugin(): Plugin {
  return {
    name: 'mock-llm',
    configureServer(server) {
      server.middlewares.use('/api/assistant', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const parsed = safeJson(body);
          const question = String(parsed.question ?? '');
          const context = (parsed.context ?? {}) as Record<string, unknown>;
          const answer = buildAnswer(question, context);
          const tokens = answer.match(/\S+\s*/g) ?? [];

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });

          let i = 0;
          let closed = false;
          // Écouter la réponse et non la requête : req émet 'close' dès que le body est lu.
          res.on('close', () => (closed = true));

          // "Temps de réflexion" avant le premier token, pour exercer les états d'attente.
          setTimeout(function tick() {
            if (closed) return;
            if (i >= tokens.length) {
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }
            res.write(`data: ${JSON.stringify({ delta: tokens[i++] })}\n\n`);
            setTimeout(tick, 25 + Math.random() * 45);
          }, 700);
        });
      });
    },
  };
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function buildAnswer(question: string, context: Record<string, unknown>): string {
  const total = Number(context.total ?? 0).toLocaleString('fr-FR');
  const atRisk = Number(context.atRisk ?? 0).toLocaleString('fr-FR');
  const topCountry = String(context.topCountry ?? 'n/a');
  return [
    `Analyse de la sélection courante (${total} exigences).`,
    `\n\n**Constat principal** : ${atRisk} exigences sont non conformes ou en risque élevé, avec une concentration sur ${topCountry}.`,
    `\n\n**Recommandation** : prioriser un plan de validation pour les catégories à fort risque sur ce marché, puis vérifier les échéances à moins de 90 jours.`,
    question ? `\n\nPour répondre à « ${question} » : je m'appuie uniquement sur les filtres actifs, ces chiffres sont donc à recouper avec le référentiel source.` : '',
  ].join('');
}
