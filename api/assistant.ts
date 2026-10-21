import { buildAnswer, safeJson } from '../server/answer';

/**
 * Équivalent production de server/mockLlm.ts : fonction Vercel qui renvoie
 * le même flux SSE (latence initiale, tokens, puis [DONE]).
 */
export async function POST(request: Request): Promise<Response> {
  const parsed = safeJson(await request.text());
  const question = String(parsed.question ?? '');
  const context = (parsed.context ?? {}) as Record<string, unknown>;
  const tokens = buildAnswer(question, context).match(/\S+\s*/g) ?? [];

  const encoder = new TextEncoder();
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const aborted = () => request.signal.aborted;
      await sleep(700);
      for (const token of tokens) {
        if (aborted()) break;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: token })}\n\n`));
        await sleep(25 + Math.random() * 45);
      }
      if (!aborted()) controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
