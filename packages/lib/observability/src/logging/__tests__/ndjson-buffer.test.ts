import { type Log, level } from '@holz/core';
import { createNdjsonBuffer } from '../ndjson-buffer.ts';

const makeLog = (message: string): Log => ({
  timestamp: 0,
  message,
  level: level.info,
  origin: ['@lib/observability', 'ndjson-buffer'],
  context: {},
});

// Drain `count` logs from the buffer's readable end. Each chunk is exactly one
// UTF-8 NDJSON record, so decode-and-parse it directly — no line reassembly.
const readLogs = async (
  readable: ReadableStream<Uint8Array>,
  count: number,
): Promise<Array<{ msg: string }>> => {
  const decoder = new TextDecoder();
  const logs: Array<{ msg: string }> = [];

  for await (const chunk of readable) {
    logs.push(JSON.parse(decoder.decode(chunk)) as { msg: string });
    if (logs.length === count) break;
  }

  return logs;
};

describe('createNdjsonBuffer', () => {
  it('serializes each log to one line of NDJSON', async () => {
    const { backend, readable } = createNdjsonBuffer();

    backend(makeLog('hello'));

    const [log] = await readLogs(readable, 1);
    expect(log).toMatchObject({ msg: 'hello' });
  });

  it('buffers a burst without dropping logs', async () => {
    const { backend, readable } = createNdjsonBuffer();

    // A synchronous burst is the failure mode the deep buffer exists to absorb:
    // a shallow (high-water-mark 1) stream would drop all but the first log.
    const count = 200;
    for (let index = 0; index < count; index++) {
      backend(makeLog(`log-${index}`));
    }

    const logs = await readLogs(readable, count);
    expect(logs.map((log) => log.msg)).toEqual(
      Array.from({ length: count }, (_unused, index) => `log-${index}`),
    );
  });
});
