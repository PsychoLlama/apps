import { checkPackageManager } from '../package-manager.ts';

describe('checkPackageManager', () => {
  it('accepts an exact match', () => {
    expect(checkPackageManager('pnpm@12.3.4', '12.3.4')).toBeNull();
  });

  it('ignores an integrity hash suffix', () => {
    expect(checkPackageManager('pnpm@12.3.4+sha512.abc', '12.3.4')).toBeNull();
  });

  it('flags a version mismatch', () => {
    expect(checkPackageManager('pnpm@12.3.4', '12.3.5')).toEqual({
      kind: 'version-mismatch',
      actual: '12.3.4',
      expected: '12.3.5',
    });
  });

  it('flags a non-pnpm package manager', () => {
    expect(checkPackageManager('yarn@4.0.0', '12.3.4')).toEqual({
      kind: 'wrong-manager',
      actual: 'yarn@4.0.0',
    });
  });

  it('flags a missing `packageManager` field', () => {
    expect(checkPackageManager(undefined, '12.3.4')).toEqual({
      kind: 'missing-field',
    });
  });

  it('flags a missing flake version', () => {
    expect(checkPackageManager('pnpm@12.3.4', undefined)).toEqual({
      kind: 'missing-flake-version',
    });
  });
});
