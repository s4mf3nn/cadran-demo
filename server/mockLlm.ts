import type { Plugin } from 'vite';
import { buildAnswer, safeJson, tokenize } from './answer.js';

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
          const tokens = tokenize(answer);

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
