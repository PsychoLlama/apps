import { defineOption } from '../define-option';
import { read } from '../config';

// jsdom has no OPFS, so `read` resolves to the bare defaults here. The
// persistence round-trip and cross-context `subscribe` behavior — both of
// which need real browser APIs — live in `config.test.browser.ts`.

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
