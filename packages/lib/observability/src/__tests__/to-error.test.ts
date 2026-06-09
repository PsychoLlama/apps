import { toError } from '../to-error.ts';

describe('toError', () => {
  it('passes existing errors through untouched', () => {
    const error = new TypeError('boom');

    expect(toError(error)).toBe(error);
  });

  it('wraps non-error values, stringifying them as the message', () => {
    const error = toError('boom');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('boom');
  });

  it('stringifies non-string thrown values', () => {
    expect(toError(42).message).toBe('42');
    expect(toError(null).message).toBe('null');
    expect(toError(undefined).message).toBe('undefined');
  });
});
