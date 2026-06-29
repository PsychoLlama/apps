import { environment, resolveEnvironment } from '../environment';

describe('resolveEnvironment', () => {
  it('maps Vite production builds to production', () => {
    expect(resolveEnvironment('production')).toBe('production');
  });

  it('maps the dev server to development', () => {
    expect(resolveEnvironment('development')).toBe('development');
  });

  it('maps the preview build mode to staging', () => {
    expect(resolveEnvironment('staging')).toBe('staging');
  });

  it('falls back to development for unrecognized modes (e.g. vitest test)', () => {
    expect(resolveEnvironment('test')).toBe('development');
    expect(resolveEnvironment('')).toBe('development');
  });
});

describe('environment', () => {
  it('resolves to development under the test runner', () => {
    expect(environment).toBe('development');
  });
});
