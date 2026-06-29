import { defineOption } from '../define-option';
import {
  readAllEnvironments,
  readEnvironment,
  readEnvironmentDefault,
} from '../config';

// jsdom has no OPFS, so the reads resolve to the bare defaults here. The
// persistence round-trip and cross-context `subscribe` behavior — both of
// which need real browser APIs — live in `config.test.browser.ts`.

const flag = (id: string) =>
  defineOption(id, {
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

describe('readEnvironmentDefault', () => {
  it('returns the shipped default synchronously, ignoring overrides', () => {
    expect(readEnvironmentDefault(flag('read-default'), 'production')).toEqual({
      enabled: false,
    });
  });

  it('defaults to the current environment (development under vitest)', () => {
    expect(readEnvironmentDefault(flag('read-default-current'))).toEqual({
      enabled: true,
    });
  });
});
