import { defineConfig } from '../define-config';
import { readAllEnvironments, readEnvironment } from '../config';

// jsdom has no OPFS, so the reads resolve to the bare defaults here. The
// persistence round-trip and cross-context `subscribe` behavior — both of
// which need real browser APIs — live in `config.test.browser.ts`.

const flag = (id: string) =>
  defineConfig(id, {
    development: { enabled: true },
    staging: { enabled: true },
    production: { enabled: false },
  });

describe('readAllEnvironments', () => {
  it('resolves to the full per-environment defaults when nothing is stored', async () => {
    expect(await readAllEnvironments(flag('read-defaults'))).toEqual({
      development: { enabled: true },
      staging: { enabled: true },
      production: { enabled: false },
    });
  });
});

describe('readEnvironment', () => {
  it('defaults to the current environment (development under vitest)', async () => {
    expect(await readEnvironment(flag('read-current'))).toEqual({
      enabled: true,
    });
  });

  it('reads the value for an explicit environment', async () => {
    expect(await readEnvironment(flag('read-explicit'), 'production')).toEqual({
      enabled: false,
    });
  });
});

describe('OPFS denial', () => {
  // Safari private browsing exposes `getDirectory` but denies the call with a
  // `SecurityError`. Force that here and assert reads degrade to defaults
  // rather than rejecting.
  const denyOpfs = (name: string) => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'storage');
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        getDirectory: () => Promise.reject(new DOMException('denied', name)),
      },
    });
    return () => {
      if (original) Object.defineProperty(navigator, 'storage', original);
      else delete (navigator as { storage?: unknown }).storage;
    };
  };

  it.each(['SecurityError', 'NotAllowedError'])(
    'falls back to defaults when getDirectory throws %s',
    async (name) => {
      const restore = denyOpfs(name);
      try {
        expect(await readAllEnvironments(flag('opfs-denied'))).toEqual({
          development: { enabled: true },
          staging: { enabled: true },
          production: { enabled: false },
        });
      } finally {
        restore();
      }
    },
  );

  it('rethrows an unrecognized getDirectory failure', async () => {
    const restore = denyOpfs('AbortError');
    try {
      await expect(readAllEnvironments(flag('opfs-fault'))).rejects.toThrow(
        DOMException,
      );
    } finally {
      restore();
    }
  });
});
