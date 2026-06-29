import { defineOption } from '../define-option';

describe('defineOption', () => {
  it('returns the id and per-environment defaults verbatim', () => {
    const option = defineOption('my-feature', {
      dev: { enabled: true },
      staging: { enabled: true },
      prod: { enabled: false },
    });

    expect(option.id).toBe('my-feature');
    expect(option.defaults.dev).toEqual({ enabled: true });
    expect(option.defaults.prod).toEqual({ enabled: false });
  });

  it('carries arbitrary JSON-serializable payloads, not just flags', () => {
    const option = defineOption('retry-policy', {
      dev: { attempts: 1, backoff: [100, 200] },
      staging: { attempts: 3, backoff: [100, 200, 400] },
      prod: { attempts: 5, backoff: [100, 200, 400, 800, 1600] },
    });

    expect(option.defaults.prod.attempts).toBe(5);
    expect(option.defaults.dev.backoff).toEqual([100, 200]);
  });
});
