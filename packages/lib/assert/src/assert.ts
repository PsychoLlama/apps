/**
 * Raised by {@link assert} when an invariant doesn't hold. The `name` marks
 * it as a broken invariant rather than a domain failure, so log readers and
 * `instanceof` checks can tell a bug from a condition a caller could
 * legitimately hit.
 *
 * The value that failed the check is preserved on `cause`. It's always
 * falsy — that's why it threw — but *which* falsy value it was is the first
 * thing you want when reading the failure: `undefined` points at a missing
 * lookup, `''` at an empty string that made it further than it should have.
 */
export class AssertionError extends Error {
  constructor(message: string, value: unknown) {
    super(message, { cause: value });
    this.name = 'AssertionError';
  }
}

/**
 * Throws unless `value` is truthy. Narrows `value` for everything after the
 * call, so a nullable handle becomes non-nullable without a cast.
 *
 * ```ts
 * const el = ref();
 * assert(el, 'Component mounted without a root element.');
 * el.focus(); // `el` is no longer `HTMLElement | undefined`.
 * ```
 *
 * The message is required. An assertion only pays for itself when the
 * failure explains which invariant broke — `assert(x)` alone says less than
 * the stack trace already does.
 *
 * Punctuate it, and capitalize it unless it opens with a name the code
 * spells lowercase. These land in logs beside prose from every other
 * reporter, and an unpunctuated fragment reads as debris next to them.
 * Terse is fine, though — `'No scroll layer.'` says its piece.
 *
 * This is a hard failure, not a recoverable one. Reach for it where a falsy
 * value means the program is already wrong (a "can't happen" branch, a
 * precondition the caller owns), and throw a domain error where the
 * condition is something a caller could legitimately hit.
 *
 * @throws {AssertionError} When `value` is falsy.
 */
// The signature is annotated on the binding rather than inferred from the
// arrow: TypeScript only honors an assertion signature when the callee's
// declaration spells it out.
export const assert: (value: unknown, message: string) => asserts value = (
  value,
  message,
) => {
  if (!value) {
    throw new AssertionError(message, value);
  }
};
