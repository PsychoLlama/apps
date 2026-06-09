import { CoercedError, toError } from '../to-error.ts';

describe('toError', () => {
  it('passes existing errors through untouched', () => {
    const error = new TypeError('boom');

    expect(toError(error)).toBe(error);
  });

  it('upgrades non-error values to a CoercedError', () => {
    const error = toError('boom');

    expect(error).toBeInstanceOf(CoercedError);
    expect(error.name).toBe('CoercedError');
    expect(error.message).toBe('boom');
  });

  it('preserves the original thrown value on cause', () => {
    const value = { code: 42 };

    expect(toError(value).cause).toBe(value);
  });

  it('stringifies non-string thrown values for the message', () => {
    expect(toError(42).message).toBe('42');
    expect(toError(null).message).toBe('null');
    expect(toError(undefined).message).toBe('undefined');
  });
});
