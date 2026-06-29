import { defineOption } from '../define-option';
import { read, reset, subscribe, updateConfig } from '../config';

// Exercises the real OPFS-backed path in a browser. Each test wipes the
// config directory so persisted overrides don't leak between cases.
afterEach(async () => {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry('config', { recursive: true }).catch(() => {});
});

const flag = (id: string) =>
  defineOption(id, {
    dev: { enabled: true },
    staging: { enabled: true },
    prod: { enabled: false },
  });

describe('updateConfig', () => {
  it('persists a per-environment patch that a later read reflects', async () => {
    const option = flag('persist');

    await updateConfig(option, { prod: { enabled: true } });

    expect(await read(option)).toEqual({
      dev: { enabled: true },
      staging: { enabled: true },
      prod: { enabled: true },
    });
  });

  it('merges successive patches across environments', async () => {
    const option = flag('merge');

    await updateConfig(option, { prod: { enabled: true } });
    await updateConfig(option, { dev: { enabled: false } });

    expect(await read(option)).toEqual({
      dev: { enabled: false },
      staging: { enabled: true },
      prod: { enabled: true },
    });
  });
});

describe('reset', () => {
  it('reverts a single environment to its default, leaving others', async () => {
    const option = flag('reset-one');
    await updateConfig(option, {
      dev: { enabled: false },
      prod: { enabled: true },
    });

    await reset(option, ['prod']);

    expect(await read(option)).toEqual({
      dev: { enabled: false },
      staging: { enabled: true },
      prod: { enabled: false },
    });
  });

  it('clears every environment by default', async () => {
    const option = flag('reset-all');
    await updateConfig(option, {
      dev: { enabled: false },
      prod: { enabled: true },
    });

    await reset(option);

    expect(await read(option)).toEqual({
      dev: { enabled: true },
      staging: { enabled: true },
      prod: { enabled: false },
    });
  });
});

describe('subscribe', () => {
  // A sibling browsing context, faked by posting on a second channel.
  const fromSibling = (id: string, override: unknown) => {
    const sibling = new BroadcastChannel('runtime-config');
    sibling.postMessage({ id, override });
    sibling.close();
  };

  it('fires with the resolved map on a change from another context', async () => {
    const option = flag('subscribe');
    const config = await new Promise((resolve) => {
      const unsubscribe = subscribe(option, (value) => {
        unsubscribe();
        resolve(value);
      });
      fromSibling(option.id, { staging: { enabled: false } });
    });

    expect(config).toEqual({
      dev: { enabled: true },
      staging: { enabled: false },
      prod: { enabled: false },
    });
  });

  it('ignores changes to other options', async () => {
    const option = flag('subscribe-filtered');
    const calls: unknown[] = [];
    const unsubscribe = subscribe(option, (value) => calls.push(value));

    fromSibling('some-other-option', { prod: { enabled: true } });
    await new Promise((resolve) => setTimeout(resolve));
    unsubscribe();

    expect(calls).toHaveLength(0);
  });
});
