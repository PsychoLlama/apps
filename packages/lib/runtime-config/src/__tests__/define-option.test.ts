import { defineOption } from '../define-option';

describe('defineOption', () => {
  it('returns the id and per-environment defaults verbatim', () => {
    const option = defineOption('my-feature', {
      development: { enabled: true },
      staging: { enabled: true },
      production: { enabled: false },
    });

    expect(option.id).toBe('my-feature');
    expect(option.defaults.development).toEqual({ enabled: true });
    expect(option.defaults.production).toEqual({ enabled: false });
  });

  it('carries arbitrary JSON-serializable payloads, not just flags', () => {
    const option = defineOption('retry-policy', {
      development: { attempts: 1, backoff: [100, 200] },
      staging: { attempts: 3, backoff: [100, 200, 400] },
      production: { attempts: 5, backoff: [100, 200, 400, 800, 1600] },
    });

    expect(option.defaults.production.attempts).toBe(5);
    expect(option.defaults.development.backoff).toEqual([100, 200]);
  });
});
