import { describe, it, expect } from 'vitest';
import { Readable } from 'stream';

// Import internal helpers for unit tests
// Note: This import points at source; in CI/deploy we rely on compiled output.
import { __internals } from '../functions/src/tutor';

describe('tutor helpers', () => {
  it('cosine similarity basic sanity', () => {
    const { cosine } = __internals as any;
    expect(cosine([1,0], [1,0])).toBeCloseTo(1, 5);
    expect(cosine([1,0], [0,1])).toBeCloseTo(0, 5);
  });

  it('chunkText overlaps and sizes', () => {
    const { chunkText } = __internals as any;
    const text = 'a'.repeat(2500);
    const chunks = chunkText(text, 900, 100);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks[0].end - chunks[0].start).toBeLessThanOrEqual(900);
  });

  it('token estimation ~ chars/4', () => {
    const { estTokensFromChars } = __internals as any;
    expect(estTokensFromChars(400)).toBeCloseTo(100, 0);
    expect(estTokensFromChars(0)).toBe(0);
  });

  it('parses SSE deltas from a node stream', async () => {
    const { streamOpenAIResponse } = __internals as any;
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n',
      'data: [DONE]\n',
    ];
    let output = '';
    const streamed = await streamOpenAIResponse(Readable.from(chunks), (delta: string) => {
      output += delta;
    });
    expect(streamed).toBe(true);
    expect(output).toBe('Hello world');
  });
});
