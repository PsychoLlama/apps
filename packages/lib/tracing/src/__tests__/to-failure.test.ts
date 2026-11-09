import { CoercedError, toFailure } from '../to-failure';

describe('toFailure', () => {
  it('passes existing errors through untouched', () => {
    const error = new TypeError('boom');

    expect(toFailure(error).error).toBe(error);
  });

  it('upgrades non-error values to a CoercedError', () => {
    const { error } = toFailure('boom');

    expect(error).toBeInstanceOf(CoercedError);
    expect(error.name).toBe('CoercedError');
    expect(error.message).toBe('boom');
  });

  it('preserves the original thrown value on cause', () => {
    const value = { code: 42 };

    expect(toFailure(value).error.cause).toBe(value);
  });

  it('stringifies non-string thrown values for the message', () => {
    expect(toFailure(42).error.message).toBe('42');
    expect(toFailure(null).error.message).toBe('null');
    expect(toFailure(undefined).error.message).toBe('undefined');
  });
});
