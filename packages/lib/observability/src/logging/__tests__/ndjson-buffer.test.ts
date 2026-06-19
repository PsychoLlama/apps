import { createLogger } from '@holz/core';
import { createNdjsonBuffer } from '../ndjson-buffer.ts';

const setup = (highWaterMark?: number) => {
  const { backend, readable } = createNdjsonBuffer(highWaterMark);
  const logger = createLogger(backend)
    .namespace('@lib/observability')
    .namespace('ndjson-buffer');
  return { logger, backend, readable };
};

// Collect every NDJSON line currently buffered. The buffer is a fully-populated
// synchronous source with no further writes, so a `read()` that doesn't settle
// within a macrotask means we've drained everything queued. Each chunk is
// exactly one UTF-8 NDJSON record, so decode-and-parse it directly.
const drainBuffered = async (
  readable: ReadableStream<Uint8Array>,
): Promise<Array<{ msg: string }>> => {
  const decoder = new TextDecoder();
  const reader = readable.getReader();
  const logs: Array<{ msg: string }> = [];

  for (;;) {
    const result = await Promise.race([
      reader.read(),
      new Promise<'idle'>((resolve) => setTimeout(() => resolve('idle'))),
    ]);
    if (result === 'idle' || result.done) break;
    logs.push(JSON.parse(decoder.decode(result.value)) as { msg: string });
  }

  return logs;
};

describe('createNdjsonBuffer', () => {
  it('serializes each log to one line of NDJSON', async () => {
    const { logger, readable } = setup();

    logger.info('hello');

    const logs = await drainBuffered(readable);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ msg: 'hello' });
  });

  it('buffers a burst without dropping logs', async () => {
    const { logger, readable } = setup();

    // A synchronous burst is the failure mode the deep buffer exists to absorb:
    // a shallow (high-water-mark 1) stream would drop all but the first log.
    const count = 200;
    for (let index = 0; index < count; index++) {
      logger.info(`log-${index}`);
    }

    const logs = await drainBuffered(readable);
    expect(logs).toHaveLength(count);
    expect(logs.map((log) => log.msg)).toEqual(
      Array.from({ length: count }, (_unused, index) => `log-${index}`),
    );
  });

  it('drops logs once a shallow buffer fills', async () => {
    // A low high-water mark caps how much a burst can buffer: the backend skips
    // writes once `desiredSize` hits 0, so only the first `highWaterMark` logs
    // survive. This proves the parameter is wired through.
    const { logger, readable } = setup(2);

    for (let index = 0; index < 50; index++) {
      logger.info(`log-${index}`);
    }

    const logs = await drainBuffered(readable);
    expect(logs).toHaveLength(2);
    expect(logs.map((log) => log.msg)).toEqual(['log-0', 'log-1']);
  });
});
