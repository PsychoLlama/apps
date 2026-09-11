import { assert, AssertionError } from '../assert';

// Runs `fn` and hands back whatever it threw. Beats `expect(...).toThrow()`
// here because the assertions below inspect four fields of the same error,
// and `toThrow` would have to re-run the call for each one.
const thrownBy = (fn: () => void): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }

  expect.fail('Expected the function to throw.');
};

describe('assert', () => {
  it.each([true, 1, -1, 'value', {}, []])(
    'accepts the truthy value %p',
    (value) => {
      expect(() => assert(value, 'unreachable')).not.toThrow();
    },
  );

  it.each([false, 0, 0n, '', null, undefined, NaN])(
    'rejects the falsy value %p and keeps it on `cause`',
    (value) => {
      const error = thrownBy(() => assert(value, 'it broke'));

      expect(error).toBeInstanceOf(AssertionError);
      expect(error).toHaveProperty('name', 'AssertionError');
      expect(error).toHaveProperty('message', 'it broke');
      expect(error).toHaveProperty('cause', value);
    },
  );
});

describe('type safety', () => {
  it('narrows a nullable union to its defined member', () => {
    const value = 'text' as string | null;

    assert(value, 'expected a string');

    expectTypeOf(value).toEqualTypeOf<string>();
  });

  it('narrows away every falsy member, not just the nullish ones', () => {
    const value = 'text' as string | 0 | false | undefined;

    assert(value, 'expected a string');

    // `''` survives: narrowing is by assignability, and the compiler can't
    // rule an empty string out of the `string` member.
    expectTypeOf(value).toEqualTypeOf<string>();
  });

  it('requires a message', () => {
    const illegal = () => {
      // @ts-expect-error — the message is required
      assert('value');
    };
    void illegal;
  });
});
