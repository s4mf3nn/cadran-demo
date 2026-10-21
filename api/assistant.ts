import { buildAnswer, safeJson, tokenize } from '../server/answer.js';

/**
 * Équivalent en production du plugin Vite `mockLlm` (qui n'existe qu'en `vite dev`).
 * POST /api/assistant  { question, context }  ->  text/event-stream
 */
export async function POST(request: Request): Promise<Response> {
  const parsed = safeJson(await request.text());
  const question = String(parsed.question ?? '');
  const context = (parsed.context ?? {}) as Record<string, unknown>;
  const tokens = tokenize(buildAnswer(question, context));
  const encoder = new TextEncoder();
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Même « temps de réflexion » que le mock de dev.
      await sleep(700);
      for (const token of tokens) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: token })}\n\n`));
        await sleep(25 + Math.random() * 45);
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform' },
  });
}
