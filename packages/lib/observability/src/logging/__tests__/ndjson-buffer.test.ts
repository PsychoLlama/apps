import { type Log, createLogger } from '@holz/core';
import { createNdjsonBuffer } from '../ndjson-buffer.ts';

const setup = (highWaterMark?: number) => {
  const { backend, readable } = createNdjsonBuffer(highWaterMark);
  const logger = createLogger(backend)
    .namespace('@lib/observability')
    .namespace('ndjson-buffer');
  return { logger, backend, readable };
};

// Drain `count` logs from the buffer's readable end. Each chunk is exactly one
// UTF-8 NDJSON record, so decode-and-parse it directly — no line reassembly.
// `createJsonBackend` renames a `Log`'s fields on the wire (`msg`, a string
// `level`, `time`), so assertions go through `toMatchObject` rather than the
// typed fields.
const readLogs = async (
  readable: ReadableStream<Uint8Array>,
  count: number,
): Promise<Log[]> => {
  const decoder = new TextDecoder();
  const logs: Log[] = [];

  for await (const chunk of readable) {
    logs.push(JSON.parse(decoder.decode(chunk)) as Log);
    if (logs.length === count) break;
  }

  return logs;
};

describe('createNdjsonBuffer', () => {
  it('serializes each log to one line of NDJSON', async () => {
    const { logger, readable } = setup();

    logger.info('hello');

    const logs = await readLogs(readable, 1);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      level: 'info',
      msg: 'hello',
      origin: ['@lib/observability', 'ndjson-buffer'],
    });
  });

  it('buffers a burst without dropping logs', async () => {
    const { logger, readable } = setup();

    // A synchronous burst is the failure mode the deep buffer exists to absorb:
    // a shallow (high-water-mark 1) stream would drop all but the first log.
    const count = 200;
    for (let index = 0; index < count; index++) {
      logger.info(`log-${index}`);
    }

    const logs = await readLogs(readable, count);
    expect(logs).toHaveLength(count);
    expect(logs).toMatchObject(
      Array.from({ length: count }, (_unused, index) => ({
        msg: `log-${index}`,
      })),
    );
  });
});
