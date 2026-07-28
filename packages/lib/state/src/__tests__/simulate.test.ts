import { atomic, call, commit, defineSaga, read, spawn } from '../saga';
import { defineScope } from '../scope';
import { defineCell } from '../space';
import { simulate } from '../simulate';
import { defineTopic } from '../topic';

const opening = defineTopic<string>();
const qrReady = defineTopic<string>();
const connected = defineTopic<string>();
const failed = defineTopic<string>();

const renderQr = async (_signal: AbortSignal, endpoint: string) =>
  `qr:${endpoint}`;

const connectRelay = async (_signal: AbortSignal, endpoint: string) =>
  `relay:${endpoint}`;

const scope = defineScope();

const generateQr = defineSaga(scope, async function* (endpoint: string) {
  const grid = yield* call(renderQr, endpoint);
  yield commit(qrReady(grid));
  return grid;
});

const connect = defineSaga(scope, async function* (endpoint: string) {
  const relay = yield* call(connectRelay, endpoint);
  yield commit(connected(relay));
  return relay;
});

const openSession = defineSaga(scope, async function* (endpoint: string) {
  yield commit(opening(endpoint));

  try {
    const [, relay] = yield* atomic(generateQr(endpoint), connect(endpoint));
    return relay;
  } catch (error) {
    yield commit(failed((error as Error).message));
    return null;
  }
});

/** Resolve after queued macrotasks drain, forcing a stable arrival order. */
const afterTick = <T>(value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value));
  });

describe('simulate', () => {
  it('records each commit, fusing atomic children into one entry', async () => {
    const trace = await simulate(openSession('ep'), {
      calls: [
        [renderQr, async () => 'grid'],
        [connectRelay, () => afterTick('relay')],
      ],
    });

    expect(trace.commits).toEqual([
      [opening('ep')],
      [qrReady('grid'), connected('relay')],
    ]);
    expect(trace.result).toBe('relay');
  });

  it('passes the signal and args to stubs', async () => {
    const stub = vi.fn(async (_signal: AbortSignal, endpoint: string) =>
      endpoint.toUpperCase(),
    );

    const trace = await simulate(generateQr('ep'), {
      calls: [[renderQr, stub]],
    });

    expect(stub).toHaveBeenCalledWith(expect.any(AbortSignal), 'ep');
    expect(trace.commits).toEqual([[qrReady('EP')]]);
  });

  it('throws on unstubbed capabilities', async () => {
    await expect(simulate(generateQr('ep'))).rejects.toThrow(
      /no stub for capability "renderQr"/,
    );
  });

  it('labels anonymous capabilities in stub errors', async () => {
    const saga = defineSaga(scope, async function* () {
      yield* call(async () => 'value');
    });

    await expect(simulate(saga())).rejects.toThrow(/anonymous/);
  });

  it('serves reads from the stub table', async () => {
    const handle = defineCell(scope, () => 'live');
    const inspect = defineSaga(scope, async function* () {
      return yield* read(handle);
    });

    const trace = await simulate(inspect(), { reads: [[handle, 'stubbed']] });
    expect(trace.result).toBe('stubbed');
  });

  it('throws on unstubbed reads', async () => {
    const handle = defineCell(scope, () => 'live');
    const inspect = defineSaga(scope, async function* () {
      return yield* read(handle);
    });

    await expect(simulate(inspect())).rejects.toThrow(
      /no stubbed value for read/,
    );
  });

  it('records spawns without executing them', async () => {
    let executed = false;

    const detached = defineSaga(scope, async function* () {
      executed = true;
      yield commit(opening('never'));
    });

    const parent = defineSaga(scope, async function* () {
      yield* spawn(detached());
    });

    const trace = await simulate(parent());
    expect(trace.spawns).toHaveLength(1);
    expect(trace.commits).toEqual([]);
    expect(executed).toBe(false);
  });

  it('surfaces the recovery path when a fused child fails', async () => {
    const trace = await simulate(openSession('ep'), {
      calls: [
        [renderQr, async () => 'grid'],
        [
          connectRelay,
          async (): Promise<never> => {
            throw new Error('relay unreachable');
          },
        ],
      ],
    });

    // The held qrReady fact was discarded with its atomic block.
    expect(trace.commits).toEqual([
      [opening('ep')],
      [failed('relay unreachable')],
    ]);
    expect(trace.result).toBeNull();
  });

  it('rejects when the saga does not handle a failure', async () => {
    await expect(
      simulate(generateQr('ep'), {
        calls: [
          [
            renderQr,
            async (): Promise<never> => {
              throw new Error('render failed');
            },
          ],
        ],
      }),
    ).rejects.toThrow('render failed');
  });
});
