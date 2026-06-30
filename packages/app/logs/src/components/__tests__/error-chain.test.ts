import { errorChain } from '../error-chain';

describe('errorChain', () => {
  it('returns a single frame for an error with no cause', () => {
    const error = new TypeError('boom');

    expect(errorChain(error)).toEqual([{ name: 'TypeError', message: 'boom' }]);
  });

  it('walks the cause chain outermost first', () => {
    const root = new RangeError('out of range');
    const middle = new Error('failed to parse', { cause: root });
    const outer = new Error('request failed', { cause: middle });

    expect(errorChain(outer)).toEqual([
      { name: 'Error', message: 'request failed' },
      { name: 'Error', message: 'failed to parse' },
      { name: 'RangeError', message: 'out of range' },
    ]);
  });

  it('reads the preserved name when the prototype has collapsed to Error', () => {
    // What IndexedDB hands back: a plain Error carrying the original name.
    const hydrated = new Error('bad input');
    hydrated.name = 'TypeError';

    expect(errorChain(hydrated)).toEqual([
      { name: 'TypeError', message: 'bad input' },
    ]);
  });

  it('appends a non-error cause tail as a final frame', () => {
    const error = new Error('coerced', { cause: 'just a string' });

    expect(errorChain(error)).toEqual([
      { name: 'Error', message: 'coerced' },
      { name: 'cause', message: 'just a string' },
    ]);
  });

  it('serializes an object cause tail rather than stringifying it blindly', () => {
    const error = new Error('coerced', { cause: { code: 42 } });

    expect(errorChain(error)).toEqual([
      { name: 'Error', message: 'coerced' },
      { name: 'cause', message: '{"code":42}' },
    ]);
  });

  it('stops on a cyclic cause instead of looping forever', () => {
    const error = new Error('self');
    error.cause = error;

    expect(errorChain(error)).toEqual([{ name: 'Error', message: 'self' }]);
  });
});
