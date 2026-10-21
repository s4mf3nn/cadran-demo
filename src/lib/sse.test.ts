import { describe, expect, it } from 'vitest';
import { readSSE } from './sse';

function streamOf(chunks: string[]) {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach((ch) => c.enqueue(enc.encode(ch)));
      c.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const out: string[] = [];
  for await (const d of readSSE(stream)) out.push(d);
  return out;
}

describe('readSSE', () => {
  it('découpe les événements', async () => {
    expect(await collect(streamOf(['data: a\n\ndata: b\n\n']))).toEqual(['a', 'b']);
  });

  it("recolle un événement coupé entre deux chunks réseau", async () => {
    expect(await collect(streamOf(['data: {"del', 'ta":"x"}\n', '\ndata: [DONE]\n\n']))).toEqual([
      '{"delta":"x"}',
      '[DONE]',
    ]);
  });

  it('ignore les commentaires et lignes non data', async () => {
    expect(await collect(streamOf([': keep-alive\n\nevent: msg\ndata: ok\n\n']))).toEqual(['ok']);
  });
});
