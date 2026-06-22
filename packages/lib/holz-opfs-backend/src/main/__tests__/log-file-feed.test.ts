import {
  announceLogFile,
  type LogFileCreated,
  subscribeLogFiles,
} from '../log-file-feed';

describe('log-file feed', () => {
  it('delivers an announcement to a subscriber', async () => {
    const received = new Promise<LogFileCreated>((resolve) => {
      const unsubscribe = subscribeLogFiles((event) => {
        unsubscribe();
        resolve(event);
      });

      announceLogFile('1-a.ndjson');
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
      announceLogFile('1-a.ndjson');
    });

    await settled;
    expect(seen).toEqual([]);
  });
});
