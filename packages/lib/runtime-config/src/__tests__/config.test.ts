import { defineOption } from '../define-option';
import { read, subscribe, updateConfig } from '../config';

// jsdom has no OPFS, so persistence is a no-op here: `read` always
// resolves to defaults and `updateConfig` exercises only the in-memory
// notify path. The OPFS round-trip is covered in `config.test.browser.ts`.

const flag = (id: string) =>
  defineOption(id, {
    dev: { enabled: true },
    staging: { enabled: true },
    prod: { enabled: false },
  });

describe('read', () => {
  it('resolves to the full per-environment defaults when nothing is stored', async () => {
    expect(await read(flag('read-defaults'))).toEqual({
      dev: { enabled: true },
      staging: { enabled: true },
      prod: { enabled: false },
    });
  });
});

describe('subscribe', () => {
  it('notifies the listener with the resolved map on update', async () => {
    const option = flag('subscribe-notify');
    const calls: Array<Record<string, unknown>> = [];
    const unsubscribe = subscribe(option, (config) => calls.push(config));

    await updateConfig(option, { prod: { enabled: true } });

    expect(calls).toEqual([
      {
        dev: { enabled: true },
        staging: { enabled: true },
        prod: { enabled: true },
      },
    ]);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', async () => {
    const option = flag('subscribe-unsub');
    const calls: unknown[] = [];
    const unsubscribe = subscribe(option, (config) => calls.push(config));

    unsubscribe();
    await updateConfig(option, { prod: { enabled: true } });

    expect(calls).toHaveLength(0);
  });
});
