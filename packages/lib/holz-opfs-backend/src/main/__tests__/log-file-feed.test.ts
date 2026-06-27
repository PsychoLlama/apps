import { type LogFileCreated, subscribeLogFiles } from '../log-file-feed';

// The channel name `subscribeLogFiles` listens on (mirrors the module's
// private constant). Tests post over a raw `BroadcastChannel` to stand in for
// an external announcer — a `BroadcastChannel` never delivers to the instance
// that posts, so a separate one is the only way to reach the subscriber.
const LOG_FILE_CHANNEL = 'holz-opfs:log-files';

const announce = (file: string): void => {
  const channel = new BroadcastChannel(LOG_FILE_CHANNEL);
  channel.postMessage({ file } satisfies LogFileCreated);
  channel.close();
};

describe('log-file feed', () => {
  it('delivers an announcement to a subscriber', async () => {
    const received = new Promise<LogFileCreated>((resolve) => {
      const unsubscribe = subscribeLogFiles((event) => {
        unsubscribe();
        resolve(event);
      });

      announce('1-a.ndjson');
    });

    expect(await received).toEqual({ file: '1-a.ndjson' });
  });

  it('stops delivering after unsubscribe', async () => {
    const seen: LogFileCreated[] = [];
    const unsubscribe = subscribeLogFiles((event) => seen.push(event));

    // A second, persistent subscriber doubles as a delivery barrier: once it
    // hears an announcement, anything posted before it has already routed.
    const settled = new Promise<void>((resolve) => {
      const barrier = subscribeLogFiles(() => {
        barrier();
        resolve();
      });

      unsubscribe();
      announce('1-a.ndjson');
    });

    await settled;
    expect(seen).toEqual([]);
  });
});
