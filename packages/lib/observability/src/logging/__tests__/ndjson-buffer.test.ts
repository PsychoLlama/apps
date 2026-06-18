import { type Log, level } from '@holz/core';
import { createNdjsonBuffer } from '../ndjson-buffer.ts';

const makeLog = (message: string): Log => ({
  timestamp: 0,
  message,
  level: level.info,
  origin: ['@lib/observability', 'ndjson-buffer'],
  context: {},
});

// Drain `count` NDJSON lines from the buffer's readable end.
const readLines = async (
  readable: ReadableStream<Uint8Array>,
  count: number,
): Promise<string[]> => {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  const lines: string[] = [];
  let text = '';

  while (lines.length < count) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    let newline = text.indexOf('\n');
    while (newline !== -1) {
      lines.push(text.slice(0, newline));
      text = text.slice(newline + 1);
      newline = text.indexOf('\n');
    }
  }

  reader.releaseLock();
  return lines;
};

describe('createNdjsonBuffer', () => {
  it('serializes each log to one line of NDJSON', async () => {
    const { backend, readable } = createNdjsonBuffer();

    backend(makeLog('hello'));

    const [line] = await readLines(readable, 1);
    expect(JSON.parse(line)).toMatchObject({ msg: 'hello' });
  });

  it('buffers a burst without dropping logs', async () => {
    const { backend, readable } = createNdjsonBuffer();

    // A synchronous burst is the failure mode the deep buffer exists to absorb:
    // a shallow (high-water-mark 1) stream would drop all but the first log.
    const count = 200;
    for (let index = 0; index < count; index++) {
      backend(makeLog(`log-${index}`));
    }

    const lines = await readLines(readable, count);
    const messages = lines.map(
      (line) => (JSON.parse(line) as { msg: string }).msg,
    );
    expect(messages).toEqual(
      Array.from({ length: count }, (_unused, index) => `log-${index}`),
    );
  });
});
