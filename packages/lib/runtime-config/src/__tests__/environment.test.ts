import { environment, resolveEnvironment } from '../environment';

describe('resolveEnvironment', () => {
  it('maps Vite production builds to prod', () => {
    expect(resolveEnvironment('production')).toBe('prod');
  });

  it('maps the dev server to dev', () => {
    expect(resolveEnvironment('development')).toBe('dev');
  });

  it('maps the preview build mode to staging', () => {
    expect(resolveEnvironment('staging')).toBe('staging');
  });

  it('falls back to dev for unrecognized modes (e.g. vitest test)', () => {
    expect(resolveEnvironment('test')).toBe('dev');
    expect(resolveEnvironment('')).toBe('dev');
  });
});

describe('environment', () => {
  it('resolves to dev under the test runner', () => {
    expect(environment).toBe('dev');
  });
});
