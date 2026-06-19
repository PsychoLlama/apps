import type { LogProcessor } from '@holz/core';
import { createJsonBackend } from '@holz/json-backend';

/**
 * A buffered NDJSON log backend paired with the readable end its lines drain
 * from. Write logs through {@link NdjsonBuffer.backend}; pipe
 * {@link NdjsonBuffer.readable} into the eventual sink (an OPFS-backed
 * `WritableStream`, here) once it exists.
 */
export interface NdjsonBuffer {
  /** A {@link LogProcessor} that serializes each log to one line of NDJSON. */
  backend: LogProcessor;

  /** The buffered NDJSON, ready to pipe into a sink. Consume exactly once. */
  readable: ReadableStream<Uint8Array>;
}

/**
 * Build a deep buffer between the JSON backend and an eventual sink. The
 * backend writes from the very first log; nothing reads the {@link
 * NdjsonBuffer.readable readable} end until it's piped into a sink, so the
 * buffer also queues everything logged before the sink connects (worker boot,
 * the `init` round trip).
 *
 * The high-water mark defaults deep for two reasons, both rooted in the sink
 * often being a cross-realm `WritableStream` whose high-water mark is fixed at
 * 1 by spec (`SetUpCrossRealmTransformWritable`): writing to such a stream
 * directly drops `desiredSize` to 0 until the peer acks across the thread
 * boundary, and the JSON backend skips any log written while `desiredSize <=
 * 0`, so a burst (e.g. the startup flurry) would lose all but its first log —
 * verified empirically. Buffering here absorbs those bursts; `pipeTo` later
 * applies backpressure by queuing, never dropping. `highWaterMark` is exposed
 * as a knob; production should keep the default.
 */
export const createNdjsonBuffer = (highWaterMark = 1024): NdjsonBuffer => {
  const buffer = new TransformStream<Uint8Array, Uint8Array>(
    undefined,
    new CountQueuingStrategy({ highWaterMark }),
  );

  return {
    backend: createJsonBackend({ stream: buffer.writable }),
    readable: buffer.readable,
  };
};
