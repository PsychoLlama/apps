import { CoercedError } from '@lib/to-error';

import { toFailure } from '../to-failure';

describe('toFailure', () => {
  it('passes existing errors through untouched', () => {
    const error = new TypeError('boom');

    expect(toFailure(error).error).toBe(error);
  });

  it('coerces non-error values', () => {
    expect(toFailure('boom').error).toBeInstanceOf(CoercedError);
  });
});
