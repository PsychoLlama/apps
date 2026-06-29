import { defineOption } from '../define-option';
import { channelName } from '../channel';
import {
  readAllEnvironments,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
} from '../config';

// Exercises the real OPFS-backed path in a browser. Each test wipes the
// config directory so persisted overrides don't leak between cases.
afterEach(async () => {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry('config', { recursive: true }).catch(() => {});
});

const flag = (id: string) =>
  defineOption(id, {
    development: { enabled: true },
    staging: { enabled: true },
    production: { enabled: false },
  });

describe('updateConfig', () => {
  it('persists a per-environment patch that a later read reflects', async () => {
    const option = flag('persist');

    await updateConfig(option, { production: { enabled: true } });

    expect(await readAllEnvironments(option)).toEqual({
      development: { enabled: true },
      staging: { enabled: true },
      production: { enabled: true },
    });
  });

  it('reflects a persisted override through readEnvironment', async () => {
    const option = flag('persist-single');

    await updateConfig(option, { production: { enabled: true } });

    expect(await readEnvironment(option, 'production')).toEqual({
      enabled: true,
    });
    // An environment with no override still falls back to its default.
    expect(await readEnvironment(option, 'development')).toEqual({
      enabled: true,
    });
  });

  it('falls back to defaults when the stored file is corrupt', async () => {
    const option = flag('corrupt');

    // Write garbage straight into the option's file, bypassing the JSON
    // round-trip `updateConfig` would otherwise guarantee.
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle('config', { create: true });
    const handle = await dir.getFileHandle('corrupt.json', { create: true });
    const writable = await handle.createWritable();
    await writable.write('{ not json');
    await writable.close();

    expect(await readAllEnvironments(option)).toEqual({
      development: { enabled: true },
      staging: { enabled: true },
      production: { enabled: false },
    });
  });

  it('merges successive patches across environments', async () => {
    const option = flag('merge');

    await updateConfig(option, { production: { enabled: true } });
    await updateConfig(option, { development: { enabled: false } });

    expect(await readAllEnvironments(option)).toEqual({
      development: { enabled: false },
      staging: { enabled: true },
      production: { enabled: true },
    });
  });
});

describe('reset', () => {
  it('reverts a single environment to its default, leaving others', async () => {
    const option = flag('reset-one');
    await updateConfig(option, {
      development: { enabled: false },
      production: { enabled: true },
    });

    await reset(option, ['production']);

    expect(await readAllEnvironments(option)).toEqual({
      development: { enabled: false },
      staging: { enabled: true },
      production: { enabled: false },
    });
  });

  it('clears every environment by default', async () => {
    const option = flag('reset-all');
    await updateConfig(option, {
      development: { enabled: false },
      production: { enabled: true },
    });

    await reset(option);

    expect(await readAllEnvironments(option)).toEqual({
      development: { enabled: true },
      staging: { enabled: true },
      production: { enabled: false },
    });
  });
});

describe('subscribe', () => {
  // The next value handed to a subscriber, as a promise. Tests await delivery
  // rather than racing it — cross-context posts arrive asynchronously.
  const nextValue = (option: ReturnType<typeof flag>) =>
    new Promise((resolve) => {
      const unsubscribe = subscribe(option, (value) => {
        unsubscribe();
        resolve(value);
      });
    });

  // A sibling browsing context, faked by posting on the option's channel from
  // a second `BroadcastChannel` instance (a channel never echoes its own
  // posts, so the post must come from a distinct instance).
  const fromSibling = (id: string, override: unknown) => {
    const sibling = new BroadcastChannel(channelName(id));
    sibling.postMessage(override);
    sibling.close();
  };

  it('reports the current environment value on a change from another context', async () => {
    const option = flag('subscribe');
    const value = nextValue(option);
    fromSibling(option.id, { development: { enabled: false } });

    // Resolves the override against the option, then narrows to the
    // environment vitest runs as (development).
    expect(await value).toEqual({ enabled: false });
  });

  it('ignores changes to other options — each rides its own channel', async () => {
    const option = flag('subscribe-filtered');
    const calls: unknown[] = [];
    const unsubscribe = subscribe(option, (value) => calls.push(value));

    fromSibling('some-other-option', { development: { enabled: false } });
    await new Promise((resolve) => setTimeout(resolve));
    unsubscribe();

    expect(calls).toHaveLength(0);
  });

  it('echoes a same-context write back to the subscriber', async () => {
    const option = flag('subscribe-self');
    const value = nextValue(option);

    await updateConfig(option, { development: { enabled: false } });

    expect(await value).toEqual({ enabled: false });
  });

  it('echoes a same-context reset back to the subscriber', async () => {
    const option = flag('subscribe-self-reset');
    await updateConfig(option, { development: { enabled: false } });

    const value = nextValue(option);
    await reset(option);

    // Reset reverts development to its default (enabled).
    expect(await value).toEqual({ enabled: true });
  });
});
